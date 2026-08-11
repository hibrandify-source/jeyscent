import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getUserById } from "./db";
import { UserType } from "./types";

// Lazily resolve JWT_SECRET — we must NOT throw at module load time, otherwise
// `next build`'s "Collecting page data" phase evaluates route modules, hits the
// throw, and the build crashes even though the secret is only needed at
// request time. By deferring to a function call, the build passes and the
// error only surfaces when a token is actually signed/verified.
function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  return "dev-only-fallback-secret";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyToken(
  token: string
): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as {
      id: string;
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserType | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await getUserById(decoded.id);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}