/**
 * Run the simulator:  npx vite-node src/sim/cli.ts -- --partidas 1000
 *
 * Every match is seeded from the run seed, so a whole run reproduces exactly.
 * When a match looks wrong, its seed replays it on its own.
 */

import { playMatch } from './runner';
import { report } from './report';
import { POLICIES, Policy } from './policies';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const matches = Number(arg('partidas', '500'));
const seed = Number(arg('seed', '1'));
// A safety bound for the harness, not a rule of the game: a real match is
// built with NO_TURN_LIMIT. A match that reaches this did not finish, and
// the report says so rather than calling it a draw.
const maxTurns = Number(arg('turnos', '200'));
const names = arg('politicas', 'gulosa,gulosa').split(',');

const policies: Policy[] = names.map((n) => {
  const policy = POLICIES[n.trim()];
  if (!policy) throw new Error(`política desconhecida: ${n}`);
  return policy;
});

const results = Array.from({ length: matches }, (_, i) =>
  playMatch({ seed: seed + i, policies, maxTurns })
);

console.log(`\nENCANTARIAS — simulação`);
console.log(`políticas ${names.join(' vs ')} · seed ${seed} · teto de segurança ${maxTurns} turnos\n`);
console.log(report(results));
console.log('');
