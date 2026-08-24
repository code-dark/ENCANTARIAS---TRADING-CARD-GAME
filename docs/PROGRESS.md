# ENCANTARIAS Implementation Progress

## Current Status: Phase B Complete ✓

**Completed: Foundation & Core Game Logic**

### Phase A: Foundation (2 days) ✓

**Card System**
- ✓ Card type system (Territory, Legend, Character, Memory, Event, Artifact)
- ✓ Memory states (Oral, Territorial, Roots, Shared, Corporate, Media)
- ✓ Transformation states
- ✓ Affinity system (15 types)
- ✓ Card registry structure

**Game State**
- ✓ Central game state (GameState interface)
- ✓ Player model with hand, deck, discard
- ✓ Turn phases (Awaken → Memory → Movement → Manifestation → Action → Consequence)
- ✓ Phase progression logic
- ✓ Turn management
- ✓ Action history tracking

**Core Mechanics**
- ✓ Affinity system (matching card to territory)
- ✓ Ressonância detection (territory + legend interactions)
- ✓ Traversal logic (territory switching)
- ✓ Memory persistence rules (which memories travel vs. stay)
- ✓ Transformation system (state changes)

**Card Data**
- ✓ 4 Territories (Fonte, Igreja, Escadaria, CEPRAMA)
- ✓ 3 Legends (Serpent, Lady of Bells, Keeper of Paths)
- ✓ 3 Characters (Listener, Wanderer, Mediator)
- ✓ 6 Memories (various states)
- ✓ 4 Events
- ✓ 3 Journeys

**UI Components**
- ✓ GameScreen (main game view)
- ✓ Board (territory + linked cards)
- ✓ Hand (player cards)
- ✓ PhaseIndicator (turn phase display)
- ✓ CardVisual (card rendering)
- ✓ Design system (color palette, typography)

**State Management**
- ✓ Zustand store setup
- ✓ Game initialization
- ✓ State mutations

**Infrastructure**
- ✓ Vite configuration
- ✓ TypeScript strict mode
- ✓ Build system working
- ✓ ESM modules

**Commits**
- ✓ Phase A foundation commit
- ✓ Build fixes commit

---

## Phase B: Playable Turn Loop ✓

**Card instances.** Phase A stored play state on shared card definitions, so
two players holding the same card would have shared exhaustion and counters.
Definitions are now immutable data resolved through `cards/cardRegistry.ts`,
and every copy in a zone is a `CardInstance` carrying its own exhaustion,
counters and memory state.

**Zones.** Added `inPlay` (manifestations) and a per-player `territories` pool
with one `activeTerritoryId`. A manifestation records the territory instance it
is linked to, which is what makes "this Memory stayed behind" visible on the
table rather than merely implied.

**Validation with reasons.** `game/validators.ts` returns a player-readable
reason for every refusal ("Serpent Encantada costs 3 Memória; you have 1"),
which the UI shows on hover and in an error banner. Nothing mutates state.

**Turn resolution.** `rules/turnResolver.ts` is the single entry point.
Phase-gated actions: Memory draws, Movement traverses, Manifestation plays,
Action resonates. Awaken runs automatically for the incoming player and clears
exhaustion. Per-turn flags cap draw and Travessia at one each.

**UI wired to the engine.** The store holds no rules; it dispatches actions and
surfaces refusals. Clicking a hand card manifests it, territory buttons perform
Travessia, table cards activate Ressonância, and the log narrates what happened.

**Tests: 24, covering** phase order, turn hand-off, turn ownership, draw limits,
empty deck, cost refusal, territory-to-pool play, Travessia persistence
(Roots stays / Shared travels), one-Travessia-per-turn, foreign territory,
the state-driven persistence rules, Ressonância hit and miss, exhaustion, and
Awaken clearing it.

**Verified in a real browser** (Chromium via Playwright): full loop of
Awaken → draw → Travessia → manifest, no console errors. Two layout defects
found and fixed that the build could not have caught — the phase indicator
overlapping the header, and small cards too narrow to hold a title.

### Travessia cost

Travessia is no longer free. It is paid in Memória — the same resource that
manifests cards — so crossing is an opportunity cost rather than a free reskin
of the table, as the GDD requires.

The price follows the map instead of being a flat toll: crossing between
Territórios that share an affinity costs `TRAVESSIA_BASE_COST` (1); jumping to
an unrelated context adds `TRAVESSIA_UNRELATED_SURCHARGE` (1). Both are
constants in `mechanics/traversal.ts` and are balance dials for playtest.
The price is shown on each Território button and named in the refusal when it
cannot be paid.

**Open balance finding.** Across the four shipped Territórios, Fonte do
Ribeirão shares no affinity with any other, so every crossing to or from it
costs the maximum 2, while Igreja / Escadaria / CEPRAMA form a fully connected
triangle at 1. With the current starting decks that taxes Player 1 (Fonte +
Escadaria) twice over for every crossing Player 2 makes at half price. This is
a design decision for the author, not something to patch by editing the
affinities of a real place: those are [PROVISIONAL] research-dependent content.

### Memories are discovered, not drawn

Memories no longer sit in a deck. They wait in a world pool owned by no player
(`GameState.memoryPool`) and are reached by interacting with the world, so that
memory is a relation and a discovery before it is a resource.

Each Memory carries a `discovery` descriptor: which interactions can surface it
(`explore` / `resonance` / `event` / `artifact`), which affinities the Território
must carry, and — for listening — how much Escuta it takes to hear. Escuta scales
inversely with how public the narrative already is: the Media memory asks 1, an
Oral account asks 3, and the rooted layer of the spring cannot be heard at all.

**Exploração de Território.** In the Action phase a Personagem manifested in the
active Território listens. What surfaces depends on their Escuta and on what that
place has to give. It costs the Personagem their turn (exhaustion), and a dead
end is refused *before* it costs anything, naming who heard nothing where.

**Ressonância opens layers listening cannot reach.** When a Lenda resonates with
a compatible Território it uncovers Memories keyed to that pairing. `Roots: The
Eternal Spring` exists nowhere else in the game: only the Serpent manifesting at
Fonte do Ribeirão opens it, and the highest Escuta in the game still cannot hear
it. The same holds for the Cathedral records and the Lady of Bells.

A discovered Memory enters play rooted in the Território that gave it up, which
is what makes the Roots / Shared distinction concrete at the moment of Travessia.

Decks now hold only what a player brings to a place — Lendas, Personagens,
Acontecimentos. The Memory phase draws from that deck and yields the Memória
that pays for manifestations; it no longer hands out Memory cards.

Tests: 12 new (43 total) covering the pool, listening, rooting, exhaustion cost,
the Escuta threshold, the affinity requirement, dead ends charging nothing, phase
gating, resonance revealing, and the fact that a resonance-gated Memory is
unreachable by listening.

**Not yet wired.** Two of the four discovery sources exist in the data shape and
the pool query but have no execution path: `event` needs the Acontecimento effect
system, and `artifact` has no cards at all — the GDD warns against inventing
culturally sensitive objects, so those wait on research rather than on code.

### Tags, addressable sources, and the seven-phase turn

Three changes from the consolidated design spec, all of them foundations that
later content depends on.

**Open tags alongside typed affinities.** `affinities` stays a closed union of
15 values, because those are the relations the rules themselves reason about
(Ressonância, Travessia pricing). `tags: string[]` is open: cards ask "is there
a Território tagged `subterraneo`?" instead of naming a place, so adding a
Território never requires touching a card that wants to react to it.
`mechanics/tags.ts` holds the queries.

**Sources are addressable, not categorical.** `MemoryDiscovery.via` still says
what *kind* of interaction reaches a Memory. Alongside it, `sources: string[]`
names *which origin* hands it over — `territorio_fonte_ribeirao`,
`ressonancia_serpente_ribeirao`, and eventually `evento_reurbanizacao` or a
place a photograph points at. `findBySourceId` treats the origin as an opaque
string, so a new card can name a new origin without a code change. Exploring a
Território consults its `memorySources`, falling back to affinity for Memories
that name no origin.

**Seven phases**, named as the spec names them: Despertar, Memória, Travessia,
Manifestação, Ação, Acontecimento, Encerramento. Consequência was split because
those are two different moments — Acontecimento changes the world, Encerramento
reads what the change produced (Ressonâncias, Transformações, end conditions).
Phase identifiers and UI copy are now Portuguese throughout.

Tests: 13 new (56 total) covering tag matching, untagged cards, instance
filtering, default and explicit territory origins, resonance-as-origin, unknown
origins returning empty rather than failing, multi-origin Memories, and two data
integrity checks (every Memory names an origin; every Território carries tags).

### Known gaps carried into Phase C

- Ressonância detects and logs the unlocked manifestation and grants Vínculo,
  but the unlocked *effects* are not executed yet.
- Every shipped Memory declares an explicit `traversalBehavior`, which wins over
  its `memoryState`. The state-driven rules are proven by unit tests but are
  currently unreachable from card data — worth resolving as a design decision.
- Journeys are dealt and displayed but progress is not evaluated.
- Economy is provisional: one Memória per turn against costs of 1-3 makes the
  opening turns tight. Needs playtesting, not guessing.
- The board's centre is largely empty; visual weight is Milestone 5.

## Next: Phase C (Ressonância effects, Transformação, Jornadas)

See the plan file for the full milestone list.
