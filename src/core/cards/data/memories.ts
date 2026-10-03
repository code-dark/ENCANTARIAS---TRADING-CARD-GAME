/**
 * Memory Cards - Transmissions and narratives
 */

import { MemoryCard } from '../types';

export const memories: MemoryCard[] = [
  {
    id: 'memory_oral_serpent',
    type: 'Memory',
    name: 'Relato Oral da Serpente',
    memoryState: 'Oral',
    discovery: {
      // A spoken account: you have to actually listen for it.
      via: ['explore'],
      escuta: 3,
    },
    affinities: ['Water', 'Memory', 'Enchantment'],
    sources: ['territorio_fonte_ribeirao'],
    tags: ['serpente', 'oralidade', 'agua'],
    linkedTo: 'legend_serpent_enchanted',
    cost: 1,
    description: '[PROVISIONAL] Uma história falada, passada de boca em boca. Carrega o peso da voz.',
    flavor: 'As histórias mais antigas são as sussurradas.',
    effect: 'Ao ser jogada: procure no deck uma Lenda com afinidade Água.',
  },

  {
    id: 'memory_territorial_bells',
    type: 'Memory',
    name: 'Memória Territorial dos Sinos',
    memoryState: 'Territorial',
    discovery: {
      via: ['explore'],
      escuta: 3,
    },
    affinities: ['Faith', 'Institution', 'History'],
    sources: ['territorio_igreja_se'],
    tags: ['sino', 'fe', 'patrimonio'],
    linkedTo: 'legend_lady_of_bells',
    cost: 1,
    description: '[PROVISIONAL] Presa a um lugar específico. Os sinos tocam só aqui.',
    flavor: 'Algumas músicas só tocam num lugar.',
    effect: 'Vinculada à Igreja da Sé. Não faz Travessia.',
  },

  {
    id: 'memory_enraizada_fountain',
    type: 'Memory',
    name: 'A Fonte Perene',
    memoryState: 'Roots',
    discovery: {
      // Not something anyone can be told. Only the Serpent manifesting here
      // opens this layer of the place.
      via: ['resonance'],
      byLegend: 'legend_serpent_enchanted',
    },
    affinities: ['Water', 'Underground'],
    sources: ['ressonancia_serpente_ribeirao'],
    tags: ['serpente', 'subterraneo', 'agua'],
    linkedTo: 'legend_serpent_enchanted',
    cost: 2,
    description: '[PROVISIONAL] Enraizada tão fundo que virou o próprio Território. Não se move.',
    flavor: 'Algumas coisas não se movem porque são tudo.',
    effect: 'Reforça o Território ativo. Não sai daqui.',
  },

  {
    id: 'memory_transmitida_paths',
    type: 'Memory',
    name: 'Os Caminhos Cruzados',
    memoryState: 'Shared',
    discovery: {
      via: ['explore'],
      escuta: 2,
    },
    affinities: ['Passage', 'Movement', 'Circulation'],
    sources: ['territorio_escadaria_reviver', 'territorio_ceprama'],
    tags: ['passagem', 'circulacao'],
    linkedTo: 'legend_keeper_of_paths',
    cost: 1,
    description: '[PROVISIONAL] Uma história que viaja e se transforma ao se mover.',
    flavor: 'A história muda a cada vez que é contada, e segue verdadeira.',
    effect: 'A Travessia custa 1 a menos enquanto você carrega esta Memória.',
  },

  {
    id: 'memory_institutional_bells',
    type: 'Memory',
    name: 'Registros da Sé',
    memoryState: 'Corporate',
    discovery: {
      via: ['resonance'],
      byLegend: 'legend_lady_of_bells',
    },
    affinities: ['Institution', 'Faith', 'History'],
    sources: ['ressonancia_sinos_se'],
    tags: ['sino', 'instituicao', 'arquivo'],
    linkedTo: 'legend_lady_of_bells',
    cost: 1,
    description: '[PROVISIONAL] Registros oficiais e saber institucional. Organizados e protegidos.',
    flavor: 'Posto no papel, vira lei.',
    effect: 'Ganha força para cada carta Corporate em jogo.',
  },

  {
    id: 'memory_midiatic_circulating',
    type: 'Memory',
    name: 'A Lenda Viral',
    memoryState: 'Media',
    discovery: {
      // Everyone has already heard this one; almost no listening required.
      via: ['explore', 'event'],
      escuta: 1,
    },
    affinities: ['Circulation', 'City', 'Commerce'],
    sources: [
      'territorio_escadaria_reviver',
      'territorio_ceprama',
      'territorio_cemiterio_gaviao',
    ],
    tags: ['midia', 'circulacao', 'urbano'],
    linkedTo: undefined,
    cost: 0,
    description: '[PROVISIONAL] Circula pela mídia e pelo comércio. Visível em toda parte, compreendida em lugar nenhum.',
    flavor: 'Todo mundo conhece. Ninguém lembra por quê.',
    circulationThreshold: 2,
    transformationOn: 'Decontextualized',
    effect: 'Ganha recursos por marcador de Circulação. Perde Vínculo.',
  },

  {
    id: 'memory_beira_mar_imagem',
    type: 'Memory',
    name: 'Imagem Recorrente da Beira-Mar',
    memoryState: 'Media',
    discovery: {
      // Reached through a record that points at the place, not by standing there.
      via: ['artifact'],
    },
    affinities: ['City', 'Circulation', 'Memory'],
    sources: ['beira_mar'],
    tags: ['beira_mar', 'fotografia', 'midia', 'circulacao'],
    cost: 0,
    // [PROVISIONAL — REQUER VALIDAÇÃO CULTURAL/HISTÓRICA]
    // Deliberately a claim about the circulation of images, not about any
    // community, practice or event at the Beira-Mar. What that shoreline holds
    // is research, not design.
    description:
      '[PROVISIONAL] Uma vista que retorna em cartões, jornais e álbuns. Circula mais do que é lembrada.',
    flavor: 'A imagem viaja sozinha, e chega sem o que a cercava.',
    effect: 'Só pode ser alcançada por um registro que aponte para a Beira-Mar.',
  },

  {
    id: 'memory_cortejo_passagem',
    type: 'Memory',
    name: 'A Passagem Ouvida',
    memoryState: 'Oral',
    discovery: {
      // Opened only by the whole gathering. No amount of listening reaches it.
      via: ['resonance'],
    },
    affinities: ['City', 'Memory', 'Mystery'],
    sources: ['ressonancia_cortejo_maldito'],
    tags: ['aparicao', 'noite', 'memoria_urbana', 'cortejo'],
    cost: 1,
    // [PROVISIONAL — REQUER VALIDAÇÃO CULTURAL/HISTÓRICA]
    description:
      '[PROVISIONAL] O relato de quem diz ter ouvido a passagem — nunca de quem diz tê-la visto.',
    flavor: 'Todo mundo conhece alguém que ouviu.',
    effect: 'Só se abre quando o cortejo se forma por inteiro.',
  },

  /* ------------------------------------------------------------------ *
   * Fonte do Ribeirão
   * ------------------------------------------------------------------ */

  {
    id: 'memory_fonte_video',
    type: 'Memory',
    name: 'O Vídeo da Fonte',
    memoryState: 'Media',
    discovery: { via: ['explore'], escuta: 1 },
    affinities: ['Water', 'Circulation', 'City'],
    sources: ['territorio_fonte_ribeirao'],
    tags: ['agua', 'midia', 'circulacao'],
    cost: 0,
    description: '[PROVISIONAL] Filmada de longe, repostada sem legenda. Chega a quem nunca esteve aqui.',
    flavor: 'Quem vê já não sabe de onde é.',
    effect: 'Circula com facilidade e perde contexto ao circular.',
  },

  {
    id: 'memory_fonte_versao_tardia',
    type: 'Memory',
    name: 'A Versão de Quem Chegou Depois',
    memoryState: 'Shared',
    discovery: { via: ['explore'], escuta: 2 },
    affinities: ['Water', 'Memory', 'Passage'],
    sources: ['territorio_fonte_ribeirao'],
    tags: ['agua', 'oralidade', 'transmissao'],
    cost: 1,
    description: '[PROVISIONAL] Contada por quem ouviu de outro. Guarda o essencial e troca os detalhes.',
    flavor: 'Ninguém mente. Só lembra diferente.',
    effect: 'Acompanha você enquanto o novo lugar tiver com que se ligar.',
  },

  {
    id: 'memory_fonte_nome_antigo',
    type: 'Memory',
    name: 'O Nome Antigo da Água',
    memoryState: 'Territorial',
    discovery: { via: ['explore'], escuta: 3 },
    affinities: ['Water', 'Memory', 'History'],
    sources: ['territorio_fonte_ribeirao'],
    tags: ['agua', 'toponimia', 'memoria'],
    cost: 1,
    description: '[PROVISIONAL] Um nome que a fonte teve antes deste. Só quem é daqui ainda usa.',
    flavor: 'O nome novo está na placa. O antigo, na boca.',
    effect: 'Permanece neste Território.',
  },

  {
    id: 'memory_fonte_laudo',
    type: 'Memory',
    name: 'Laudo sobre o Manancial',
    memoryState: 'Corporate',
    discovery: { via: ['explore'], escuta: 4 },
    affinities: ['Water', 'Institution', 'History'],
    sources: ['territorio_fonte_ribeirao'],
    tags: ['agua', 'arquivo', 'instituicao'],
    cost: 1,
    description: '[PROVISIONAL] Um documento técnico sobre a água. Descreve tudo, menos o que se conta dela.',
    flavor: 'Mede a vazão. Não mede o resto.',
    effect: 'Protegida enquanto arquivada. Não sai daqui.',
  },

  /* ------------------------------------------------------------------ *
   * Igreja da Sé
   * ------------------------------------------------------------------ */

  {
    id: 'memory_se_porta',
    type: 'Memory',
    name: 'O Que Se Conta na Porta',
    memoryState: 'Oral',
    discovery: { via: ['explore'], escuta: 3 },
    affinities: ['Faith', 'Memory', 'City'],
    sources: ['territorio_igreja_se'],
    tags: ['fe', 'oralidade', 'soleira'],
    cost: 1,
    description: '[PROVISIONAL] O que se diz na soleira, e não lá dentro. Fica na fronteira entre duas falas.',
    flavor: 'Dentro se reza. Na porta se conta.',
    effect: 'Acompanha você enquanto o novo lugar tiver com que se ligar.',
  },

  {
    id: 'memory_se_centenario',
    type: 'Memory',
    name: 'A Reportagem do Centenário',
    memoryState: 'Media',
    discovery: { via: ['explore'], escuta: 1 },
    affinities: ['Institution', 'Circulation', 'History'],
    sources: ['territorio_igreja_se'],
    tags: ['midia', 'imprensa', 'patrimonio'],
    cost: 0,
    description: '[PROVISIONAL] Uma matéria de data redonda. Repete o que já se dizia, com foto nova.',
    flavor: 'A efeméride cria o que comemora.',
    effect: 'Circula com facilidade.',
  },

  {
    id: 'memory_se_horario',
    type: 'Memory',
    name: 'A Hora Que Mudou',
    memoryState: 'Shared',
    discovery: { via: ['explore'], escuta: 2 },
    affinities: ['Faith', 'Institution', 'Movement'],
    sources: ['territorio_igreja_se'],
    tags: ['fe', 'rotina', 'transmissao'],
    cost: 1,
    description: '[PROVISIONAL] Uma mudança de horário que virou assunto. Cada um lembra de uma razão.',
    flavor: 'O motivo se perdeu. A reclamação, não.',
    effect: 'Acompanha você enquanto o novo lugar tiver com que se ligar.',
  },

  {
    id: 'memory_se_inventario',
    type: 'Memory',
    name: 'Inventário de Bens',
    memoryState: 'Corporate',
    discovery: { via: ['explore'], escuta: 4 },
    affinities: ['Institution', 'History', 'Culture'],
    sources: ['territorio_igreja_se'],
    tags: ['arquivo', 'instituicao', 'patrimonio'],
    cost: 1,
    description: '[PROVISIONAL] Uma lista do que existe, com número e medida. O que não cabe na lista não consta.',
    flavor: 'Catalogado é preservado. E também é fixado.',
    effect: 'Protegida enquanto arquivada. Não sai daqui.',
  },

  /* ------------------------------------------------------------------ *
   * Escadaria do Reviver
   * ------------------------------------------------------------------ */

  {
    id: 'memory_escadaria_quem_passou',
    type: 'Memory',
    name: 'Quem Passou Por Aqui',
    memoryState: 'Oral',
    discovery: { via: ['explore'], escuta: 3 },
    affinities: ['Passage', 'Memory', 'City'],
    sources: ['territorio_escadaria_reviver'],
    tags: ['passagem', 'oralidade', 'encontro'],
    cost: 1,
    description: '[PROVISIONAL] Contada por quem trabalha aqui há tempo. Mede o lugar pelas pessoas que atravessaram.',
    flavor: 'A escada é a mesma. A cidade que subiu por ela, não.',
    effect: 'Acompanha você enquanto o novo lugar tiver com que se ligar.',
  },

  {
    id: 'memory_escadaria_degrau',
    type: 'Memory',
    name: 'O Degrau Que Todos Evitam',
    memoryState: 'Territorial',
    discovery: { via: ['explore'], escuta: 3 },
    affinities: ['Passage', 'Mystery', 'City'],
    sources: ['territorio_escadaria_reviver'],
    tags: ['passagem', 'superticao_urbana', 'lugar'],
    cost: 1,
    description: '[PROVISIONAL] Um hábito coletivo sem explicação acordada. Todos desviam; poucos sabem dizer por quê.',
    flavor: 'Ninguém combinou. Todo mundo desvia.',
    effect: 'Permanece neste Território.',
  },

  {
    id: 'memory_escadaria_ata',
    type: 'Memory',
    name: 'Ata de Restauro',
    memoryState: 'Corporate',
    discovery: { via: ['explore'], escuta: 4 },
    affinities: ['Institution', 'History', 'City'],
    sources: ['territorio_escadaria_reviver'],
    tags: ['arquivo', 'restauro', 'instituicao'],
    cost: 1,
    description: '[PROVISIONAL] O registro de uma obra: o que foi refeito, com que material, sob qual justificativa.',
    flavor: 'Restaurar é escolher a qual época voltar.',
    effect: 'Protegida enquanto arquivada. Não sai daqui.',
  },

  {
    id: 'memory_escadaria_raiz',
    type: 'Memory',
    name: 'O Que a Escada Segura',
    memoryState: 'Roots',
    discovery: { via: ['explore'], escuta: 4 },
    affinities: ['Passage', 'Memory', 'History'],
    sources: ['territorio_escadaria_reviver'],
    tags: ['passagem', 'enraizado', 'lugar'],
    cost: 2,
    description: '[PROVISIONAL] O que só faz sentido subindo estes degraus. Contado em outro lugar, vira outra coisa.',
    flavor: 'Fora daqui é só uma escada.',
    effect: 'Não sai deste Território por meios normais.',
  },

  /* ------------------------------------------------------------------ *
   * CEPRAMA
   * ------------------------------------------------------------------ */

  {
    id: 'memory_ceprama_mestre',
    type: 'Memory',
    name: 'O Que Não Se Ensina Falando',
    memoryState: 'Oral',
    discovery: { via: ['explore'], escuta: 3 },
    affinities: ['Craft', 'Memory', 'Culture'],
    sources: ['territorio_ceprama'],
    tags: ['oficio', 'transmissao', 'gesto'],
    cost: 1,
    description: '[PROVISIONAL] Um saber que passa pelo gesto e não pela explicação. Quem aprende não sabe dizer quando aprendeu.',
    flavor: 'Ninguém explicou. A mão entendeu.',
    effect: 'Acompanha você enquanto o novo lugar tiver com que se ligar.',
  },

  {
    id: 'memory_ceprama_banca',
    type: 'Memory',
    name: 'A Banca do Fundo',
    memoryState: 'Territorial',
    discovery: { via: ['explore'], escuta: 2 },
    affinities: ['Commerce', 'Craft', 'City'],
    sources: ['territorio_ceprama'],
    tags: ['comercio', 'oficio', 'lugar'],
    cost: 1,
    description: '[PROVISIONAL] Um ponto que todo mundo do lugar sabe indicar e nenhum mapa marca.',
    flavor: 'É ali no fundo. Você acha.',
    effect: 'Permanece neste Território.',
  },

  {
    id: 'memory_ceprama_catalogo',
    type: 'Memory',
    name: 'Catálogo de Feira',
    memoryState: 'Corporate',
    discovery: { via: ['explore'], escuta: 4 },
    affinities: ['Commerce', 'Institution', 'Culture'],
    sources: ['territorio_ceprama'],
    tags: ['arquivo', 'comercio', 'instituicao'],
    cost: 1,
    description: '[PROVISIONAL] Fotografa, nomeia e precifica. Fixa numa página o que mudava a cada feira.',
    flavor: 'O catálogo dura mais que a banca.',
    effect: 'Protegida enquanto arquivada. Não sai daqui.',
  },

  {
    id: 'memory_ceprama_selo',
    type: 'Memory',
    name: 'O Selo de Autenticidade',
    memoryState: 'Media',
    discovery: { via: ['explore'], escuta: 1 },
    affinities: ['Commerce', 'Circulation', 'Culture'],
    sources: ['territorio_ceprama'],
    tags: ['midia', 'comercio', 'circulacao'],
    cost: 0,
    description: '[PROVISIONAL] Uma marca que atesta origem. Faz circular melhor e decide o que fica de fora.',
    flavor: 'Autêntico é quem tem o selo.',
    effect: 'Circula com facilidade.',
  },

  /* ------------------------------------------------------------------ *
   * Cemitério do Gavião
   * ------------------------------------------------------------------ */

  {
    id: 'memory_gaviao_portao',
    type: 'Memory',
    name: 'O Portão Que Range',
    memoryState: 'Territorial',
    discovery: { via: ['explore'], escuta: 2 },
    affinities: ['City', 'Memory', 'Mystery'],
    sources: ['territorio_cemiterio_gaviao'],
    tags: ['cemiterio', 'noite', 'lugar'],
    cost: 1,
    description: '[PROVISIONAL] Um detalhe do lugar que virou referência nas histórias contadas sobre ele.',
    flavor: 'Toda versão começa pelo portão.',
    effect: 'Permanece neste Território.',
  },

  {
    id: 'memory_gaviao_mudou_de_boca',
    type: 'Memory',
    name: 'A História Que Mudou de Boca',
    memoryState: 'Shared',
    discovery: { via: ['explore'], escuta: 2 },
    affinities: ['Memory', 'City', 'Movement'],
    sources: ['territorio_cemiterio_gaviao'],
    tags: ['transmissao', 'oralidade', 'memoria_urbana'],
    cost: 1,
    description: '[PROVISIONAL] A mesma história com outro protagonista, outro bairro e a mesma noite.',
    flavor: 'Mudou tudo. Continua sendo ela.',
    effect: 'Acompanha você enquanto o novo lugar tiver com que se ligar.',
  },

  {
    id: 'memory_gaviao_registro',
    type: 'Memory',
    name: 'Livro de Registros',
    memoryState: 'Corporate',
    discovery: { via: ['explore'], escuta: 4 },
    affinities: ['Institution', 'History', 'Memory'],
    sources: ['territorio_cemiterio_gaviao'],
    tags: ['arquivo', 'instituicao', 'registro'],
    cost: 1,
    description: '[PROVISIONAL] Nomes, datas e nada mais. Guarda quem esteve, não o que se conta.',
    flavor: 'O livro sabe os nomes. Não sabe as histórias.',
    effect: 'Protegida enquanto arquivada. Não sai daqui.',
  },

  {
    id: 'memory_gaviao_quem_ouviu',
    type: 'Memory',
    name: 'Quem Conta Que Ouviu',
    memoryState: 'Oral',
    discovery: { via: ['explore'], escuta: 3 },
    affinities: ['Memory', 'Mystery', 'City'],
    sources: ['territorio_cemiterio_gaviao'],
    tags: ['oralidade', 'noite', 'memoria_urbana'],
    cost: 1,
    description: '[PROVISIONAL] Sempre em segunda mão: um conhecido, um parente, alguém do trabalho.',
    flavor: 'Nunca é quem está contando.',
    effect: 'Acompanha você enquanto o novo lugar tiver com que se ligar.',
  },

  /* ------------------------------------------------------------------ *
   * Reached through an Acontecimento
   *
   * These belong to no place — they belong to something happening. No amount
   * of listening at a Território surfaces them, because what makes them
   * available is the occasion and not the ground.
   * ------------------------------------------------------------------ */

  {
    id: 'memory_festa_versao_de_rua',
    type: 'Memory',
    name: 'A Versão Que Correu na Festa',
    memoryState: 'Shared',
    discovery: { via: ['event'] },
    affinities: ['Circulation', 'City', 'Culture'],
    sources: ['acontecimento_tempo_de_festa'],
    tags: ['festa', 'circulacao', 'oralidade', 'transmissao'],
    cost: 0,
    description:
      '[PROVISIONAL] Um relato que só aparece quando há muita gente junta: ' +
      'alguém conta, outro corrige, e a versão que segue adiante é a terceira.',
    flavor: 'Ninguém lembra quem contou primeiro. Todo mundo lembra a história.',
    effect: 'Acompanha você enquanto o novo lugar tiver com que se ligar.',
  },

  {
    id: 'memory_festa_o_que_ficou_de_fora',
    type: 'Memory',
    name: 'O Que a Festa Não Contou',
    memoryState: 'Oral',
    discovery: { via: ['event'] },
    affinities: ['Memory', 'Culture', 'City'],
    sources: ['acontecimento_tempo_de_festa'],
    tags: ['festa', 'oralidade', 'ausencia', 'transmissao'],
    // Deliberate exception: an Oral account normally carries over where the
    // new place gives it something to hold on to. This one does not travel at
    // all — being left behind is what it is about.
    traversalBehavior: 'stays',
    cost: 0,
    description:
      '[PROVISIONAL] Toda ocasião que faz circular também escolhe o que não ' +
      'circula. O relato que ficou de fora continua existindo — mas só onde ' +
      'foi deixado.',
    flavor: 'O que não coube na festa ficou esperando na esquina.',
    effect: 'Permanece neste Território.',
  },
];

export function getMemoryById(id: string): MemoryCard | undefined {
  return memories.find((m) => m.id === id);
}
