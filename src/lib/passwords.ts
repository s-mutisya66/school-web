import { randomInt } from "node:crypto";

// No 0/o, 1/l/i or other look-alikes, so a password read from a printed list can be typed correctly.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generatePassword(length = 8): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
