# ENCANTARIAS — Lendas do Maranhão

Um cardgame narrativo ambientado em São Luís, Maranhão.

## O princípio

**Território é regra, não cenário.** Onde uma narrativa se manifesta muda o que
ela é, o que ela abre e se ela sobrevive à travessia. Nada é destruído: as
coisas se transformam pela forma como circulam.

Não há pontos de vida nem captura. Uma partida termina quando alguém completa
sua **Jornada** — e o outro não perde por ter sido derrotado, e sim por não ter
chegado primeiro.

## Jogar

O slice roda inteiro no navegador — sem servidor, sem API, sem instalação.
Depois de publicado, o endereço é:

```
https://code-dark.github.io/ENCANTARIAS---TRADING-CARD-GAME/
```

O endereço é estável: os testadores guardam esse link e ele continua valendo.
Uma versão nova só substitui o jogo que está no ar quando uma publicação é
disparada — nunca a cada commit.

### Como o site é publicado

Verificação e publicação são workflows separados, e é essa separação que
mantém o link estável e o Pull Request honesto:

| Workflow | Quando roda | O que faz |
| --- | --- | --- |
| `CI` | todo push e todo Pull Request | typecheck → 176 testes → build |
| `Pages` | push em `main` | typecheck → testes → build → publica |
| `Pages` | acionamento manual (`workflow_dispatch`) | publica a partir do branch escolhido |

Assim uma falha de publicação nunca deixa um Pull Request vermelho: se o
código está certo, o `CI` passa, independentemente do que aconteça com o
Pages. E `main` é a única fonte automática do site — para colocar um branch
experimental na frente dos testadores antes do merge, use **Actions → Pages →
Run workflow** e escolha o branch.

O Pages já está ligado com **Source: GitHub Actions**.

Uma ressalva sobre a publicação manual: ao ligar o Pages, o GitHub cria o
ambiente `github-pages` restrito ao branch padrão. Enquanto essa restrição
existir, `workflow_dispatch` a partir de um branch experimental constrói o site
mas é barrado no passo de deploy. Para liberar, em **Settings → Environments →
github-pages → Deployment branches and tags**, inclua o branch (ou `claude/*`).
Publicações a partir de `main` não dependem disso.

## Rodar localmente

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run test:run # 176 testes do motor
npm run build
```

O vertical slice é uma pessoa contra um oponente. Você joga o Jogador 1.

## Como se joga

Um turno passa por sete fases. Você avança com o botão no rodapé; o que está
disponível em cada fase aparece habilitado, e o que não está diz por quê.

| Fase | O que acontece |
| --- | --- |
| **Despertar** | Suas cartas exaustas voltam a poder agir. |
| **Memória** | Compre uma carta. Comprar dá a carta e nada mais. |
| **Travessia** | Vá para outro Território seu, pagando em Memória. |
| **Manifestação** | Coloque cartas na mesa, pagando em Memória. |
| **Ação** | Escute o Território, ative Ressonâncias, guarde ou retome Memórias. |
| **Acontecimento** | Resolve o que estiver em curso. |
| **Encerramento** | Cortejos se formam e sua Jornada é verificada. |

### De onde vem a Memória

Memória é o recurso que paga manifestações e travessias, e ela **não vem de
comprar cartas**. Vem de escutar um lugar:

```
Território → Escuta → 1d6 → 2+ → busca contextual → leitura em voz alta → +1 Memória
```

Uma Escuta por Território por turno, e ela precisa de um Personagem manifestado
ali. No **1**, nada vem à tona. No **6**, o lugar oferece dois relatos e você
escolhe um — a escolha é o prêmio, não mais recurso.

O recurso é computado **depois da leitura**, nunca antes: uma Memória só conta
depois de transmitida. Digitalmente ninguém pode verificar que você leu em voz
alta, então o jogo faz a única coisa honesta — para tudo até você confirmar que
leu, e o texto fica na sua frente enquanto isso.

Quando um Território entrega tudo o que era seu, a escuta se amplia: alcança o
que uma Lenda manifestada ali carrega, e o que fala o mesmo vocabulário das
Memórias que você já aprendeu. O que você já sabe é o que permite perceber o
resto.

### Ressonância

Uma carta manifestada tem relação com o lugar onde está. Ativar essa relação
custa a carta pelo turno e paga 1 de Vínculo — **uma vez**: reconhecer de novo o
que você já reconheceu não é novidade. Os efeitos continuam valendo a cada
ativação, e é por isso que você repetiria.

Uma Memória não ressoa: ela é o que a Ressonância abre.

### Travessia

Atravessar nunca é grátis. Custa mais ir a um lugar sem relação com o atual do
que a um vizinho de afinidade — o mapa define o preço, não um pedágio fixo. E
nem tudo acompanha você: o estado de uma Memória decide se ela vai, fica, ou
depende do lugar de destino.

## Ferramentas

```bash
npm run sim -- --partidas 1000        # mede o jogo em N partidas
npm run sim:trace -- --seed 7          # repete uma partida com o log inteiro
```

O simulador joga a mesma partida que a interface, pelo mesmo `applyAction`, com
o mesmo oponente. É como o balanceamento é feito: procurando extremos e
impossibilidades, não perseguindo 50/50.

## Conteúdo provisório

Tudo marcado `[PROVISIONAL]` aguarda validação cultural e histórica. Nada aqui
inventa relação religiosa, origem de lenda, prática comunitária ou fato
histórico para preencher lacuna. Ver `docs/PROGRESS.md` para o registro das
decisões, incluindo as que envolvem representação.

## Arquitetura

`src/core/` não importa React nem Three.js. O motor é puro: toda função de
estado devolve um estado novo, a aleatoriedade é semeada, e uma partida se
reproduz a partir do log. É o que torna o simulador possível — e o que garante
que ele mede este jogo, e não outro.

- `core/cards/` — dados das cartas e o registro
- `core/game/` — estado, fases, validação
- `core/mechanics/` — afinidade, ressonância, travessia, memória, objetos, jornada
- `core/effects/` — gatilho → condição → efeito, tudo como dado
- `core/rules/` — resolução de turno
- `core/ai/` — o oponente
- `core/setup/` — a partida que interface e simulador montam
- `sim/` — simulador headless
- `ui/` — React
