import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphService } from '../graph/graph.service';
import { TransactionsService } from '../transactions/transactions.service';

import {
  SQUAD_MODULE_OPTIONS,
  SQUAD_SANDBOX_BASE_URL,
  SQUAD_PRODUCTION_BASE_URL,
} from '../squad/squad.config';

import type { SquadModuleOptions } from '../squad/squad.config';
import {
  InitiatePaymentDto,
  ChargeCardDto,
  CancelRecurringChargeDto,
  QueryTransactionsDto,
  SimulatePaymentDto,
  AccountLookupDto,
  FundTransferDto,
  RequeryTransferDto,
  GetAllTransfersDto,
  RefundDto,
  VirtualAccountDto,
} from './dto/squad.dto';

import {
  SquadApiResponse,
  InitiatePaymentResponseData,
  VerifyTransactionResponseData,
  ChargeCardResponseData,
  AccountLookupResponseData,
  FundTransferResponseData,
  TransferRecord,
  RefundResponseData,
  TransactionRecord,
} from '../squad/squad.interfaces';

@Injectable()
export class SquadService {
  private readonly http: AxiosInstance;
  private readonly logger = new Logger(SquadService.name);

  constructor(
    @Inject(SQUAD_MODULE_OPTIONS) private readonly options: SquadModuleOptions,
    private readonly prisma: PrismaService,
    private readonly graphService: GraphService,
    private readonly transactionsService: TransactionsService,
  ) {
    const baseURL = options.isProduction
      ? SQUAD_PRODUCTION_BASE_URL
      : SQUAD_SANDBOX_BASE_URL;

    this.http = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${options.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        const status = err.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
          (err.response?.data as any)?.message ??
          err.message ??
          'Squad API error';
        this.logger.error(`Squad API error [${status}]: ${message}`);
        throw new HttpException({ message, raw: err.response?.data }, status);
      },
    );
  }

  async handleWebhook(payload: Record<string, any>, signature?: string) {
    if (!this.isValidWebhookSignature(payload, signature)) {
      throw new UnauthorizedException('Invalid Squad webhook signature');
    }

    // const eventType =
    //   this.resolveFirstString(payload, ['event', 'type', 'event_type']) ??
    //   'squad.webhook';
    const data = this.resolveEventData(payload);
    // const transactionReference = this.resolveFirstString(data, [
    //   'transaction_ref',
    //   'transactionRef',
    //   'transaction_reference',
    //   'reference',
    // ]);
    // const transferReference = this.resolveFirstString(data, [
    //   'transfer_reference',
    //   'transferReference',
    //   'transfer_ref',
    // ]);
    // const vendorId = this.resolveVendorId(payload);

    // const webhookEvent = await this.prisma.webhookEvent.create({
    //   data: {
    //     provider: 'SQUAD',
    //     eventType,
    //     transactionReference,
    //     transferReference,
    //     rawPayload: payload,
    //     signature,
    //   },
    // });

    // if (vendorId && transactionReference) {
    //   await this.prisma.transaction.upsert({
    //     where: { transactionRef: transactionReference },
    //     create: {
    //       vendorId,
    //       transactionRef: transactionReference,
    //       amount: this.resolveAmount(data),
    //       channel: this.resolveFirstString(data, ['channel']) ?? 'SQUAD',
    //       status:
    //         this.resolveFirstString(data, ['status', 'transaction_status']) ??
    //         'UNKNOWN',
    //       financialRiskScore: 0,
    //     },
    //     update: {
    //       amount: this.resolveAmount(data),
    //       channel: this.resolveFirstString(data, ['channel']) ?? 'SQUAD',
    //       status:
    //         this.resolveFirstString(data, ['status', 'transaction_status']) ??
    //         'UNKNOWN',
    //     },
    //   });
    // }

    // if (vendorId && transferReference) {
    //   await this.persistTransferFromWebhook(vendorId, transferReference, data);
    // }

    const financialRisk = vendorId
      ? await this.transactionsService.evaluateVendorFinancialRisk(vendorId, {
          transactionRef: transactionReference,
          transferReference,
          webhookEventId: webhookEvent.id,
        })
      : null;

    // let graphSynced = false;
    // if (vendorId) {
    //   graphSynced = await this.graphService.safeSyncVendorById(vendorId);
    // }

    // await this.prisma.webhookEvent.update({
    //   where: { id: webhookEvent.id },
    //   data: {
    //     processed: true,
    //     processedAt: new Date(),
    //     graphSynced,
    //     graphSyncAttempts: { increment: 1 },
    //     graphSyncError: graphSynced
    //       ? null
    //       : 'Graph sync failed; queued for retry',
    //   },
    // });

    // await this.graphService.safeSyncWebhookEventById(webhookEvent.id);

    return {
      received: true,
      eventId: webhookEvent.id,
      transactionReference,
      transferReference,
      financialRisk,
      graphSynced,
    };
  }

  private async persistTransferFromWebhook(
    vendorId: string,
    transferReference: string,
    data: Record<string, any>,
  ) {
    const bankAccountId = this.resolveFirstString(data, [
      'bankAccountId',
      'bank_account_id',
    ]);

    if (!bankAccountId) {
      this.logger.warn(
        `Skipping transfer persistence for ${transferReference}; no bankAccountId was present in webhook metadata`,
      );
      return;
    }

    await this.prisma.transfer.upsert({
      where: { transferReference },
      create: {
        vendorId,
        bankAccountId,
        transferReference,
        amount: this.resolveAmount(data),
        currency: this.resolveFirstString(data, ['currency']) ?? 'NGN',
        status: this.resolveFirstString(data, ['status']) ?? 'UNKNOWN',
        rawPayload: data,
      },
      update: {
        amount: this.resolveAmount(data),
        currency: this.resolveFirstString(data, ['currency']) ?? 'NGN',
        status: this.resolveFirstString(data, ['status']) ?? 'UNKNOWN',
        rawPayload: data,
      },
    });
  }

  private isValidWebhookSignature(
    payload: Record<string, any>,
    signature?: string,
  ) {
    const webhookSecret = process.env.SQUAD_SECRET_KEY;

    if (!webhookSecret) {
      this.logger.warn(
        'SQUAD_WEBHOOK_SECRET is not set; accepting Squad webhook without signature validation',
      );
      return true;
    }

    if (!signature) {
      return false;
    }

    const normalizedSignature = signature.replace(/^sha(256|512)=/i, '');
    const body = JSON.stringify(payload);
    const candidates = [
      createHmac('sha512', webhookSecret).update(body).digest('hex'),
      createHmac('sha256', webhookSecret).update(body).digest('hex'),
    ];

    return candidates.some((candidate) =>
      this.safeCompare(normalizedSignature, candidate),
    );
  }

  private safeCompare(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private resolveEventData(payload: Record<string, any>) {
    return (payload.data ?? payload.body ?? payload) as Record<string, any>;
  }

  private resolveVendorId(payload: Record<string, any>) {
    const data = this.resolveEventData(payload);
    const metadata = (data.metadata ?? payload.metadata ?? {}) as Record<
      string,
      any
    >;

    return (
      this.resolveFirstString(metadata, ['vendor_id', 'vendorId']) ??
      this.resolveFirstString(data, ['vendor_id', 'vendorId'])
    );
  }

  private resolveAmount(data: Record<string, any>) {
    const amount = data.amount ?? data.amount_paid ?? data.transfer_amount ?? 0;
    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private resolveFirstString(data: Record<string, any>, keys: string[]) {
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return undefined;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PAYMENTS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Initiate a payment and obtain a checkout URL.
   * POST /transaction/initiate
   */
  async initiatePayment(
    dto: InitiatePaymentDto,
  ): Promise<SquadApiResponse<InitiatePaymentResponseData>> {
    const { data } = await this.http.post<
      SquadApiResponse<InitiatePaymentResponseData>
    >('/transaction/initiate', dto);
    return data;
  }

  /**
   * Verify a transaction by its unique reference.
   * GET /transaction/verify/:transaction_ref
   */
  async verifyTransaction(
    transactionRef: string,
  ): Promise<SquadApiResponse<VerifyTransactionResponseData>> {
    const { data } = await this.http.get<
      SquadApiResponse<VerifyTransactionResponseData>
    >(`/transaction/verify/${transactionRef}`);
    return data;
  }

  /**
   * Charge a previously tokenised card using its token_id.
   * POST /transaction/charge_card
   */
  async chargeCard(
    dto: ChargeCardDto,
  ): Promise<SquadApiResponse<ChargeCardResponseData>> {
    const { data } = await this.http.post<
      SquadApiResponse<ChargeCardResponseData>
    >('/transaction/charge_card', dto);
    return data;
  }

  /**
   * Cancel an active recurring card token.
   * PATCH /transaction/cancel/recurring
   */
  async cancelRecurringCharge(
    dto: CancelRecurringChargeDto,
  ): Promise<SquadApiResponse<{ auth_code: string[] }>> {
    const { data } = await this.http.patch<
      SquadApiResponse<{ auth_code: string[] }>
    >('/transaction/cancel/recurring', dto);
    return data;
  }

  /**
   * Query all transactions with optional filters.
   * GET /transaction
   */
  async queryTransactions(
    query: QueryTransactionsDto,
  ): Promise<SquadApiResponse<TransactionRecord[]>> {
    const { data } = await this.http.get<SquadApiResponse<TransactionRecord[]>>(
      '/transaction',
      { params: query },
    );
    return data;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SANDBOX ONLY
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Simulate a transfer payment into a dynamic virtual account (sandbox only).
   * POST /virtual-account/simulate/payment
   */
  async simulatePayment(
    dto: SimulatePaymentDto,
  ): Promise<SquadApiResponse<string>> {
    if (this.options.isProduction) {
      throw new HttpException(
        'simulatePayment is only available in the sandbox environment.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const { data } = await this.http.post<SquadApiResponse<string>>(
      '/virtual-account/simulate/payment',
      dto,
    );
    return data;
  }

  //Virtual Account Generation for users
  async virtualAccount(dto: VirtualAccountDto): Promise<SquadApiResponse<any>> {
    const { data } = await this.http.post('/virtual-account', dto);
    return data;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TRANSFERS / PAYOUTS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Look up an account name before initiating a transfer.
   * POST /payout/account/lookup
   */
  async lookupAccount(
    dto: AccountLookupDto,
  ): Promise<SquadApiResponse<AccountLookupResponseData>> {
    const { data } = await this.http.post<
      SquadApiResponse<AccountLookupResponseData>
    >('/payout/account/lookup', dto);
    return data;
  }

  /**
   * Transfer funds from your Squad wallet to a bank account.
   * POST /payout/transfer
   */
  async fundTransfer(
    dto: FundTransferDto,
  ): Promise<SquadApiResponse<FundTransferResponseData>> {
    const { data } = await this.http.post<
      SquadApiResponse<FundTransferResponseData>
    >('/payout/transfer', dto);
    return data;
  }

  /**
   * Re-query the status of a previously initiated transfer.
   * POST /payout/requery
   */
  async requeryTransfer(
    dto: RequeryTransferDto,
  ): Promise<SquadApiResponse<FundTransferResponseData>> {
    const { data } = await this.http.post<
      SquadApiResponse<FundTransferResponseData>
    >('/payout/requery', dto);
    return data;
  }

  /**
   * Retrieve all transfers made from your Squad wallet.
   * GET /payout/list
   */
  async getAllTransfers(
    query: GetAllTransfersDto,
  ): Promise<SquadApiResponse<TransferRecord[]>> {
    const { data } = await this.http.get<SquadApiResponse<TransferRecord[]>>(
      '/payout/list',
      { params: query },
    );
    return data;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REFUNDS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Initiate a full or partial refund on a completed transaction.
   * POST /transaction/refund
   */
  async initiateRefund(
    dto: RefundDto,
  ): Promise<SquadApiResponse<RefundResponseData>> {
    const { data } = await this.http.post<SquadApiResponse<RefundResponseData>>(
      '/transaction/refund',
      dto,
    );
    return data;
  }
}
