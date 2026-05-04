import { PrismaClient } from '@prisma/client';
import { deepLog } from './utils/logger';

let prismaInstance: PrismaClient | null = null;

const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!prismaInstance) {
      deepLog('[PRISMA] Initializing new PrismaClient instance...');
      prismaInstance = new PrismaClient();
    }
    const val = (prismaInstance as any)[prop];
    return typeof val === 'function' ? val.bind(prismaInstance) : val;
  }
});

export default prisma;
