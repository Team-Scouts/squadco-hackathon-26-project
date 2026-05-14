import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { VendorsModule } from './modules/vendors/vendors.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SquadModule } from './modules/squad/squad.module';
import { RiskModule } from './modules/risk/risk.module';
import { GraphModule } from './modules/graph/graph.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AdminModule } from './modules/admin/admin.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { auth } from './lib/auth';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { DeviceIntelligenceModule } from './modules/device-intelligence/device-intelligence.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    PrismaModule,
    VendorsModule,
    DocumentsModule,
    TransactionsModule,
    ConfigModule.forRoot({ isGlobal: true }),
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
