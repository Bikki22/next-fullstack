import { compare, hash } from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string) {
  return hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, passwordHash: string) {
  return compare(plain, passwordHash);
}
