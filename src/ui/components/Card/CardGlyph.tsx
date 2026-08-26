/**
 * The art area. Real card art is Milestone 5's open question and none of it
 * exists yet, so each type carries a drawn motif instead of an empty box —
 * enough for a card to be recognised across the table at a glance, and
 * honest about being provisional.
 *
 * Line art only, no external files: the build stays a single self-contained
 * bundle that runs from any host.
 */

import { CardType } from '../../../core/cards/types';

const PATHS: Record<CardType, JSX.Element> = {
  // A spring under an arch — the Fonte, the shape of a place.
  Territory: (
    <>
      <path d="M14 44V26a10 10 0 0 1 20 0v18" />
      <path d="M8 44h32" />
      <path d="M20 44v-9a4 4 0 0 1 8 0v9" />
    </>
  ),
  // A coil: the Serpente, and every legend that circles back.
  Legend: (
    <>
      <path d="M24 10c8 0 12 5 12 10s-5 9-11 9-10 3-10 7 4 8 11 8" />
      <circle cx="24" cy="10" r="2.5" />
    </>
  ),
  // Someone listening.
  Character: (
    <>
      <circle cx="24" cy="17" r="6" />
      <path d="M12 44c0-7 5-12 12-12s12 5 12 12" />
    </>
  ),
  // Ripples: a thing said, spreading.
  Memory: (
    <>
      <path d="M8 22c4-4 8-4 12 0s8 4 12 0 8-4 8 0" />
      <path d="M8 31c4-4 8-4 12 0s8 4 12 0 8-4 8 0" />
      <path d="M8 40c4-4 8-4 12 0s8 4 12 0 8-4 8 0" />
    </>
  ),
  // A box that closes: what is kept is taken out of circulation.
  Artifact: (
    <>
      <path d="M10 22h28v20H10z" />
      <path d="M10 22l4-6h20l4 6" />
      <path d="M24 22v20" />
    </>
  ),
  // Something breaking in.
  Event: (
    <>
      <path d="M24 8l4 11 11-3-7 9 7 9-11-3-4 11-4-11-11 3 7-9-7-9 11 3z" />
    </>
  ),
};

export default function CardGlyph({ type }: { type: CardType }) {
  return (
    <svg className="card-glyph" viewBox="0 0 48 52" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">
        {PATHS[type]}
      </g>
    </svg>
  );
}
