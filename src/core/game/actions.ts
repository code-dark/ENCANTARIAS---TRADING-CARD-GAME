/**
 * The actions a player can take. Every state change goes through one of these,
 * so the log is a complete record of the match.
 */

export type GameAction =
  | { type: 'DrawCard'; playerId: string }
  | { type: 'PlayCard'; playerId: string; instanceId: string }
  | { type: 'Traverse'; playerId: string; territoryInstanceId: string }
  | { type: 'ActivateResonance'; playerId: string; instanceId: string }
  | { type: 'Explore'; playerId: string }
  | { type: 'StoreMemory'; playerId: string; memoryInstanceId: string; containerInstanceId: string }
  | { type: 'RetrieveMemory'; playerId: string; memoryInstanceId: string }
  /** Read the fact and take the Memory. The chosen option, when the roll gave two. */
  | { type: 'TransmitMemory'; playerId: string; memoryInstanceId: string }
  | { type: 'PassPhase'; playerId: string };

export type ActionType = GameAction['type'];

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export const VALID: ValidationResult = { valid: true };

export function invalid(reason: string): ValidationResult {
  return { valid: false, reason };
}
