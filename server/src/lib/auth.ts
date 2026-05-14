import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins/admin';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [
    admin({
      defaultRole: 'admin',
      adminRoles: ['admin'],
    }),
  ],
  trustedOrigins: ['http://localhost:5173', 'http://localhost:3000'],
  //REMOVE BEFORE DEPLOYMENT!!!!
  advanced: {
    disableOriginCheck: true,
  },
  //REMOVE ABEG
});
