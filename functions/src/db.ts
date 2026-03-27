import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | undefined;

/**
 * Returns an instance of PrismaClient.
 * This is now a function to allow lazy initialization, which helps
 * ensure secrets and environment variables (like POSTGRES_URL)
 * are properly loaded by the time connection is attempted.
 */
export const getPrisma = (): PrismaClient => {
  if (prismaInstance) return prismaInstance;

  if (process.env.NODE_ENV === 'production') {
    prismaInstance = new PrismaClient();
  } else {
    // Prevent multiple instances of Prisma Client in development (e.g., during HMR)
    if (!(global as any).__prismaInstance) {
      console.log("[PRISMA] Initializing new instance...");
      const dbUrl = process.env.POSTGRES_URL || "UNDEFINED";
      console.log(`[PRISMA] Connection URL: ${dbUrl.split('@')[1] || 'Internal/No-Auth'}`);
      (global as any).__prismaInstance = new PrismaClient();
    }
    prismaInstance = (global as any).__prismaInstance;
  }
  
  return prismaInstance as PrismaClient;
};

// Use a Proxy as the default export to make it lazy without changing every function call.
// This ensures that accessing `prisma.user` or `prisma.document` only initializes 
// the client at the moment it's needed during function execution.
const lazyPrisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    return (getPrisma() as any)[prop];
  }
});

export default lazyPrisma;
