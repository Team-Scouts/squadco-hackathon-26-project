import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, QueryResult, Record as Neo4jRecord } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private readonly driver: Driver;

  constructor(private readonly config: ConfigService) {
    const uri = this.config.get<string>('NEO4J_URI');
    const username = this.config.get<string>('NEO4J_USERNAME');
    const password = this.config.get<string>('NEO4J_PASSWORD');

    if (!uri || !username || !password) {
      throw new Error(
        'Neo4j configuration is incomplete. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.',
      );
    }

    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async onModuleInit() {
    try {
      await this.driver.verifyConnectivity();
      await this.ensureSchema();
      this.logger.log('Neo4j connected and graph schema initialized');
    } catch (error) {
      this.logger.error(
        `Neo4j startup check failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  async health() {
    try {
      await this.driver.verifyConnectivity();
      return {
        ok: true,
        status: 'connected',
      };
    } catch (error) {
      return {
        ok: false,
        status: 'unavailable',
        error: this.getErrorMessage(error),
      };
    }
  }

  async read<T = Record<string, unknown>>(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    return this.run<T>(cypher, params, neo4j.session.READ);
  }

  async write<T = Record<string, unknown>>(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    return this.run<T>(cypher, params, neo4j.session.WRITE);
  }

  async run<T = Record<string, unknown>>(
    cypher: string,
    params: Record<string, unknown> = {},
    accessMode = neo4j.session.WRITE,
  ): Promise<T[]> {
    const session = this.driver.session({ defaultAccessMode: accessMode });

    try {
      const result: QueryResult = await session.run(cypher, params);
      return result.records.map((record) => this.recordToObject<T>(record));
    } finally {
      await session.close();
    }
  }

  private async ensureSchema() {
    const statements = [
      'CREATE CONSTRAINT vendor_id_unique IF NOT EXISTS FOR (n:Vendor) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (n:User) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT device_id_unique IF NOT EXISTS FOR (n:Device) REQUIRE n.id IS UNIQUE',
      'CREATE INDEX device_hash_index IF NOT EXISTS FOR (n:Device) ON (n.deviceHash)',
      'CREATE CONSTRAINT document_id_unique IF NOT EXISTS FOR (n:Document) REQUIRE n.id IS UNIQUE',
      'CREATE INDEX document_hash_index IF NOT EXISTS FOR (n:Document) ON (n.documentHash)',
      'CREATE CONSTRAINT transaction_ref_unique IF NOT EXISTS FOR (n:Transaction) REQUIRE n.transactionRef IS UNIQUE',
      'CREATE CONSTRAINT bank_account_id_unique IF NOT EXISTS FOR (n:BankAccount) REQUIRE n.id IS UNIQUE',
      'CREATE INDEX bank_account_hash_index IF NOT EXISTS FOR (n:BankAccount) ON (n.accountNumberHash)',
      'CREATE CONSTRAINT transfer_ref_unique IF NOT EXISTS FOR (n:Transfer) REQUIRE n.transferReference IS UNIQUE',
      'CREATE CONSTRAINT webhook_event_id_unique IF NOT EXISTS FOR (n:WebhookEvent) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT risk_score_id_unique IF NOT EXISTS FOR (n:RiskScore) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT email_value_unique IF NOT EXISTS FOR (n:Email) REQUIRE n.value IS UNIQUE',
      'CREATE CONSTRAINT phone_value_unique IF NOT EXISTS FOR (n:Phone) REQUIRE n.value IS UNIQUE',
    ];

    for (const statement of statements) {
      await this.write(statement);
    }
  }

  private recordToObject<T>(record: Neo4jRecord): T {
    return this.normalizeNeo4jValue(record.toObject()) as T;
  }

  private normalizeNeo4jValue(value: unknown): unknown {
    if (neo4j.isInt(value)) {
      return value.toNumber();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeNeo4jValue(item));
    }

    if (value && typeof value === 'object') {
      const normalized: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value)) {
        normalized[key] = this.normalizeNeo4jValue(item);
      }
      return normalized;
    }

    return value;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
