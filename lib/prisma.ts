// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Singleton pattern: cache the PrismaClient on globalThis so Next.js dev-mode
// hot reloads don't spawn a new client on every reload (which would exhaust
// the connection pool). In production there's no hot reload, so caching on
// globalThis isn't necessary — but it doesn't hurt and keeps one source of
// truth for both modes.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
