import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';

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
