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

### Objects: the material supports of memory

Three Objects, in the three categories the spec names, plus the rule that makes
them mean something.

**Storage — Caixa de Recordações (capacity 2).** A kept Memory points at the
container instead of at the Território. That single link change is what takes
it out of circulation: Ressonância reads the table, and the table is what is
linked to the active Território, so exclusion follows from the structure rather
than from a rule that has to remember to apply it. `preservação × circulação`
is a real choice — the safest place for a Memory is also the place where it
does nothing. `RetrieveMemory` brings it back, so keeping is never a trap.

**Document — Recorte de Jornal.** Reaches a Memory tagged `midia` whose origins
include the Território the player is standing in. Reach bounded by place.

**Photograph — Fotografia da Beira-Mar.** Names the origin `beira_mar` and
reaches a Memory of a place the player is *not* standing in. This is the case
that shows why sources are addressable strings rather than territory ids.

An Object never creates a Memory. When the world holds no answer, the object
plays and nothing is added — there is a test asserting exactly that.

**A board distinction that would have been a bug.** A kept Memory links to the
container, so it would have rendered under "Ficaram para trás" — as if a
Travessia had abandoned it. The board now separates three states: on the table
here, kept in an object, and left behind in another Território. Those are three
different things and the player has to be able to tell them apart.

Tests: 12 new (68 total) covering keeping, out-of-circulation, capacity refusal,
non-Memory and non-container refusals, retrieval, retrieving what was never
kept, a photograph reaching across places, a clipping bounded by place, and an
object creating nothing when the world is empty.

**Not included: no sacred, ritual or restricted object was invented.** The three
here are generic material categories — a container, a clipping, a photograph.
The Beira-Mar Memory is marked `[PROVISIONAL]` and deliberately asserts only
that images circulate, not anything about that shoreline's practices or people.

### Cemitério do Gavião, the cortejo, and conjunction Ressonância

**A Ressonância that needs a gathering.** Until now a Ressonância was one card
in the right place. `Cortejo Maldito` needs three things at once — Carruagem de
Ana Jansen, Mula-sem-Cabeça — Carruagem de Ana Jansen, and Cemitério do Gavião —
so `TerritoryCard.conjunctions` declares sets that must all be manifested here,
and `detectConjunctions` reads the table.

Its effect is structural rather than numeric, as the spec asks: the gathering
opens a layer of the place that nothing else reaches. `A Passagem Ouvida` is
gated behind `ressonancia_cortejo_maldito` and no amount of Escuta finds it.

**This gives Encerramento a job.** The phase was split out to "read what the
change produced", and that is now literally what it does: conjunctions are
recognised there. Each one fires **once** — the Território records it in its
counters — so standing on the same table every turn does not reopen it. That is
the infinite-Ressonância loop the GDD's QA section warns about, closed by
construction and covered by a test.

A participant kept in a Caixa is not present at the gathering. That falls out of
the storage model rather than needing a rule, and there is a test for it.

**The map problem improved on its own.** Cemitério do Gavião shares `Memory`
with Fonte do Ribeirão, so the spring is no longer an island: it now has one
cheap neighbour. This happened *without* editing any existing place's
affinities, which is what was refused earlier for balance reasons. The map is
now a path — Fonte — Cemitério — {Igreja, Escadaria} — CEPRAMA — with the spring
and the market at opposite ends. CEPRAMA ↔ Cemitério remains 2.

Tests: 10 new (78 total) covering partial gatherings, the full gathering, the
gated Memory, firing once across a full round trip, a Território with no
conjunction declared, a participant kept in an object, order independence, and
the new map connectivity.

**Ana Jansen — decided by the author.** Carruagem de Ana Jansen stands as a
collectible Lenda. The author's position: she is a legend and an iconic figure
of Maranhão's popular history, and that holds despite the questions behind the
story. The card remains about the apparition as it circulates in the city rather
than a biography, and the historical layer stays `[PROVISIONAL]` pending
research. The separate decision about the enslaved coachman is unchanged: he
stays as context of the Carruagem and does not become a card.

### Exploração rolls 1d6

Discovery is an active attempt, so it can fail. The threshold is 2+ on 1d6 —
83% — chosen against 3+ or 4+, which would drop average generation to 0.67 or
0.5 Memórias per turn against one attempt per turn and deepen the economic
bottleneck rather than temper it.

| Roll | Outcome |
|---|---|
| 1 | Nothing comes through this time |
| 2–5 | One account surfaces |
| 6 | The place offers a choice between two |

The Personagem is spent whichever way the die lands: the attempt is what costs,
not the result. This is distinct from the pre-existing refusal when a place has
nothing to give at all — that is still checked before anything is spent, because
a known-empty search is not a failed attempt.

**The die is deterministic.** The engine is pure and a match replays from its
log, so rolls come from a seed in the game state (`game/random.ts`, an LCG), not
from `Math.random`. Tests pin a seed per face instead of hoping for one. A
fairness test rolls 6000 times and checks the distribution and the 83%.

**A found Memory is not yet a kept Memory.** At the table the player reads the
fact aloud before it counts. Digitally that cannot be verified, so the intent is
preserved instead: the Memory waits in `pendingDiscovery`, the UI shows the die
face and the account's text, and nothing else can be done until the player
confirms having read it. Only then does it leave the world and root itself. On a
6, the option not taken stays in the world.

**A correctness fix this surfaced.** Measuring reach per Território showed
`Territorial Memory of Bells` — which names only Igreja da Sé as its origin —
being found at CEPRAMA and Cemitério do Gavião, leaking in through the affinity
fallback. A Memory that names where it comes from should be reachable there and
nowhere else; sharing an affinity is not the same as belonging. Affinity is now
the fallback only for Memories that name no origin at all.

Explore reach per Território at Escuta 4 is now: Fonte 1, Igreja 1, Escadaria 2,
CEPRAMA 2, Cemitério 1. **The 6-boon is therefore live only at Escadaria and
CEPRAMA** — everywhere else a 6 is just an ordinary find, because those places
hold a single account. That is content work (more Memórias per place), not a
code problem, and it is the clearest argument for expanding the Memory set next.

Tests: 17 new (95 total).

### The game speaks Portuguese

Every string the player reads is Portuguese: refusals, the turn log, card names
and texts, and the UI. Identifiers stay English because they are code — renaming
a union member ripples through every file that reasons about it, and the
compiler's checks on affinities depend on that union. Display labels live in
`core/i18n/labels.ts`.

**Settled later:** the Memory states now read in Portuguese on the card face
while keeping English identifiers — see "Two decisions closed before the
simulator" below.

### Jornadas are the only way to win

A match ends when a player's Jornada is complete. There is no life total, no
capture and nothing to remove from the table; the other player loses by having
been slower, and the log says so in those words.

**Verification is automatic and happens at Encerramento**, for the player whose
turn is ending only. A Jornada is completed on your own turn, by what you did in
it. When every requirement is met the match ends immediately: `isEnded` is set,
`winnerId` names the player, and the validator refuses every further action.

**Requirements are data.** `JourneyRequirement` is a closed union — Memórias in
play (optionally filtered by state or tag), Territórios visited, Ressonâncias
activated, gatherings formed, a resource threshold, a Lenda of a given affinity.
A new Jornada is a new entry in `cards/data/journeys.ts`; the evaluator in
`mechanics/journey.ts` already knows how to read it. That is what lets two
players at the same table be playing for genuinely different reasons.

**Evaluation is a snapshot, not a ledger.** What is verified is what is true at
that moment. A Memória kept inside a Caixa still counts — preserving it is still
holding it — and spending Vínculo can take an objective back off. The Jornada
asks what you are sustaining, not what you once touched.

**Two things the zones cannot remember** are tracked per player in
`accomplishments`: places crossed and relations opened. Each is a list of
identities rather than a count, so walking back and forth adds nothing and
re-activating the same Lenda in the same place is one Ressonância, not two.

**`transformacoes` is in the schema and used by no Jornada.** Nothing in the
turn resolver transforms a card yet, so a Jornada requiring one would be
unwinnable; a test fails if one is ever written before the trigger exists.

**Jornadas are now assigned, not dealt.** `getRandomJourney` used `Math.random`,
which the engine forbids. The vertical slice pairs each deck with the Jornada it
is built for: Jogador 1 listens (Guardiã da Memória), Jogador 2 reassembles the
passage (O Cortejo).

Tests: 20 new (115 total). Verified in Chromium: a real turn — listen, transmit,
Encerramento — moves the counter and announces the objective in the log.

### Cards do what they say

Until now every effect in the game was prose: the log printed the sentence and
the match went on unchanged. `core/effects/` closes that. `GameEffect` is a
closed union of things the engine can really do — gain a resource, draw, reveal
what the world holds under an origin, open a free Travessia, wake the
Personagens standing here, transform a card — and one executor runs them for
Ressonâncias, Acontecimentos and gatherings alike. No card carries code.

**Prose and effect must agree.** Several cards promised rules the engine does
not have ("cartas de afinidade Água ganham força" — there are no stats). Rather
than fake them, the text was rewritten to say what actually happens. Where that
was impossible, the card keeps its text and gets no effects, marked in place:
`Esquecimento` describes a rule that fires by itself over turns, and the engine
has no temporal triggers yet.

**Acontecimentos are a live way of reaching memory.** `revelarMemoria` hands
over what the world already holds under an opaque origin string — it never
creates one. Two Memórias now name `acontecimento_tempo_de_festa` as their
origin, so `Tempo de Festa` reaches something no amount of listening reaches.
That was the last discovery source that existed in the schema and nowhere else.

**`transformacoes` is no longer inert.** Transforming records the card in the
player's accomplishments, so a Jornada can now ask for one. The card says what
it has become, on its face, because a transformation nobody can see is a rule
nobody can learn.

**A correctness fix this surfaced**, and it is the same class as the Sé leak
from Phase B. `A Passagem Ouvida` — opened only by the Cortejo gathering — was
turning up at the Fonte do Ribeirão under the Serpente, because
`findByResonance` fell back to affinity whenever the Memory named no specific
Lenda. Sharing an affinity with a place is not belonging to it. Ressonâncias can
now name themselves (`id`), a Memory's declared `sources` are authoritative, and
affinity is the fallback only for Memories that name no origin at all. Two
regression tests hold the line.

Tests: 23 new (138 total). Verified in Chromium: manifesting the Serpente at the
Fonte grants the Vínculo and the Memória its text promises, wakes nobody when
nobody is spent, and reveals exactly one Memória — the one that names that
relation.

### Gatilho → condição → efeito, tudo como dado

The executor above resolved effects, but the *moment* was still implied by
where the list was attached and there was no way to say "only if". Both are
data now.

**`EffectRule` on any card**: `quando` (aoManifestar, aoRessoar,
aoDescobrirMemoria, aoEncerrarTurno), `se` (a closed union of conditions —
resource threshold, Memórias in play, a mark on the place, a card present, and
negation), `entao` (the effects), plus the sentence the player reads. The
resolver announces moments; cards decide whether they care. `fireTrigger` walks
what is standing in the active Território — a card left behind elsewhere is not
there to react.

Two cards now carry their own written abilities as rules rather than as
promises: the Serpente Encantada gains Vínculo when a Memória is read aloud
where she stands, and the Guardião dos Caminhos gains Circulação at the end of
a turn **only in a place still marked by a festa**.

**A place can be changed, not just a card.** `marcarTerritorio` leaves a named
mark on the active Território. It stays with the place after the turn ends, any
card can ask about it by name without knowing what put it there, and the board
shows it under "O que ficou neste lugar".

**The read-aloud rule now covers every discovery.** `revelarMemoria` used to
hand Memórias over silently, which made an Acontecimento a cheaper way to get
memory than listening — and quietly contradicted the rule that a Memória counts
only once transmitted. It now queues into `pendingDiscovery`, which grew a
`mode`: `escolha` (the 6 offers alternatives, one is taken, the rest stay in the
world) and `leitura` (everything surfaced must be read, one at a time).

**A soft-lock this surfaced.** `TransmitMemory` was gated to the Ação phase, so
a Memória surfaced by an Acontecimento — played in Manifestação — could never be
read, and the pending-discovery gate blocks everything else. Reading aloud is
not a phase action: it resolves an interrupted moment, and now short-circuits
the phase check. A test plays the festival in Manifestação and reads there.

Tests: 7 new (145 total). Verified in Chromium: Tempo de Festa marks the Fonte
do Ribeirão, surfaces two accounts without granting them, and each is computed
only after its own reading.

### First balance pass: what a Ressonância pays

A Ressonância paid one Vínculo per relation recognised *and* ran the effects,
so the Serpente at the Fonte — which meets that place twice, by name and by
Water — handed out three Vínculo in a single action and raced any Jornada
asking for the resource.

**One Vínculo per activation now, however many relations match.** Extra
relations still matter, and matter more: they widen what the Ressonância *does*.
Two relations make the combination richer, not the progression three times
faster.

Four relations were paying Vínculo directly, which would have re-created the
same payout one layer down. They were rewritten to enrich instead:

| Lugar | Antes | Agora |
| --- | --- | --- |
| Fonte / Serpente | +1 Vínculo, e desperta | desperta quem escutou |
| Igreja da Sé / Fé | +1 Vínculo | o lugar guarda a marca `devocao` |
| CEPRAMA / Ofício | +1 Vínculo | quem trabalhou pode trabalhar de novo |
| Cemitério / Memória | +1 Vínculo | o lugar acumula a marca `lembranca` |

A test guards this at the data level: no shipped relation may hand over Vínculo,
so a future card cannot quietly bring the per-relation payout back.

Vínculo now comes from activating a Ressonância (once per turn, per card), from
forming a gathering, and from cards that earn it — the Serpente gains one each
time a Memória is read aloud where she stands. That last one is a card's own
rule, which is where the resource should come from.

Measured in Chromium on the same action that produced the problem: 3 → 1, with
both relations still firing.

Tests: 3 new (148 total).

### Two decisions closed before the simulator

Both were blocking: a simulator is only worth building once it runs exactly the
rules a real match runs.

**The interface speaks Portuguese; the code keeps its enums.** Memory states
read Enraizada / Compartilhada / Corporativa / Midiática on the card face, while
`Roots` / `Shared` / `Corporate` / `Media` stay as identifiers — a closed union
the compiler checks. `Corporate` reads *Corporativa* rather than Institucional
so it does not collide with the *Institucionalizada* transformation, which is a
different thing happening to a different kind of card. The English state prefix
was also dropped from card names (`Roots: A Fonte Perene` → `A Fonte Perene`):
the badge already shows the state, in Portuguese, and the name should be the
account's name.

**`memoryState` is the structural rule; `traversalBehavior` is an explicit
exception.** The precedence is inverted and, more importantly, the data was
cleaned so the inversion means something. Measuring first showed that *no card
contradicted its state* — 12 declarations merely restated the rule and 18 sat on
states whose rule was affinity-based and quietly bypassed it. So the state rules
were completed to say what the states mean, and 29 of 30 declarations were
removed:

| Estado | Regra |
| --- | --- |
| Enraizada, Corporativa, Territorial | fica |
| Compartilhada, Midiática | acompanha |
| Oral | contextual: acompanha onde houver com que se ligar |

Oral is the contextual one on purpose — an account that lives only in speech
carries over where the new place gives it a foothold. Exactly one card now
declares an exception, `O Que a Festa Não Contou`, whose whole text is about
being left behind; a test fails if that list grows silently, because a state
everything opts out of stops meaning anything.

**An inconsistency this surfaced.** Objects still handed their Memory over in
silence while listening and Acontecimentos required reading aloud. A record
gives *access*, not transmission — it now queues for reading like everything
else. The rule belongs to the Memory, not to the action that found it.

Tests: 5 new (153 total). Verified in Chromium: the Recorte de Jornal at the Sé
reaches A Reportagem do Centenário, waits to be read, and the card on the table
reads **Midiática**.

### The simulator

`npm run sim -- --partidas 1000` plays matches headlessly and reports what
happened. It exists because three questions were being decided by feel — does
the Memória economy choke, does Vínculo arrive in time, are the Jornadas
reachable — and the engine is pure and seeded, so they can be answered instead.

**It plays the same game the interface plays.** The table is built by
`core/setup/verticalSlice.ts`, which the UI now uses too, and every action goes
through the same `applyAction` a person's click goes through. A policy has no
privileges: it proposes an action and the validator refuses it exactly as it
would refuse a person. If the simulator and a real match ever disagree, that is
an engine bug, not a difference in the harness — which is the only reason its
numbers are worth anything.

Two policies, both deliberately dumb. **gulosa** chases its own Jornada:
manifests a Personagem first, resonates with everything it can, listens, crosses
when the Jornada asks for places. **passiva** only draws and manifests — the
control, so whatever the greedy player achieves above that line is what
listening, resonating and crossing are worth.

`npm run sim:trace -- --seed 7` replays one match with its full log. A number in
the report is worth what the match behind it is worth, and a suspicious average
can always be traced back to the turns that produced it.

Reported per run: duration (mean, median, range), matches decided by Jornada
versus by turn limit, wins per Jornada, and per player the objectives met,
Vínculo per turn, Ressonâncias activated, listens and how many found something,
Memórias transmitted, Travessias, places used, gatherings, transformations, and
what was left unspent.

Tests: 6 new (159 total), including that a seed replays identically and that the
simulator builds the same table the interface does.

### What the simulator found

Three engine bugs, fixed, and one structural problem that is the author's to
decide. The first run ended every match on turn 2 with the same Jornada winning
100% of the time; after the fixes, no match finishes at all. Both extremes were
real, and neither was visible from reading the code.

**A Memória was resonating.** Any card on the table could activate a
Ressonância, and affinity-matched relations accept any card carrying the
affinity — so every account found became a second Vínculo engine. A Memória is
what a Ressonância *opens*; it does not enter into one. Refused now.

**A card that was not there could resonate.** The check never looked at where
the card was standing, so one left behind in another Território — or kept
inside a Caixa — still had a relation with the place the player was in. That
undoes what storing a Memória is *for*. Only what is present resonates now.

**A relation paid Vínculo every turn.** Re-activating the same card in the same
place paid again each turn: the same faucet the per-relation payout opened in
breadth, re-activation was opening in time. A relation is recognised once. Its
effects still run on re-activation — that is why you would do it — but it does
not pay again.

**The policy had to learn to save.** With the leaks closed, the greedy player
still never manifested its key card: spending on whatever was cheapest each
turn, it could never bank the 3 a Lenda costs. A policy that cannot save
measures a game nobody would play that way. It now holds Memória for a card its
Jornada needs rather than spending it on one that does not help.

#### The finding that is not a bug: the economy stops on turn 3

| | Deck Água | Deck Instituição |
| --- | --- | --- |
| custo total das cartas | 9 | 11 |
| renda total de Memória | 5 | 5 |
| déficit | 4 | 6 |

Memória — the resource that pays for manifesting *and* for crossing — is granted
only by drawing, and a six-card deck with a three-card opening hand yields
exactly three draws. **After turn 3 there is no income at all, for the rest of
the match.** Roughly half of each deck is unplayable, permanently, and the trace
shows it plainly: from turn 4 to turn 20, one player does nothing but wake up.

Everything downstream follows from that, and none of it is a Jornada problem:
Guardiã da Memória cannot reach 3 Vínculo because the only card that resonates
in that Território costs 3 and can never be afforded; a Território also runs dry
after about five listens, and without income there is nothing to do but pass.

This wants a decision rather than a tuning pass. Options, in the order I would
try them: income at Despertar independent of the deck; a Território's
`placeAction` producing Memória, so the place is the source; or simply larger
decks. The first is the smallest testable move; the second is the most
ENCANTARIAS-shaped.

### The Território is where Memória comes from

The economy no longer comes from drawing. A player does not gain mana: they
listen to a place, find something the city had not given up yet, say it out
loud, and only then is it theirs to spend.

    Território → Escuta → 1d6 → 2+ → busca contextual → leitura em voz alta → +1 Memória

**The resource is computed after the reading, never before.** That is the same
rule the game already had about Memory, now carrying the economy: the reading is
what completes the transmission, so it is what completes the payment. A 6 offers
two accounts and still pays +1 — the choice is the reward, not inflation. A 1
pays nothing. **One Escuta per Território per turn**, however many Personagens
are standing in it, which puts income at roughly 0.83 per turn.

**Only the Escuta pays.** A record already in hand reaches a Memory that exists,
but it does not make the city yield anything new — `pendingDiscovery` now
remembers what surfaced it, so a deck of documents cannot print the economy.

**Drawing gives a card and nothing else.**

**A place no longer runs dry, in principle.** When a Território has given up its
own accounts, listening widens: to what a Lenda manifested there carries with
it, and to what shares the ground's vocabulary *and* could belong there. Both
conditions are needed — tags like `urbano` sit on four of the five Territórios,
so a shared word alone would make every account audible everywhere, which is the
leak this must not reopen.

Measured before and after, 500 matches, greedy against greedy:

| | antes | depois |
| --- | --- | --- |
| partidas decididas por Jornada | 0% | 100% |
| duração mediana | — (limite) | 9 turnos |
| Memórias transmitidas por p1 | 5 | 10 |

#### The widening reads what the player already knows

The fallback above was gated behind manifesting a Lenda, which needs the income
the widening was supposed to provide — so a player whose place ran dry stayed
dry. It now also reads the vocabulary of the Memórias already on the player's
table, wherever they ended up. What you have learned is what lets you notice the
next thing, and unlike a Lenda it costs nothing to have.

The territorial requirement stays: a known word widens the horizon of listening,
it does not flatten the map. Sharing `circulacao` with an account does not make
it audible at a spring that has no affinity with it.

One rule, no content touched, measured over 1000 matches:

| | antes | depois |
| --- | --- | --- |
| Guardiã da Memória | 100% | 63.4% |
| O Cortejo | 0% | 36.6% |
| turno mediano da vitória | 9 | 7 (ambas) |
| Cortejos formados por partida | 0.00 | 0.39 |

**Both Jornadas now win on the same clock** — median turn 7, ranges 7–11 and
7–12 — which was the target: a plausible window for each before the policy's
skill decides it, not an engineered 50/50. Against the passive control the
greedy player still wins 100%, so listening, resonating and crossing are worth
what they cost.

**The Cortejo discount was therefore not applied.** The economy fix resolved the
gap on its own, and tuning a Jornada now would be adjusting against a problem
that no longer exists — and would blur which change did what, which is exactly
what sequencing the two was for. The design for it is recorded below if the gap
returns.

> Preparação do Cortejo: standing in the required Território with the listener
> and the narrative relation already established, the next Manifestação
> belonging to the Cortejo costs 1 Memória less — so the Jornada's own
> preparation pays part of the manifestation, rather than the steps only
> accumulating cost.

#### One finding this leaves open

**The two Jornadas are not on the same clock.** Guardiã da Memória wins 100% of
matches. Completing it costs about 5 Memória (a Personagem, then a Lenda to
resonate with); O Cortejo costs about 10 — a Personagem, a Travessia, and two
Lendas totalling 5 — on the same income. That is not a percentage to tune
towards 25; it is one Jornada costing twice what the other does.

#### What the policy had to learn

None of the above was visible until the bot stopped playing badly in ways that
hid it. It now listens before resonating (a single Personagem is both the only
ear and sometimes the only card with a relation here, and income comes first);
establishes a listener before crossing (crossing spends exactly the resource
listening earns); holds Memória for a card its Jornada names rather than
spending it on a cheaper one that merely resonates; crosses to where a gathering
could form; and stays there instead of wandering on. Each of those was a
measurement artifact before it was a heuristic — and each one, once fixed,
revealed a real problem underneath.

### An opponent

The vertical slice is playable by one person. The greedy policy moved from the
simulator into `core/ai/`, and the interface drives it through the same
`dispatch` a click goes through — the opponent is subject to every rule a person
is, the same validator, the same refusals, no back door into the state.

**It is deliberately the same brain the simulator measures.** A bot that played
differently from the one the balance was measured against would make every
number in the section above a statement about a game nobody plays. A test fails
if the two ever diverge.

It waits 700ms between actions, which is not suspense: the bot resolves a turn
in microseconds, and a turn that appears already finished teaches nobody what
happened in it. The header says it is playing and the pass button is disabled
while it does, so a pause reads as the game working rather than as the game
stuck.

Verified in Chromium end to end: a full match against the opponent, won by the
person on Guardiã da Memória at turn 9, with the opponent reaching two of three
objectives on O Cortejo by itself and no errors. The README now explains how to
run it and how the game is played.

Tests: 4 new (176 total).

### Playable from a link

The slice needed nothing hosted alongside it. A grep for `fetch`, `XHR`,
`WebSocket` and absolute URLs across the app finds nothing: the engine is pure,
the RNG is seeded in the browser, and the whole game is the static bundle. So
the deployment is just the bundle.

Three things it did need:

- **`base: './'`.** Pages serves a project site from `/<repo>/`, and absolute
  asset paths would look for `/assets/…` at the domain root and find nothing.
  Relative paths also mean the same `dist/` opens from a `file://` URL or any
  static host without rebuilding.
- **A real favicon.** `index.html` pointed at `/vite.svg`, which does not exist
  and 404'd on every load. It is now an inline SVG data URI, so the page carries
  its own icon and asks the host for nothing. The document also declares
  `pt-BR`, which it should have all along.
- **A layout that survives a phone.** At 390px the fixed 300px side panel took
  everything and left the board — the Território, the cards, the Travessia — at
  90px. Below 820px the two stack instead of competing, board first, because
  that is what the player is looking at.

The workflow typechecks, tests and builds before deploying. Publishing a broken
game would waste the session a tester gave us, which is the scarcest thing in
this phase.

Verified by serving `dist/` from a subpath and playing a real turn in Chromium:
no 404s, no page errors, the same match the dev server runs.

**One thing outside the repository, and it cannot be brought inside.** Pages has
to be switched on in Settings → Pages with its source set to *GitHub Actions*.
Automating it was tried — `actions/configure-pages` takes an `enablement` flag
that creates the site through the API — and the workflow token is refused:

    Create Pages site failed. Resource not accessible by integration

Turning Pages on is a repository administration action, and no automation is
granted that. One switch, once, by someone with admin; every deploy after it is
automatic. The repository is public, so Pages costs nothing and needs no plan.

### CI e deploy separados

O Pages foi ligado (Source: GitHub Actions), e com isso a decisão passou a ser
de arquitetura, não de configuração. Publicar a cada push confundiria duas
coisas diferentes: *o código está correto?* e *esta versão deve substituir o
jogo que os testadores estão jogando?*

São dois workflows:

- `CI` — todo push e todo Pull Request: typecheck, 176 testes, build. Não
  publica nada. Um vermelho aqui significa código quebrado, nunca uma
  configuração faltando.
- `Pages` — push em `main`, ou acionamento manual em qualquer branch:
  typecheck, testes, build, publicação.

Uma restrição descoberta na primeira publicação manual: ao ligar o Pages, o
GitHub cria o ambiente `github-pages` limitado ao branch padrão. O build roda e
o artefato sobe, mas o job de deploy é recusado antes do primeiro passo. Liberar
outro branch é uma configuração de ambiente (Settings → Environments →
github-pages → Deployment branches and tags), fora do alcance do token dos
workflows — a mesma classe de coisa que ligar o Pages. Publicar a partir de
`main` não esbarra nisso.

Duas consequências desejadas. Uma falha de deploy não pode mais deixar um Pull
Request vermelho, porque o deploy não roda em Pull Request. E o link de
playtest é estável: `main` é a única fonte automática, então o jogo no ar só
muda quando alguém decide publicar — um branch experimental vai ao ar por
`workflow_dispatch`, sob demanda, e não por acidente de merge.

### O playtest disse "contemplativo"; a medição disse por quê

Os jogadores relataram tres coisas: nao entenderam o objetivo, o ganho de
Memoria parecia desajustado, e o jogo tinha pouca acao. As tres tem a mesma
causa mecanica, e ela aparece numa busca de uma linha:

    onde Vinculo era gasto no motor:
      journeys.ts:65  requirement: { recurso: 'vinculo', minimo: 3 }

Vinculo era ganho e contado. Nunca era preco de nada. Existiam duas moedas e so
uma delas era moeda: Memoria entrava toda rodada pela Escuta (83% de sucesso,
sem custo, sem teto) e pagava cartas e Travessia; Vinculo entrava raramente pela
Ressonancia e nao pagava nada.

Um jogador racional entao faz Escuta todo turno e ignora o resto. 500 partidas
mediram exatamente isso: 7.6 Escutas em 7.6 turnos, 1.6 Ressonancias, **0.0
Travessias**, 1.0 Territorio usado, 3.5 de Vinculo ocioso no fim. O Territorio —
a tese inteira do jogo — era uma constante na pratica.

A Jornada cumprida por acumulo e o que faz o objetivo parecer arbitrario: nada
que o jogador escolheu causou a vitoria.

### O que foi feito, e o que o instrumento pegou no caminho

Travessia passou a custar Memoria **e** Vinculo, e a Escuta passou a ficar mais
dificil quanto mais ja se ouviu naquele lugar. As duas juntas, na primeira
calibragem, produziram uma trava: o limiar subia um passo inteiro por escuta e
chegava a 6 na quarta, a renda desabava para 27%, e uma partida rastreada
mostrou **onze turnos seguidos em que o jogador so despertava** — sem compra,
jogada, Escuta ou Travessia possiveis. Vinculo so vinha de relacoes novas, que
em geral estao em outros lugares: era preciso Vinculo para alcancar a unica
fonte de Vinculo.

Tres correcoes fecharam o ciclo:

- o limiar sobe meio passo por relato e para em 4+ — o lugar tem menos a dizer,
  nunca fica mudo (teste cobre isso explicitamente);
- Ressonancia paga Vinculo em **toda** ativacao. O teto existia porque Vinculo
  era renda sem dreno; agora que tem dreno, o teto so travava;
- chegar a um Territorio nunca escutado devolve a Escuta do turno, para que
  atravessar compre algo em vez de apenas custar.

### O que continua sem resolver

A estrategia dominante nao mudou. Ainda sao ~1 Escuta por turno, todo turno, e
0.3–0.8 Travessias por partida — e quando acontecem, por volta do turno 7 de 9.
A aritmetica explica: ficar parado da 0.5 de Memoria por turno de graca; mover
custa 2 de Memoria e 1 de Vinculo de uma renda vitalicia de ~7. Numa partida de
9 turnos, qualquer investimento com retorno acima de ~3 turnos e irracional.

Isso nao se resolve por calibragem, e o simulador ja nao e o instrumento certo:
cada numero agora mede tanto a politica gulosa quanto o design, porque foi
preciso ensinar ao bot cada incentivo novo e ele foi escrito para a economia
antiga. A decisao seguinte e de forma da partida — duracao, ou recompensa
imediata e grande por mover — e pede playtest humano.

### Sem limite de turnos, e a Escuta rendendo onde se chega

Duas decisoes de design. A partida nao tem mais teto de turnos: ela termina
quando alguem completa uma Jornada e em nenhum outro momento — ninguem e
expulso da propria historia por tempo. O numero continua existindo como
`maxTurns`, mas so como trava de seguranca do simulador, e um jogo real e
construido com `NO_TURN_LIMIT`. Estatisticamente nao mudou nada: o limite
nunca estava sendo atingido (0% antes, 0% depois). E principio, nao correcao.

A segunda foi apostar no que o playtest gostou. Chegar a um Territorio nunca
escutado ja devolvia a Escuta do turno; agora ir a um lugar nunca ouvido custa
**so Memoria**. Vinculo passou a ser o preco de *retornar* — de voltar a um
lugar que ja se perguntou, que e o movimento que nao acrescenta nada.

O efeito foi o que faltava desde o inicio:

| | antes | depois |
| --- | --- | --- |
| Travessias por partida | 0.3 / 0.8 | **1.1 / 1.0** |
| Territorios usados | 1 | **2.0 / 2.0** |
| Ressonancias (p1) | 1.6 | **3.4** |
| Vinculo por turno (p1) | 0.27 | **0.50** |

### Dois bugs que a mudanca revelou

**Estado compartilhado entre partidas.** `FRESH_ACCOMPLISHMENTS` era uma
constante, e espalha-la copiava as *referencias* dos seus containers — todo
jogador de toda partida dividia o mesmo mapa. Inofensivo enquanto nada
escrevia nele no lugar; um vazamento silencioso no instante em que algo
escreveu. Numa corrida de 500 partidas isso envenenaria todos os numeros
depois do primeiro. Agora e uma funcao, com teste de regressao.

**O Territorio inicial nao contava.** `territoriesVisited` so registrava numa
Travessia, entao o lugar onde o jogador comeca valia zero. Isso nao era so uma
metrica torta no simulador: a Jornada que pede quantos lugares voce visitou
estava cobrando um a mais do que anunciava.

### O extremo que apareceu

88.8% x 11.2%. A Guardia da Memoria ganhou muito com um sistema que recompensa
mover; o Cortejo nao ganhou nada, porque a Jornada dele recompensa ficar parado
para reunir — ressonancias 0.0, Vinculo 0.01 por turno. Nao vou perseguir esse
numero: e exatamente o problema de Jornada que ja estava previsto como o passo
seguinte, e agora ele esta visivel em dados em vez de ser uma suspeita.

### Known gaps carried into Phase C

- No temporal or conditional triggers: an Acontecimento that should fire "when
  a Memória goes two turns unused" has nowhere to hook. `Esquecimento` waits on
  this.
- Vínculo is one per relation, once. Whether that is too slow cannot be judged
  until the economy above is settled: today a player cannot afford the cards
  that would earn it.
- Guardiã da Memória still wins 63% against a greedy opponent. Within the range
  a less greedy human player could shift, and not worth tuning against until
  someone has actually played it.
- The board's centre is largely empty; visual weight is Milestone 5, and the
  `three` dependency is still unused — a short spike should decide whether it
  earns its place or comes out.
- The opponent is a first one, not a good one: it does not bluff, does not
  read the other player's Jornada, and never stores a Memória to protect it.

## Next: Phase C (Ressonância effects, Transformação, Jornadas)

See the plan file for the full milestone list.
