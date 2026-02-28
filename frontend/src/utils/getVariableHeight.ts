import { DEFAULT_ROW_HEIGHT } from "../config";
import type { Transaction } from "../types/transaction";

/**
 * Deterministic height based on metadata key count.
 * 0 keys = 40px, 1 key = 50px, 2 keys = 60px, etc.
 * Max 5 keys = 90px.
 */
export function getVariableHeight(tx: Transaction): number {
  const keyCount = Object.keys(tx.metadata).length;
  return DEFAULT_ROW_HEIGHT - 10 + keyCount * 10;
}

/**
 * Height by index using the same deterministic formula as the seed script.
 * Avoids needing the transaction object.
 */
export function getVariableHeightByIndex(index: number): number {
  const keyCount = ((index + 1) * 7 + 3) % 6; // matches seed: (id * 7 + 3) % 6
  return DEFAULT_ROW_HEIGHT - 10 + keyCount * 10;
}
