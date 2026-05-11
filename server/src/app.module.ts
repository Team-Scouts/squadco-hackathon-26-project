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
// import { DeviceIntelligenceModule } from './modules/device-intelligence/device-intelligence.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AdminModule } from './modules/admin/admin.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { auth } from './lib/auth';
<<<<<<< HEAD
import { CloudinaryModule } from './cloudinary/cloudinary.module';
=======
import { Neo4jModule } from './neo4j/neo4j.module';
>>>>>>> c7f473d7a8d189e9a02ea1da369688ad2a4d3402

@Module({
  imports: [
    PrismaModule,
    AuthModule.forRoot({
      auth,
    }),
    VendorsModule,
    DocumentsModule,
    TransactionsModule,
    ConfigModule.forRoot({ isGlobal: true }),

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
    // DeviceIntelligenceModule,
    AlertsModule,
    AdminModule,
    PayoutsModule,
<<<<<<< HEAD
    CloudinaryModule,
=======
    Neo4jModule,
>>>>>>> c7f473d7a8d189e9a02ea1da369688ad2a4d3402
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
