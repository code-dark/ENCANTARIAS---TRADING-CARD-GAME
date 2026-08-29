/**
 * Transformation System
 * Narratives change based on context, not just linear power progression
 */

import { AnyCard, TransformationState } from '../cards/types';

/**
 * Check if a card can transform based on a trigger
 */
export function checkTransformationTrigger(
  card: AnyCard,
  trigger: string
): boolean {
  // Simple string matching for now. Can expand to handle:
  // "Circulation > 3", "InTerritory:Water", etc.
  if (trigger.includes('Circulation')) {
    // Extract threshold
    const match = trigger.match(/Circulation\s*>\s*(\d+)/);
    if (match) {
      const threshold = parseInt(match[1]);
      const circulation = card.state?.includes('circulation') ? 1 : 0;
      return circulation > threshold;
    }
  }

  return false;
}

/**
 * Apply transformation to a card
 */
export function transformCard(
  card: AnyCard,
  newState: TransformationState
): AnyCard {
  return {
    ...card,
    transformationState: newState,
    state: newState.toLowerCase(),
  };
}

/**
 * Get available transformations for a card given context
 */
export function getAvailableTransformations(
  card: AnyCard
): { toState: TransformationState; effect?: string }[] {
  if (card.type !== 'Legend') {
    return [];
  }

  // @ts-ignore (Legend-specific)
  const transformations = card.transformations || [];
  const available = [];

  for (const transform of transformations) {
    if (checkTransformationTrigger(card, transform.trigger)) {
      available.push({
        toState: transform.toState,
        effect: transform.newAbility,
      });
    }
  }

  return available;
}

/**
 * Check if transformation changes card behavior significantly
 */
export function isSignificantTransformation(
  oldState: TransformationState | undefined,
  newState: TransformationState
): boolean {
  if (!oldState) return true;
  return oldState !== newState;
}
