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

  /**
   * Typed, closed vocabulary used by Ressonância and Travessia pricing.
   * Kept small on purpose: these are the relations the rules reason about.
   */
  affinities: Affinity[];

  /**
   * Open vocabulary. Cards query these instead of checking names, so
   * "is there a Território tagged subterraneo?" keeps working when new
   * places are added. Adding a tag never requires touching the engine.
   */
  tags?: string[];

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

  /**
   * Origins investigating this place consults. Usually its own id, but a
   * Território can open onto more than one body of memory.
   */
  memorySources?: string[];
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

/**
 * How a Memory can be reached. Memories are not drawn from a deck: they are
 * earned by interacting with the world, because a memory is a relation and a
 * discovery before it is a resource.
 */
export type MemorySource = 'explore' | 'resonance' | 'event' | 'artifact';

export interface MemoryDiscovery {
  /** Which kinds of interaction can surface this Memory. */
  via: MemorySource[];

  /**
   * It surfaces only in a Território carrying one of these affinities.
   * Defaults to the Memory's own affinities — a memory belongs where it belongs.
   */
  inAffinities?: Affinity[];

  /**
   * Minimum Escuta a Personagem needs to hear it, for 'explore'.
   * Public, circulating memories ask for little; deep or quiet ones ask more.
   */
  escuta?: number;

  /** For 'resonance': only this Lenda manifesting can open this layer. */
  byLegend?: string;
}

export interface MemoryCard extends Card {
  type: 'Memory';
  memoryState: MemoryState;
  linkedTo?: string; // Legend or Territory it's linked to

  /**
   * Addressable origins this Memory can be reached from — a Território, a
   * Ressonância, an Acontecimento, a place a document points at. Anything
   * that can name a source can hand this Memory over without the engine
   * knowing what that source is.
   */
  sources?: string[];

  /** How this Memory is found. Absent means it cannot be discovered yet. */
  discovery?: MemoryDiscovery;

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
