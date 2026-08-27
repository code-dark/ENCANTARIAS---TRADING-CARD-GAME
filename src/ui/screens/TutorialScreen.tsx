import { useState } from 'react';
import { getCard } from '../../core/cards/cardRegistry';
import { AFFINITY_LABEL } from '../../core/i18n/labels';
import { Affinity, TerritoryCard } from '../../core/cards/types';
import { journeys } from '../../core/cards/data/journeys';
import CardVisual from '../components/Card/CardVisual';
import './TutorialScreen.css';

/**
 * What a player is told before the first turn.
 *
 * ENCANTARIAS asks three things nobody can guess from a card table: that
 * nobody is defeated, that the Território is a rule rather than scenery, and
 * that Memória is earned by listening to a place and saying aloud what you
 * found. Everything else can be learned by playing; those three cannot.
 *
 * Every panel shows the real thing — real cards, real affinity chips, the real
 * Jornada — so the words the tutorial uses are the words the board uses.
 */

const FONTE = getCard('territorio_fonte_ribeirao') as TerritoryCard;
const IGREJA = getCard('territorio_igreja_se') as TerritoryCard;
const SERPENTE = getCard('legend_serpent_enchanted');
const OUVINTE = getCard('character_listener');
const JORNADA = journeys.find((j) => j.id === 'journey_guardia_memoria')!;

function Chips({ items, marked = [] }: { items: Affinity[]; marked?: Affinity[] }) {
  return (
    <div className="tut-chips">
      {items.map((a) => (
        <span key={a} className={marked.includes(a) ? 'tut-chip match' : 'tut-chip'}>
          {AFFINITY_LABEL[a]}
        </span>
      ))}
    </div>
  );
}

interface Step {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  figure: React.ReactNode;
}

function buildSteps(): Step[] {
  const shared = SERPENTE.affinities.filter((a) => FONTE.affinities.includes(a));

  return [
    {
      eyebrow: 'Como se vence',
      title: 'Ninguém é derrotado',
      body: (
        <>
          <p>
            Não há pontos de vida, não há ataque e não se captura nada do outro
            jogador. Cada um recebe uma <strong>Jornada</strong> — uma lista de
            coisas a cumprir — e vence quem cumpre a sua primeiro.
          </p>
          <p>
            Quem perde não perdeu por ter sido derrotado. Perdeu por não ter
            chegado antes.
          </p>
        </>
      ),
      figure: (
        <div className="tut-journey">
          <h4>{JORNADA.name}</h4>
          <p className="tut-journey-line">{JORNADA.description}</p>
          <ul>
            {JORNADA.objectives.map((o) => (
              <li key={o.id}>
                <span className="tut-diamond">◇</span> {o.description}
              </li>
            ))}
          </ul>
          <span className="tut-note">Verificada sozinha ao fim de cada turno.</span>
        </div>
      ),
    },
    {
      eyebrow: 'A ideia central',
      title: 'O Território é uma regra',
      body: (
        <>
          <p>
            O lugar onde você está não é cenário. Ele tem afinidades próprias, e
            elas mudam o que as suas cartas conseguem fazer.
          </p>
          <p>
            A mesma carta na <strong>{FONTE.name}</strong> e na{' '}
            <strong>{IGREJA.name}</strong> não é a mesma jogada. Antes de
            perguntar <em>o que eu jogo</em>, pergunte <em>onde eu estou</em>.
          </p>
        </>
      ),
      figure: (
        <div className="tut-two">
          <div className="tut-place">
            <h5>{FONTE.name}</h5>
            <Chips items={FONTE.affinities} />
          </div>
          <div className="tut-place">
            <h5>{IGREJA.name}</h5>
            <Chips items={IGREJA.affinities} />
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'Ressonância',
      title: 'Quando o lugar reconhece a carta',
      body: (
        <>
          <p>
            Se uma carta em jogo divide afinidade com o Território, o lugar a
            reconhece. Isso é uma <strong>Ressonância</strong>: ela dispara o
            efeito da carta e rende <strong>1 de Vínculo</strong>.
          </p>
          <p>
            O Vínculo é pago <strong>uma vez por relação</strong>. Voltar a
            ativar a mesma carta no mesmo lugar continua valendo pelo efeito,
            mas não paga de novo — para crescer, é preciso relações novas.
          </p>
        </>
      ),
      figure: (
        <div className="tut-resonance">
          <div className="tut-place">
            <h5>{SERPENTE.name}</h5>
            <Chips items={SERPENTE.affinities} marked={shared} />
          </div>
          <div className="tut-meets">encontra</div>
          <div className="tut-place">
            <h5>{FONTE.name}</h5>
            <Chips items={FONTE.affinities} marked={shared} />
          </div>
          <div className="tut-yield">
            <strong>+1</strong> <span>Vínculo</span>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'A economia',
      title: 'Memória vem de escutar o lugar',
      body: (
        <>
          <p>
            Memória é o recurso que paga as cartas, e ela não cai do céu nem
            vem de comprar. Uma vez por turno um Personagem seu pode{' '}
            <strong>Escutar o Território</strong>: rola-se 1d6.
          </p>
          <p>
            Em <strong>1</strong>, o lugar não responde. Em <strong>2 ou mais</strong>,
            vem à tona uma Memória ligada àquele Território ou a uma Lenda dali.
            Em <strong>6</strong>, havendo mais de uma disponível, você escolhe.
          </p>
          <p className="tut-emphasis">
            A Memória só entra como recurso <strong>depois</strong> de o relato
            ser lido em voz alta. Contar faz parte da regra.
          </p>
        </>
      ),
      figure: (
        <div className="tut-listen">
          <div className="tut-dice">
            <span className="tut-die fail">1</span>
            <span className="tut-die ok">2</span>
            <span className="tut-die ok">3</span>
            <span className="tut-die ok">4</span>
            <span className="tut-die ok">5</span>
            <span className="tut-die boon">6</span>
          </div>
          <div className="tut-legend">
            <span><b className="fail-dot" /> nada acontece</span>
            <span><b className="ok-dot" /> uma Memória vem à tona</span>
            <span><b className="boon-dot" /> você escolhe entre duas</span>
          </div>
          <p className="tut-flow">
            Escuta → 1d6 → 2+ → o relato aparece → você lê em voz alta → +1 Memória
          </p>
        </div>
      ),
    },
    {
      eyebrow: 'Travessia',
      title: 'Mudar de lugar tem preço',
      body: (
        <>
          <p>
            Você pode atravessar para outro Território, mas isso custa Memória —
            e nem tudo vai junto.
          </p>
          <p>
            Memórias <strong>enraizadas</strong> ficam onde estão: pertencem
            àquele chão. As <strong>transmitidas</strong> viajam com quem as
            carrega. Sair de um lugar é decidir o que fica.
          </p>
        </>
      ),
      figure: (
        <div className="tut-travel">
          <div className="tut-place"><h5>{FONTE.name}</h5></div>
          <div className="tut-arrow">→</div>
          <div className="tut-place"><h5>{IGREJA.name}</h5></div>
          <div className="tut-stay">o que é enraizado fica para trás</div>
        </div>
      ),
    },
    {
      eyebrow: 'O turno',
      title: 'Você só decide quando há o que decidir',
      body: (
        <>
          <p>
            O turno tem sete fases, mas você não vai clicar sete vezes: as fases
            em que nada é possível passam sozinhas. A barra no topo mostra em
            qual você está e o que ela permite.
          </p>
          <p>
            Cartas que você pode jogar agora ficam com a borda dourada e
            levantam da mão. As outras continuam legíveis — passe o mouse para
            ler qualquer uma em tamanho cheio.
          </p>
        </>
      ),
      figure: (
        <div className="tut-cards">
          <CardVisual definition={OUVINTE} size="medium" />
          <CardVisual definition={SERPENTE} size="medium" onClick={() => {}} />
          <span className="tut-caption">
            à direita, uma carta jogável agora
          </span>
        </div>
      ),
    },
  ];
}

export default function TutorialScreen({ onDone }: { onDone: () => void }) {
  const steps = buildSteps();
  const [i, setI] = useState(0);
  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <div className="tutorial">
      <div className="tut-panel" role="dialog" aria-label="Como se joga">
        <header className="tut-head">
          <div>
            <span className="tut-eyebrow">{step.eyebrow}</span>
            <h2>{step.title}</h2>
          </div>
          <button className="tut-skip" onClick={onDone}>
            Pular
          </button>
        </header>

        <div className="tut-body">
          <div className="tut-text">{step.body}</div>
          <div className="tut-figure">{step.figure}</div>
        </div>

        <footer className="tut-foot">
          <div className="tut-dots" aria-hidden="true">
            {steps.map((s, n) => (
              <span key={s.title} className={n === i ? 'on' : n < i ? 'seen' : ''} />
            ))}
          </div>

          <div className="tut-nav">
            <button disabled={i === 0} onClick={() => setI((n) => n - 1)}>
              ← Voltar
            </button>
            <button className="primary" onClick={() => (last ? onDone() : setI((n) => n + 1))}>
              {last ? 'Começar a partida' : 'Continuar →'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
