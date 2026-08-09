import bcrypt from "bcrypt";
import { createHash, timingSafeEqual } from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * OTPs are short-lived authentication secrets. Store only a digest so a
 * database read cannot be used to recover an active reset code.
 */
export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function verifyOtpCodeHash(code: string, storedValue: string): boolean {
  const candidate = Buffer.from(hashOtpCode(code), "utf8");
  const stored = Buffer.from(storedValue, "utf8");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}
