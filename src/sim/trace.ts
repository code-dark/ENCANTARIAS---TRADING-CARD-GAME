/**
 * Replay one match and print its log:
 *   npx vite-node src/sim/trace.ts -- --seed 7
 *
 * A number in the report is only worth as much as the match behind it. This
 * replays exactly that match, so a suspicious average can always be traced to
 * the turns that produced it.
 */

import { applyAction } from '../core/rules/turnResolver';
import { getCurrentPlayer, GameState } from '../core/game/gameState';
import { buildMatch, VERTICAL_SLICE } from '../core/setup/verticalSlice';
import { resetInstanceIds } from '../core/cards/cardRegistry';
import { PHASE_LABEL } from '../core/i18n/labels';
import { POLICIES } from './policies';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const seed = Number(arg('seed', '1'));
const maxTurns = Number(arg('turnos', '20'));
const names = arg('politicas', 'gulosa,gulosa').split(',');
const policies = names.map((n) => POLICIES[n.trim()]);

resetInstanceIds();
let state: GameState = buildMatch(VERTICAL_SLICE, maxTurns, seed);

const byPlayer = new Map(VERTICAL_SLICE.map((s, i) => [s.id, policies[i % policies.length]]));

let printed = 0;
let actions = 0;
while (!state.isEnded && actions < 4000) {
  const current = getCurrentPlayer(state);
  const action = byPlayer.get(current.id)!.decide(state);
  const result = applyAction(state, action);
  actions++;

  if (result.error) {
    console.log(`  ✗ ${action.type}: ${result.error}`);
    const passed = applyAction(state, { type: 'PassPhase', playerId: current.id });
    if (passed.error) break;
    state = passed.state;
  } else {
    state = result.state;
  }

  for (const entry of state.log.slice(printed)) {
    console.log(`  T${state.turn} ${PHASE_LABEL[entry.phase].padEnd(14)} ${entry.message}`);
  }
  printed = state.log.length;
}

console.log('');
console.log(`Fim no turno ${state.turn}. Vencedor: ${state.winnerId ?? 'ninguém (limite)'}`);
for (const p of state.players) {
  console.log(
    `  ${p.name}: Vínculo ${p.resources.vinculo}, Memória ${p.resources.memoria}, ` +
      `objetivos ${p.journeyProgress?.completedObjectiveIds.join(', ') || '—'}`
  );
}
