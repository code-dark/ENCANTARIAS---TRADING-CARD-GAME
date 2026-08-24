/**
 * ENCANTARIAS Card Type Definitions
 * Data-driven card system with no hardcoded card logic
 */

export type CardType = 'Territory' | 'Legend' | 'Character' | 'Memory' | 'Event' | 'Artifact';

export type MemoryState = 'Oral' | 'Territorial' | 'Roots' | 'Shared' | 'Corporate' | 'Media';

export type Affinity =
  | 'Water'
  | 'Underground'
  | 'Memory'
  | 'Faith'
  | 'Institution'
  | 'Craft'
  | 'Commerce'
  | 'Passage'
  | 'City'
  | 'Movement'
  | 'History'
  | 'Culture'
  | 'Circulation'
  | 'Enchantment'
  | 'Mystery';

export type TransformationState =
  | 'Original'
  | 'Popularized'
  | 'Institutional'
  | 'Commercial'
  | 'Ressignified'
  | 'Decontextualized'
  | 'Transmitted';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  affinities: Affinity[];
  cost?: number;

  // Card state
  state?: string;
  memoryState?: MemoryState;
  transformationState?: TransformationState;

  // Links
  linkedCards?: string[]; // IDs of linked cards
  linkedTo?: string; // Parent card ID if linked to another card

  // Metadata
  description?: string;
  flavor?: string;
}

export interface TerritoryCard extends Card {
  type: 'Territory';
  category: string; // e.g., "Spring", "Church", "Street", "Center"
  historicalLayer?: string;
  narrativeLayer?: string;

  // Territory-specific
  permanentEffect?: {
    description: string;
    effect?: string;
  };

  placeAction?: {
    name: string;
    description?: string;
    cost?: number;
    effect?: string;
  };

  resonances?: Array<{
    cardId?: string;
    affinity?: Affinity;
    effect: string;
  }>;

  possibleEvents?: string[]; // Event card IDs
}

export interface LegendCard extends Card {
  type: 'Legend';
  linkedState?: 'Manifestation' | 'Bound' | 'Transformed';

  // Resonance manifestations per territory/affinity
  resonanceManifestations?: Record<string, {
    name: string;
    ability: string;
  }>;

  // Transformation rules
  transformations?: Array<{
    trigger: string;
    toState: TransformationState;
    newAbility?: string;
  }>;

  // Vínculo & properties
  vinculo?: number;
  presence?: number;
  mystery?: number;
}

export interface CharacterCard extends Card {
  type: 'Character';
  role?: string; // e.g., "Guardian of Memory", "Wanderer"

  // Attributes (from GDD)
  escuta?: number;      // Listening
  presenca?: number;    // Presence
  memoria?: number;     // Memory
  vinculo?: number;     // Bond
  astutia?: number;     // Cunning

  ability?: string;
  exhaustedEffect?: string;
}

export interface MemoryCard extends Card {
  type: 'Memory';
  memoryState: MemoryState;
  linkedTo?: string; // Legend or Territory it's linked to

  // Traversal behavior
  traversalBehavior?: 'stays' | 'travels' | 'transforms';

  effect?: string;

  // Circulation & transformation
  circulationThreshold?: number;
  transformationOn?: MemoryState | TransformationState;
}

export interface EventCard extends Card {
  type: 'Event';
  trigger?: string; // When does this activate?
  condition?: string; // What conditions must be met?
  consequence?: string; // What happens?
  duration?: 'instant' | 'persistent' | 'until_traversal';
}

export interface ArtifactCard extends Card {
  type: 'Artifact';
  linkedTo?: string; // Which card/territory it modifies
  modifier?: string; // What it modifies
  effect?: string;
}

export type AnyCard = TerritoryCard | LegendCard | CharacterCard | MemoryCard | EventCard | ArtifactCard;

// Game zone representations
export interface CardZone {
  name: string;
  cards: AnyCard[];
  isPublic: boolean;
}

/**
 * A physical copy of a card in play.
 *
 * Card definitions (AnyCard above) are immutable shared data — two players can
 * hold the same definition. Everything that varies per copy lives here, so
 * exhausting one player's Serpent never touches another copy of it.
 */
export interface CardInstance {
  instanceId: string;
  cardId: string;
  ownerId: string;

  /** Spent this turn; cleared during Awaken. */
  exhausted: boolean;

  /** Vínculo, Circulação, Eco… keyed by name so new markers need no type change. */
  counters: Record<string, number>;

  /** Instance-level overrides of the definition's starting values. */
  memoryState?: MemoryState;
  transformationState?: TransformationState;

  /** instanceId of the card this one is linked to (a Legend, or the Territory). */
  linkedTo?: string;
}
