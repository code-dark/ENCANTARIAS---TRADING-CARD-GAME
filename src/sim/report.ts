/**
 * Turning many matches into something readable.
 *
 * The report answers questions the design is currently deciding by feel:
 * whether the economy chokes, whether Vínculo arrives in time, whether the
 * Jornadas are reachable at all. It is a detector of extremes and
 * impossibilities — a Jornada that never completes is a fact; a Jornada that
 * wins 55% against a greedy opponent is a hint, and people play less greedily.
 */

import { MatchResult } from './runner';

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const pct = (n: number, total: number) => (total ? ((100 * n) / total).toFixed(1) : '0.0');
const num = (n: number, places = 2) => n.toFixed(places);

export function report(results: MatchResult[]): string {
  const total = results.length;
  const lines: string[] = [];
  const turns = results.map((r) => r.turns);
  const decided = results.filter((r) => r.winnerId);
  const byLimit = results.filter((r) => r.endedByLimit);

  lines.push(`Partidas: ${total}`);
  lines.push(
    `Duração: média ${num(mean(turns), 1)} · mediana ${num(median(turns), 1)} · ` +
      `min ${Math.min(...turns)} · max ${Math.max(...turns)}`
  );
  lines.push(
    `Decididas por Jornada: ${decided.length} (${pct(decided.length, total)}%) · ` +
      `não terminaram: ${byLimit.length} (${pct(byLimit.length, total)}%)`
  );

  const refusals = results.map((r) => r.refusals);
  lines.push(`Ações recusadas pelo validador: média ${num(mean(refusals), 1)}`);

  // Wins per Jornada, over the matches that were decided at all.
  lines.push('');
  lines.push('Vitórias por Jornada');
  const journeys = new Map<string, number>();
  for (const r of decided) {
    const id = r.winnerJourneyId ?? '—';
    journeys.set(id, (journeys.get(id) ?? 0) + 1);
  }
  // Every Jornada in play, so one that never wins is visible as a zero.
  for (const player of results[0]?.players ?? []) {
    if (!journeys.has(player.journeyId)) journeys.set(player.journeyId, 0);
  }
  for (const [id, wins] of [...journeys].sort((a, b) => b[1] - a[1])) {
    // When it wins, how long it takes — the clock each Jornada runs on.
    const turnsWon = decided.filter((r) => r.winnerJourneyId === id).map((r) => r.turns);
    const clock = turnsWon.length
      ? ` · vence no turno ${num(median(turnsWon), 1)} (mediana), ` +
        `${Math.min(...turnsWon)}–${Math.max(...turnsWon)}`
      : ' · nunca vence';
    lines.push(
      `  ${id.padEnd(26)} ${String(wins).padStart(4)}  ${pct(wins, total).padStart(5)}%${clock}`
    );
  }

  // Per player: the same policy in the same seat across every match.
  const seats = results[0]?.players.map((p) => p.id) ?? [];
  for (const seat of seats) {
    const rows = results.map((r) => r.players.find((p) => p.id === seat)!);
    const wins = results.filter((r) => r.winnerId === seat).length;

    lines.push('');
    lines.push(
      `${seat} — política ${rows[0].policy}, Jornada ${rows[0].journeyId} — ` +
        `${wins} vitórias (${pct(wins, total)}%)`
    );
    lines.push(
      `  objetivos cumpridos ao fim  média ${num(mean(rows.map((r) => r.objectivesMet)), 2)} de 3`
    );
    lines.push(
      `  Vínculo por turno           média ${num(mean(rows.map((r) => r.vinculoPerTurn)))}`
    );
    lines.push(
      `  Ressonâncias ativadas       média ${num(mean(rows.map((r) => r.resonances)), 1)}`
    );

    const listens = mean(rows.map((r) => r.listens));
    const found = mean(rows.map((r) => r.listensThatFound));
    lines.push(
      `  Escutas                     ${num(listens, 1)} tentativas → ${num(found, 1)} ` +
        `acharam algo (${listens ? pct(found, listens) : '0.0'}%)`
    );
    lines.push(
      `  Memórias transmitidas       ${num(mean(rows.map((r) => r.transmitted)), 1)} ` +
        `(de toda origem) · ${num(mean(rows.map((r) => r.memories)), 1)} em jogo ao fim`
    );
    lines.push(
      `  Travessias / Territórios    ${num(mean(rows.map((r) => r.traversals)), 1)} · ` +
        `${num(mean(rows.map((r) => r.territoriesUsed)), 1)} lugares usados`
    );
    lines.push(
      `  Cortejos / Transformações   ${num(mean(rows.map((r) => r.conjunctions)), 2)} · ` +
        `${num(mean(rows.map((r) => r.transformations)), 2)}`
    );
    lines.push(
      `  Recursos ociosos ao fim     Vínculo ${num(mean(rows.map((r) => r.idle.vinculo)), 1)} · ` +
        `Memória ${num(mean(rows.map((r) => r.idle.memoria)), 1)} · ` +
        `Circulação ${num(mean(rows.map((r) => r.idle.circulacao)), 1)}`
    );
  }

  return lines.join('\n');
}
