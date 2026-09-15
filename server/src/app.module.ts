import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { VendorsModule } from './modules/vendors/vendors.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { SquadModule } from './modules/squad/squad.module.js';
import { RiskModule } from './modules/risk/risk.module.js';
import { GraphModule } from './modules/graph/graph.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AlertsModule } from './modules/alerts/alerts.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { PayoutsModule } from './modules/payouts/payouts.module.js';
import { auth } from './lib/auth.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { Neo4jModule } from './neo4j/neo4j.module.js';
import { DeviceIntelligenceModule } from './modules/device-intelligence/device-intelligence.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    VendorsModule,
    DocumentsModule,
    TransactionsModule,
    UserModule,
    // Register SquadModule asynchronously so ConfigService is available
    SquadModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secretKey: config.getOrThrow<string>('SQUAD_SECRET_KEY'),
        isProduction: config.get('NODE_ENV') === 'production',
      }),
      inject: [ConfigService],
    }),
    RiskModule,
    GraphModule,
    DeviceIntelligenceModule,
    AlertsModule,
    AdminModule,
    PayoutsModule,
    CloudinaryModule,
    Neo4jModule,
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
