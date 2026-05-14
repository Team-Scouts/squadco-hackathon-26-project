import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../../neo4j/neo4j.service';
import { PrismaService } from '../../prisma/prisma.service';

type GraphNode = {
  id: string;
  type: string;
  label: string;
  data: Record<string, unknown>;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
};

type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(
    private readonly neo4j: Neo4jService,
    private readonly prisma: PrismaService,
  ) {}

  async syncExistingPrismaDataToGraph() {
    const users = await this.prisma.user.findMany();
    const vendors = await this.prisma.vendor.findMany({
      include: {
        devices: true,
        documents: true,
        transactions: true,
        bankAccounts: {
          include: {
            transfers: true,
          },
        },
        transfers: {
          include: {
            bankAccount: true,
          },
        },
        riskScores: true,
      },
    });
    const webhookEvents = await this.prisma.webhookEvent.findMany();

    let synced = 0;
    let failed = 0;

    for (const user of users) {
      const result = await this.safeGraphSync('User', user.id, 'upsertUser', () =>
        this.upsertUserGraph(user),
      );
      result ? synced++ : failed++;
    }

    for (const vendor of vendors) {
      const result = await this.safeGraphSync(
        'Vendor',
        vendor.id,
        'upsertVendorGraph',
        () => this.upsertVendorGraph(vendor),
      );
      result ? synced++ : failed++;
    }

    for (const webhookEvent of webhookEvents) {
      const result = await this.safeGraphSync(
        'WebhookEvent',
        webhookEvent.id,
        'upsertWebhookEvent',
        () => this.upsertWebhookEventGraph(webhookEvent),
      );
      result ? synced++ : failed++;
    }

    return { synced, failed };
  }

  async safeSyncVendorById(vendorId: string) {
    return this.safeGraphSync('Vendor', vendorId, 'syncVendorById', async () => {
      const vendor = await this.getVendorWithRelations(vendorId);
      await this.upsertVendorGraph(vendor);
    });
  }

  async safeSyncWebhookEventById(webhookEventId: string) {
    return this.safeGraphSync(
      'WebhookEvent',
      webhookEventId,
      'syncWebhookEventById',
      async () => {
        const webhookEvent = await this.prisma.webhookEvent.findUnique({
          where: { id: webhookEventId },
        });

        if (!webhookEvent) {
          throw new NotFoundException(`Webhook event ${webhookEventId} not found`);
        }

        await this.upsertWebhookEventGraph(webhookEvent);
      },
    );
  }

  async upsertUserGraph(user: any) {
    await this.neo4j.write(
      `
      MERGE (u:User {id: $id})
      SET u += $props
      `,
      {
        id: user.id,
        props: this.cleanProps({
          email: user.email,
          role: user.role,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }),
      },
    );
  }

  async upsertVendorGraph(vendor: any) {
    await this.neo4j.write(
      `
      MERGE (v:Vendor {id: $id})
      SET v += $props
      WITH v
      MERGE (email:Email {value: $email})
      MERGE (v)-[:HAS_EMAIL]->(email)
      WITH v
      MERGE (phone:Phone {value: $phone})
      MERGE (v)-[:HAS_PHONE]->(phone)
      `,
      {
        id: vendor.id,
        email: vendor.email,
        phone: vendor.phone,
        props: this.cleanProps({
          businessName: vendor.businessName,
          email: vendor.email,
          phone: vendor.phone,
          status: vendor.status,
          riskLevel: vendor.riskLevel,
          overallRiskScore: vendor.overallRiskScore,
          createdAt: vendor.createdAt,
          updatedAt: vendor.updatedAt,
        }),
      },
    );

    for (const device of vendor.devices ?? []) {
      await this.upsertDeviceForVendor(vendor.id, device);
    }

    for (const document of vendor.documents ?? []) {
      await this.upsertDocumentForVendor(vendor.id, document);
    }

    for (const transaction of vendor.transactions ?? []) {
      await this.upsertTransactionForVendor(vendor.id, transaction);
    }

    for (const bankAccount of vendor.bankAccounts ?? []) {
      await this.upsertBankAccountForVendor(vendor.id, bankAccount);
    }

    for (const transfer of vendor.transfers ?? []) {
      await this.upsertTransferForVendor(vendor.id, transfer);
    }

    for (const riskScore of vendor.riskScores ?? []) {
      await this.upsertRiskScoreForVendor(vendor.id, riskScore);
    }
  }

  async upsertDeviceForVendor(vendorId: string, device: any) {
    await this.neo4j.write(
      `
      MATCH (v:Vendor {id: $vendorId})
      MERGE (d:Device {id: $id})
      SET d += $props
      MERGE (v)-[:USES_DEVICE]->(d)
      `,
      {
        vendorId,
        id: device.id,
        props: this.cleanProps({
          deviceHash: device.deviceHash,
          ipAddress: device.ipAddress,
          browser: device.browser,
          timezone: device.timezone,
          riskScore: device.riskScore,
          createdAt: device.createdAt,
        }),
      },
    );
  }

  async upsertDocumentForVendor(vendorId: string, document: any) {
    await this.neo4j.write(
      `
      MATCH (v:Vendor {id: $vendorId})
      MERGE (d:Document {id: $id})
      SET d += $props
      MERGE (v)-[:SUBMITTED_DOC]->(d)
      `,
      {
        vendorId,
        id: document.id,
        props: this.cleanProps({
          documentType: document.documentType,
          fileUrl: document.fileUrl,
          documentHash: document.documentHash,
          tamperScore: document.tamperScore,
          verificationStatus: document.verificationStatus,
          duplicateDetected: document.duplicateDetected,
          duplicateVendorCount: document.duplicateVendorCount,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        }),
      },
    );
  }

  async upsertTransactionForVendor(vendorId: string, transaction: any) {
    await this.neo4j.write(
      `
      MATCH (v:Vendor {id: $vendorId})
      MERGE (t:Transaction {transactionRef: $transactionRef})
      SET t += $props
      MERGE (v)-[:MADE_PAYMENT]->(t)
      `,
      {
        vendorId,
        transactionRef: transaction.transactionRef,
        props: this.cleanProps({
          id: transaction.id,
          amount: transaction.amount,
          channel: transaction.channel,
          status: transaction.status,
          financialRiskScore: transaction.financialRiskScore,
          createdAt: transaction.createdAt,
        }),
      },
    );
  }

  async upsertBankAccountForVendor(vendorId: string, bankAccount: any) {
    await this.neo4j.write(
      `
      MATCH (v:Vendor {id: $vendorId})
      MERGE (b:BankAccount {id: $id})
      SET b += $props
      MERGE (v)-[:OWNS_ACCOUNT]->(b)
      `,
      {
        vendorId,
        id: bankAccount.id,
        props: this.cleanProps({
          bankCode: bankAccount.bankCode,
          bankName: bankAccount.bankName,
          accountNumberHash: bankAccount.accountNumberHash,
          accountNumberLast4: bankAccount.accountNumberLast4,
          accountName: bankAccount.accountName,
          lookupStatus: bankAccount.lookupStatus,
          identityMatchScore: bankAccount.identityMatchScore,
          createdAt: bankAccount.createdAt,
          updatedAt: bankAccount.updatedAt,
        }),
      },
    );

    for (const transfer of bankAccount.transfers ?? []) {
      await this.upsertTransferForVendor(vendorId, {
        ...transfer,
        bankAccount,
      });
    }
  }

  async upsertTransferForVendor(vendorId: string, transfer: any) {
    await this.neo4j.write(
      `
      MATCH (v:Vendor {id: $vendorId})
      MERGE (t:Transfer {transferReference: $transferReference})
      SET t += $props
      MERGE (v)-[:RECEIVED_TRANSFER]->(t)
      `,
      {
        vendorId,
        transferReference: transfer.transferReference,
        props: this.cleanProps({
          id: transfer.id,
          amount: transfer.amount,
          currency: transfer.currency,
          status: transfer.status,
          rawPayload: this.stringifyJson(transfer.rawPayload),
          createdAt: transfer.createdAt,
          updatedAt: transfer.updatedAt,
        }),
      },
    );

    const bankAccountId = transfer.bankAccountId ?? transfer.bankAccount?.id;
    if (bankAccountId) {
      await this.neo4j.write(
        `
        MATCH (t:Transfer {transferReference: $transferReference})
        MATCH (b:BankAccount {id: $bankAccountId})
        MERGE (t)-[:PAID_TO]->(b)
        `,
        {
          transferReference: transfer.transferReference,
          bankAccountId,
        },
      );
    }
  }

  async upsertWebhookEventGraph(webhookEvent: any) {
    await this.neo4j.write(
      `
      MERGE (w:WebhookEvent {id: $id})
      SET w += $props
      `,
      {
        id: webhookEvent.id,
        props: this.cleanProps({
          provider: webhookEvent.provider,
          eventType: webhookEvent.eventType,
          transactionReference: webhookEvent.transactionReference,
          transferReference: webhookEvent.transferReference,
          rawPayload: this.stringifyJson(webhookEvent.rawPayload),
          processed: webhookEvent.processed,
          processedAt: webhookEvent.processedAt,
          graphSynced: webhookEvent.graphSynced,
          createdAt: webhookEvent.createdAt,
        }),
      },
    );

    if (webhookEvent.transactionReference) {
      await this.neo4j.write(
        `
        MATCH (w:WebhookEvent {id: $id})
        MATCH (t:Transaction {transactionRef: $transactionReference})
        MERGE (w)-[:RECORDED_TRANSACTION]->(t)
        `,
        {
          id: webhookEvent.id,
          transactionReference: webhookEvent.transactionReference,
        },
      );
    }

    if (webhookEvent.transferReference) {
      await this.neo4j.write(
        `
        MATCH (w:WebhookEvent {id: $id})
        MATCH (t:Transfer {transferReference: $transferReference})
        MERGE (w)-[:RECORDED_TRANSFER]->(t)
        `,
        {
          id: webhookEvent.id,
          transferReference: webhookEvent.transferReference,
        },
      );
    }
  }

  async upsertRiskScoreForVendor(vendorId: string, riskScore: any) {
    await this.neo4j.write(
      `
      MATCH (v:Vendor {id: $vendorId})
      MERGE (r:RiskScore {id: $id})
      SET r += $props
      MERGE (v)-[:HAS_RISK_SCORE]->(r)
      `,
      {
        vendorId,
        id: riskScore.id,
        props: this.cleanProps({
          documentRisk: riskScore.documentRisk,
          networkFraudRisk: riskScore.networkFraudRisk,
          financialAnomalyRisk: riskScore.financialAnomalyRisk,
          deviceRisk: riskScore.deviceRisk,
          identityMismatchRisk: riskScore.identityMismatchRisk,
          manualReviewPenalty: riskScore.manualReviewPenalty,
          overallRisk: riskScore.overallRisk,
          riskLevel: riskScore.riskLevel,
          recommendedAction: riskScore.recommendedAction,
          reasons: this.stringifyJson(riskScore.reasons),
          createdAt: riskScore.createdAt,
        }),
      },
    );
  }

  async getVendorGraph(id: string): Promise<GraphResponse> {
    const rows = await this.neo4j.read<any>(
      `
      MATCH (v:Vendor {id: $id})
      OPTIONAL MATCH (v)-[r]->(n)
      RETURN v {.*} AS vendor,
        collect(CASE WHEN r IS NULL THEN null ELSE {
          relationship: type(r),
          labels: labels(n),
          node: n {.*}
        } END) AS links
      `,
      { id },
    );

    if (!rows.length) {
      throw new NotFoundException(`Vendor graph ${id} not found`);
    }

    const vendor = rows[0].vendor;
    const links = (rows[0].links ?? []).filter(Boolean);
    const graph = this.emptyGraph();

    this.addNode(
      graph,
      this.toGraphNode('Vendor', vendor.id, vendor.businessName, vendor),
    );

    for (const link of links) {
      const type = link.labels?.[0] ?? 'Unknown';
      const targetId = this.resolveNodeId(type, link.node);
      this.addNode(
        graph,
        this.toGraphNode(type, targetId, this.resolveLabel(type, link.node), link.node),
      );
      this.addEdge(graph, vendor.id, targetId, link.relationship);
    }

    return graph;
  }

  async getSharedDevices(): Promise<GraphResponse> {
    const rows = await this.neo4j.read<any>(
      `
      MATCH (d:Device)<-[:USES_DEVICE]-(v:Vendor)
      WITH d, collect(DISTINCT v) AS vendors, count(DISTINCT v) AS vendorCount
      WHERE vendorCount >= $threshold
      RETURN d {.*} AS device, vendorCount, [vendor IN vendors | vendor {.*}] AS vendors
      `,
      { threshold: 3 },
    );

    const graph = this.emptyGraph();

    for (const row of rows) {
      const device = row.device;
      const clusterId = `shared-device-${device.id}`;
      this.addNode(
        graph,
        this.toGraphNode('Cluster', clusterId, 'Shared device cluster', {
          riskType: 'SHARED_DEVICE',
          severity: 'HIGH',
          vendorCount: row.vendorCount,
        }),
      );
      this.addNode(
        graph,
        this.toGraphNode('Device', device.id, this.resolveLabel('Device', device), device),
      );
      this.addEdge(graph, clusterId, device.id, 'HAS_SHARED_SIGNAL');

      for (const vendor of row.vendors ?? []) {
        this.addNode(
          graph,
          this.toGraphNode('Vendor', vendor.id, vendor.businessName, vendor),
        );
        this.addEdge(graph, vendor.id, device.id, 'USES_DEVICE');
        this.addEdge(graph, clusterId, vendor.id, 'INCLUDES_VENDOR');
      }
    }

    return graph;
  }

  async getSharedAccounts(): Promise<GraphResponse> {
    const rows = await this.neo4j.read<any>(
      `
      MATCH (b:BankAccount)<-[:OWNS_ACCOUNT]-(v:Vendor)
      WITH b.accountNumberHash AS accountNumberHash,
        collect(DISTINCT b) AS accounts,
        collect(DISTINCT v) AS vendors,
        count(DISTINCT v) AS vendorCount
      WHERE accountNumberHash IS NOT NULL AND accountNumberHash <> '' AND vendorCount >= $threshold
      RETURN accountNumberHash, accounts, [vendor IN vendors | vendor {.*}] AS vendors, vendorCount
      `,
      { threshold: 2 },
    );

    const graph = this.emptyGraph();

    for (const row of rows) {
      const clusterId = `shared-account-${row.accountNumberHash}`;
      this.addNode(
        graph,
        this.toGraphNode('Cluster', clusterId, 'Shared account cluster', {
          riskType: 'SHARED_ACCOUNT',
          severity: 'HIGH',
          vendorCount: row.vendorCount,
          accountNumberHash: row.accountNumberHash,
        }),
      );

      for (const account of row.accounts ?? []) {
        this.addNode(
          graph,
          this.toGraphNode(
            'BankAccount',
            account.properties?.id ?? account.id,
            this.resolveLabel('BankAccount', account.properties ?? account),
            account.properties ?? account,
          ),
        );
        this.addEdge(
          graph,
          clusterId,
          account.properties?.id ?? account.id,
          'HAS_SHARED_SIGNAL',
        );
      }

      for (const vendor of row.vendors ?? []) {
        this.addNode(
          graph,
          this.toGraphNode('Vendor', vendor.id, vendor.businessName, vendor),
        );
        this.addEdge(graph, clusterId, vendor.id, 'INCLUDES_VENDOR');
      }
    }

    return graph;
  }

  async getDuplicateDocuments(): Promise<GraphResponse> {
    const rows = await this.neo4j.read<any>(
      `
      MATCH (doc:Document)<-[:SUBMITTED_DOC]-(v:Vendor)
      WHERE doc.documentHash IS NOT NULL AND doc.documentHash <> ''
      WITH doc.documentHash AS documentHash,
        collect(DISTINCT doc) AS documents,
        collect(DISTINCT v) AS vendors,
        count(DISTINCT v) AS vendorCount
      WHERE vendorCount >= $threshold
      RETURN documentHash, documents, [vendor IN vendors | vendor {.*}] AS vendors, vendorCount
      `,
      { threshold: 2 },
    );

    const graph = this.emptyGraph();

    for (const row of rows) {
      const clusterId = `duplicate-document-${row.documentHash}`;
      this.addNode(
        graph,
        this.toGraphNode('Cluster', clusterId, 'Duplicate document cluster', {
          riskType: 'DUPLICATE_DOCUMENT',
          severity: 'HIGH',
          vendorCount: row.vendorCount,
          documentHash: row.documentHash,
        }),
      );

      for (const document of row.documents ?? []) {
        const data = document.properties ?? document;
        this.addNode(
          graph,
          this.toGraphNode('Document', data.id, this.resolveLabel('Document', data), data),
        );
        this.addEdge(graph, clusterId, data.id, 'HAS_SHARED_SIGNAL');
      }

      for (const vendor of row.vendors ?? []) {
        this.addNode(
          graph,
          this.toGraphNode('Vendor', vendor.id, vendor.businessName, vendor),
        );
        this.addEdge(graph, clusterId, vendor.id, 'INCLUDES_VENDOR');
      }
    }

    return graph;
  }

  async getFraudClusters(): Promise<GraphResponse> {
    const combined = this.emptyGraph();

    for (const graph of [
      await this.getSharedDevices(),
      await this.getSharedAccounts(),
      await this.getDuplicateDocuments(),
    ]) {
      for (const node of graph.nodes) {
        this.addNode(combined, node);
      }
      for (const edge of graph.edges) {
        this.addGraphEdge(combined, edge);
      }
    }

    return combined;
  }

  private async getVendorWithRelations(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        devices: true,
        documents: true,
        transactions: true,
        bankAccounts: {
          include: {
            transfers: true,
          },
        },
        transfers: {
          include: {
            bankAccount: true,
          },
        },
        riskScores: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor ${vendorId} not found`);
    }

    return vendor;
  }

  private async safeGraphSync(
    entityType: string,
    entityId: string | null,
    operation: string,
    sync: () => Promise<void>,
  ) {
    try {
      await sync();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`${operation} failed for ${entityType}:${entityId}: ${message}`);
      await this.prisma.graphSyncFailure.create({
        data: {
          entityType,
          entityId,
          operation,
          error: message,
        },
      });
      return false;
    }
  }

  private cleanProps(input: Record<string, unknown>) {
    const output: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (value instanceof Date) {
        output[key] = value.toISOString();
        continue;
      }

      output[key] = value;
    }

    return output;
  }

  private stringifyJson(value: unknown) {
    if (value === null || value === undefined) {
      return undefined;
    }

    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  private emptyGraph(): GraphResponse {
    return { nodes: [], edges: [] };
  }

  private toGraphNode(
    type: string,
    id: string,
    label: string,
    data: Record<string, unknown>,
  ): GraphNode {
    return {
      id,
      type,
      label,
      data,
    };
  }

  private addNode(graph: GraphResponse, node: GraphNode) {
    if (!graph.nodes.some((existing) => existing.id === node.id)) {
      graph.nodes.push(node);
    }
  }

  private addEdge(
    graph: GraphResponse,
    source: string,
    target: string,
    type: string,
  ) {
    this.addGraphEdge(graph, {
      id: `${source}-${type}-${target}`,
      source,
      target,
      label: type,
      type,
    });
  }

  private addGraphEdge(graph: GraphResponse, edge: GraphEdge) {
    if (!graph.edges.some((existing) => existing.id === edge.id)) {
      graph.edges.push(edge);
    }
  }

  private resolveNodeId(type: string, node: Record<string, unknown>) {
    if (type === 'Email' || type === 'Phone') {
      return String(node.value);
    }

    if (type === 'Transaction') {
      return String(node.transactionRef ?? node.id);
    }

    if (type === 'Transfer') {
      return String(node.transferReference ?? node.id);
    }

    return String(node.id);
  }

  private resolveLabel(type: string, node: Record<string, unknown>) {
    if (type === 'Vendor') {
      return String(node.businessName ?? node.id);
    }

    if (type === 'Device') {
      return String(node.browser ?? node.deviceHash ?? node.id);
    }

    if (type === 'Document') {
      return String(node.documentType ?? node.documentHash ?? node.id);
    }

    if (type === 'BankAccount') {
      return String(node.accountName ?? node.accountNumberLast4 ?? node.id);
    }

    if (type === 'Transaction') {
      return String(node.transactionRef ?? node.id);
    }

    if (type === 'Transfer') {
      return String(node.transferReference ?? node.id);
    }

    if (type === 'RiskScore') {
      return String(node.riskLevel ?? node.id);
    }

    return String(node.value ?? node.id);
  }
}
