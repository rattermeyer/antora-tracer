import { createHash, timingSafeEqual } from "node:crypto";

/** SHA-256 hex digest of a plaintext token — the stored form. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Constant-time equality of two plaintext secrets, compared as digests. */
export function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
