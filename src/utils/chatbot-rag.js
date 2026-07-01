/**
 * ChatFab RAG — Client-side knowledge base for LouvorJ.AI
 *
 * Provides real LouvorJA data to the LLM so it stops hallucinating.
 * Zero backend dependency — all search happens in the browser.
 *
 * Usage:
 *   import { searchRAG } from '@/utils/chatbot-rag';
 *   const context = searchRAG(userQuestion); // returns string to inject into system prompt
 */

const CHUNKS = [
  // ─── ATALHOS DE TECLADO ───
  {
    id: 'shortcuts',
    keywords: ['atalho', 'tecla', 'ctrl', 'f1', 'f5', 'f9', 'esc', 'shortcut', 'teclado', 'bindbindbindkey'],
    title: 'Teclas de Atalho do LouvorJA',
    text: `ATALHOS GERAIS: ESC fecha tela/janela; CTRL+F busca rapida; CTRL+W fecha aba; F1 ajuda; F5/F9 projetar.
PROJECAO DE MUSICA: Setas Cima/Baixo/PgUp/PgDn navega slides; Home primeiro slide; End ultimo slide; Pause/Play/CTRL+P/Espaco pausa musica.
EDITOR DE SLIDES: CTRL+Seta Direita grava tempo e avanca slide; CTRL+Seta Esquerda grava retroativo.
BUSCA BIBLICA: Setas navega versiculos; PgUp/PgDn versiculo anterior/proximo.
BUSCA COM ASTERISCO: Use * para qualquer trecho entre palavras (ex: "Jesus*Melhor").`,
  },

  // ─── STREAMING / TRANSMISSAO ───
  {
    id: 'streaming',
    keywords: ['transmit', 'obs', 'vmix', 'stream', 'streaming', 'projetar', 'navegador', 'porta', 'ip'],
    title: 'Transmissao para OBS/VMIX',
    text: `TRANSMISSAO LOUVORJA: Menu > Transmitir > configurar IP e Porta > "Iniciar Servidor". Copie a URL gerada e insira como objeto "Navegador" no OBS ou VMIX. Se der erro, tente mudar a porta. O conteudo (letras de musicas, passagens biblicas) e transmitido via navegador HTTP.
CSS PARA STREAMING: E possivel customizar a aparencia da letra transmitida com CSS — fonte, cor, tamanho, posicao (topo/rodape), fundo. Insira os codigos CSS na tela de formatacao.`,
  },

  // ─── BUSCA DE MUSICAS ───
  {
    id: 'music-search',
    keywords: ['busc', 'procur', 'achar', 'encontr', 'localiz', 'musica', 'hino', 'som'],
    title: 'Busca de Musicas e Hinos',
    text: `BUSCA DE MUSICAS: Use CTRL+F ou o campo de busca. Busca por nome ou parte do nome. Para buscar por trecho de letra, use "Localizar Musicas" no menu Coletaneas.
BUSCA COM ASTERISCO: O * representa qualquer trecho entre palavras. Ex: "Jesus*Melhor" encontra "Jesus e Melhor" e "Jesus meu Melhor Amigo".
HINARIO: Na aba Hinario, digite o NUMERO do hino e pressione ENTER para executar, ou digite o NOME para listar hinos que contenham essa palavra. O LouvorJA possui Hinario Adventista 1996 e Hinario Adventista 2022.
OPCOES DE ABERTURA DO HINO: Slide Cantado (com audio cantado), Slide Playback (com playback), Slide Sem Audio (manual), Em Sequencia (auto-avanca), Arquivo MP3 (cantado ou playback), Letra.`,
  },

  // ─── HINARIO ───
  {
    id: 'hymnal',
    keywords: ['hinari', 'hino', '1996', '2022', 'hinologia', 'correlacao', 'relacao',
      'numero', 'secao', 'seção', 'doutrinaria', 'categoria',
      'volta', 'vinda', 'batismo', 'ceia', 'sabado', 'sábado', 'mordomia', 'santuario', 'santuario',
      'adoração', 'adoracao', 'salvação', 'salvacao', 'graça', 'graca', 'missao', 'missão',
      'natal', 'cruz', 'espirito santo', 'novo mundo', 'nova terra', 'infantil', 'liturgico', 'litúrgico'],
    title: 'Hinarios — 1996 e 2022',
    text: `O LouvorJA suporta dois hinarios oficiais da IASD: Hinario Adventista 1996 (610 hinos) e Hinario Adventista 2022 (601 hinos). Ambos estao disponiveis no programa e na API.
O Hinario 2022 tem 600 hinos organizados por 8 secoes doutrinarias: Adoracao/Trindade (1-14), Deus Pai (15-22), Jesus Cristo (23-114 incluindo Natal 79-91 e Cruz 92-114), Espirito Santo (40-48), Biblia (49-58), Salvacao/Graca (115-172), Fe (173-216), Missao (223-241), Batismo (249-255), Santa Ceia (256-260), Sabado (290-299), Mordomia (300-314), Oração (357-367), Santuario (429-439), 2a Vinda (440-469), Nova Terra (491-507), Infantis (508-557), Liturgicos (558-600).
A correlacao entre os hinarios pode ser consultada no menu > Relacao de Hinos.`,
  },

  // ─── HINOS INDIVIDUAIS POPULARES (NHA 2022) ───
  // Hinos mais usados por secao - numeros e nomes reais para evitar alucinacao
  {
    id: 'popular-hymns',
    keywords: ['hino', 'numero', 'qual', 'nome', 'titulo', 'cantar', 'tocar', 'hinos', 'hinario',
      'volta', 'vinda', 'batismo', 'ceia', 'sabado', 'natal', 'cruz', 'salvacao', 'adoracao',
      'aventureiro', 'desbravador', 'infantil', 'funeral', 'saida', 'encerramento', 'abertura'],
    title: 'Hinos Populares do Hinario 2022 (numeros e nomes reais)',
    text: `HINOS MAIS USADOS DO HINARIO ADVENTISTA 2022 (NHA):

ADORACAO/TRINDADE: 1-Santo Santo Santo!, 5-Jubilosos Te Adoramos, 11-Maior Que Tudo, 12-Vinde Povo Do Senhor
DEUS PAI: 15-Tu Es Fiel Senhor, 20-Grande E O Senhor
JESUS CRISTO: 26-Saudai O Nome De Jesus, 32-Brilha Jesus, 34-Precioso Nome
ESPIRITO SANTO: 40-Concede-nos O Espirito, 43-Vem Santo Espirito Agora
BIBLIA: 49-Que Firme Alicerce!, 51-Da-me A Biblia
SALVACAO: 115-Preciosa Graca, 118-Imenso Amor, 121-Por Um Pecador Qual Eu, 125-A Terna Voz Do Salvador, 131-Manso E Suave, 140-Ao Pe Da Cruz De Cristo, 154-Alvo Mais Que A Neve
FE/CRESIMENTO: 173-Que Prazer E Ser De Cristo, 179-Eu Sei Em Quem Eu Creio, 195-Minha Fe Bem Segura Esta, 208-Confia Em Deus
MISSAO: 229-Trabalho Cristao, 232-Jesus Precisa De Ti, 233-Brilha Por Cristo Em Teu Viver
BATISMO: 249-Oh Que Belos Hinos!, 250-A Jesus Seguir Eu Quero, 253-Importa Renascer, 255-As Aguas Batismais
SANTA CEIA: 256-A Ceia Do Senhor, 259-Em Memoria De Ti
DONS/MINISTERIO: 269-Sal Da Terra, 273-A Escola Sabatina, 275-Hino Dos Aventureiros, 276-Hino Dos Desbravadores
SABADO: 290-Do Santo Sabado Es Senhor, 291-Sabado Do Meu Senhor, 296-Bem-vindo O Sabado
MORDOMIA: 302-Tudo Entregarei, 307-Conta As Bencaos, 313-Tudo Para Deus
ORACAO: 357-Bendita Hora De Oracao, 360-Deus Ouve Deus Responde, 362-O Melhor Lugar Do Mundo, 363-O Jardim De Oracao, 367-Falar Com Deus
CONSAGRACAO: 378-Mais Perto Quero Estar, 388-Se Minha Vida, 397-Eu So Quero Estar Onde Estas, 403-Renova-me
FAMILIA: 408-Abencoa Este Lar, 411-Bem De Manha, 420-Hora Feliz Do Por Do Sol
SANTUARIO: 429-Quando O Livro Aberto For, 430-O Juizo
2A VINDA: 440-Breve Jesus Voltara, 441-Vencendo Vem Jesus, 444-Oh Que Esperanca!, 451-Grande Alegria, 455-Verei Jesus, 456-Bela Manha, 468-Quase No Lar
MORTE/RESSURREICAO: 470-Rocha Eterna, 471-Porque Ele Vive
NOVA TERRA/CEU: 491-Ha Um Rio Cristalino, 492-Lar Feliz, 493-Almejo O Lar, 494-Doce Lar
INFANTIS: 509-Criacao, 511-Eu Sou Uma Obra De Arte, 523-Sim Cristo Me Ama, 524-Jesus Me Quer Bem, 537-Sabado O Dia Mais Feliz, 544-Entrega Teu Caminho Ao Senhor
LITURGICOS: 558-O Senhor Esta Em Seu Templo, 572-Ofertorio, 600-Em Paz Eu Vou

REGRA: Use APENAS estes numeros e nomes. Se o usuario perguntar sobre um hino que nao esta nesta lista, diga que voce nao tem o nome completo e sugira consultar o Hinario 2022 ou o app LouvorJA.`,
  },

  // ─── LETRAS E CIFRAS ───
  {
    id: 'lyrics',
    keywords: ['letra', 'cifra', 'acorde', 'estrofe', 'verso'],
    title: 'Letras e Cifras',
    text: `O LouvorJA exibe letras e cifras em tempo real. Pressione o botao "Letra" para abrir a janela de letras. Nela e possivel ver: informacoes do album, a letra completa, e busca rapida dentro da letra (palavras sao destacadas em vermelho). As cifras sao transpostas automaticamente ao mudar o tom (CTRL+T). A formatacao da fonte pode ser ajustada nas configuracoes.`,
  },

  // ─── COLETANEAS ───
  {
    id: 'collections',
    keywords: ['coleca', 'coletanea', 'playlist', 'ja', 'min. musica', 'youtube'],
    title: 'Coletaneas e Playlists',
    text: `COLETANEAS NO LOUVORJA: On-line (reproduz direto do YouTube, requer internet), Personalizadas (suas playlists com arquivos locais), JA/Min. Musica (louvores oficiais dos Jovens Adventistas), Diversas.
Para criar playlist personalizada: copie o diretorio do album (CTRL+C) e cole na tela Coletaneas Personalizadas (CTRL+V), ou clique "Adicionar".
EXECUCAO: Ao clicar numa coletanea, abre a lista de musicas. Clique para abrir o slide. Botoes de acao: slides cantado, playback, sem audio, MP3 cantado, MP3 playback, letra. "Reproduzir Todas" executa em sequencia. "Projetar Menu" projeta a lista.
Para excluir: clique direito > Excluir (remove apenas o atalho, nao o arquivo).`,
  },

  // ─── BIBLIA ───
  {
    id: 'bible',
    keywords: ['bibl', 'versic', 'versiculo', 'passage', 'testamento', 'deus', 'salmo', 'joao'],
    title: 'Busca Biblica',
    text: `BUSCA BIBLICA: Aba "Busca Biblica" com filtros para livro, capitulo e versiculo. Suporta multiplas versoes biblicas (selecionar na barra de ferramentas superior).
BUSCA POR PALAVRAS: Use * para qualquer trecho entre termos. Ex: "Deus*terra" encontra "No principio criou Deus os ceus e a terra."
MULTIPLAS PASSAGENS: Coloque varios versos no campo: "1-3" (versos 1 a 3), "1,3" (versos 1 e 3), "1-3,5" (1 a 3 e 5). Pressione ENTER.
CTRL+G: atalho para abrir a busca biblica rapidamente.`,
  },

  // ─── LITURGIA ───
  {
    id: 'liturgy',
    keywords: ['liturg', 'culto', 'programac', 'agenda', 'escala', 'itens agendados'],
    title: 'Liturgia e Programacao de Culto',
    text: `LITURGIA: Tela para organizar a sequencia da programacao do culto com musicas, leituras e anotacoes.
TIPOS DE ITEM: Anotacao (ex: "Oração" — sem acao), Arquivo/Diretorio (abre video ou PPT), Categoria (separador de grupo), Itens Agendados (conteudo dinamico vinculado a data), Musica (da coletanea — pode escolher na hora), Site (abre URL).
ITENS AGENDADOS: Itens que mudam cada sabado (Provai e Vede, Informativo, Momentos de Saude etc). Clique "Adicionar Categoria" para criar. Duplo-clique na data do calendario para vincular um arquivo. Depois adicione na Liturgia via "Adicionar Item" > "Itens Agendados".
Para adicionar musicas/arquivos: CTRL+C (copiar) > CTRL+V (colar na tela de Liturgia), ou use "Adicionar Item".`,
  },

  // ─── PROJECAO ───
  {
    id: 'projection',
    keywords: ['projet', 'monitor', 'tela', 'segundo monitor', 'expandid'],
    title: 'Projecao em Segundo Monitor',
    text: `PROJECAO: Clique no botao "Area Expandida" para projetar conteudo no segundo monitor. Se nao detectar o segundo monitor, abre no monitor principal. Pressione ESC ou o botao novamente para recolher.
Para alterar o monitor: clique na seta do botao "Area Expandida" e escolha. A escolha fica salva no programa.
MENU OPCOES: Tambem e possivel definir o monitor de projecao no menu geral > Opcoes.`,
  },

  // ─── EDITOR DE SLIDES ───
  {
    id: 'slide-editor',
    keywords: ['editor', 'slide', 'apresentac', 'gravar', 'tempo', 'interval'],
    title: 'Editor de Slides',
    text: `EDITOR DE SLIDES: Permite criar slides personalizados com texto principal, texto auxiliar, imagens e formatacao.
ACOES: Novo Slide, Duplicar Slide, Excluir Slide, Dividir Slide (cada linha vira slide; "|" faz quebra dentro do slide), Mesclar Prox. Slide.
GRAVACAO DE TEMPOS: Na aba "Audio/Gravacao" — Reproduzir para iniciar, depois "Gravar e Avancar" grava no momento atual do audio e avanca. "Gravar Inicio" marca inicio do slide. "Gravar Retroativo" volta 1 segundo. "Remover Gravacoes" zera todos os tempos.
Exportar: salve no formato .slja para editar depois. F5/F9 projeta os slides.`,
  },

  // ─── FORMATAÇÃO ───
  {
    id: 'formatting',
    keywords: ['format', 'css', 'estilo', 'fonte', 'cor', 'aparencia', 'tamanho'],
    title: 'Formatacao e CSS',
    text: `FORMATAÇÃO DE CONTEUDO: Botao "Formatar" abre painel lateral para modificar fonte, cor, tamanho, imagem de fundo e disposicao. Botao "Restaurar" volta ao padrao.
CSS PARA STREAMING: E possivel customizar a aparencia da letra transmitida para OBS/VMIX com CSS. Manipule: posicao (top/bottom), tamanho da fonte (px), cor da fonte (nome em ingles ou hex #FFFFFF), tipo de fonte. O CSS e aplicado em tempo real durante a transmissao.`,
  },

  // ─── PROVAI E VEDE ───
  {
    id: 'provai-e-vede',
    keywords: ['provai', 'vede', 'video', 'informativo', 'missao'],
    title: 'Provai e Vede',
    text: `PROVAI E VEDE: O programa NAO possui os videos nativamente. O usuario deve baixar os videos da internet manualmente e cadastrar no programa.
Para adicionar: 1) Baixe o video da internet; 2) Vá em "Itens Agendados"; 3) Crie uma categoria; 4) Duplo-clique na data do calendario e selecione o arquivo; 5) Na tela de Liturgia, adicione via "Adicionar Item" > "Itens Agendados".
Itens Agendados tambem servem para Informativo Mundial das Missoes, Momentos de Saude, e outros conteudos dinamicos.`,
  },

  // ─── EXPORTACAO ───
  {
    id: 'export',
    keywords: ['export', 'salvar', 'arquivo', 'slja', 'mp3', 'download'],
    title: 'Exportacao e Download',
    text: `FORMATOS DE EXPORTAÇÃO: .slja (formato nativo do LouvorJA — pode ser editado depois no Editor de Slides), PDF (para impressao), MP3 (audio cantado e playback).
Para exportar: pressione "Exportar Musica" para salvar a musica atual em .slja.
COLETANEAS PERSONALIZADAS: Excluir coletanea remove APENAS o atalho do menu, NAO exclui o arquivo original. Para excluir todas: seta ao lado de "Excluir" > "Excluir Todas".
O LouvorJA esta disponivel para Android (Play Store, gratuito), Windows (download no site), e Web (navegador). Acesse louvorja.com/download.`,
  },

  // ─── CONFIGURACOES ───
  {
    id: 'settings',
    keywords: ['configur', 'ajuste', 'prefer', 'opcao', 'tema', 'escuro', 'claro', 'idioma'],
    title: 'Configuracoes do LouvorJA',
    text: `CONFIGURACOES DISPONIVEIS: Tema (claro ou escuro), Fonte (tamanho e estilo), Transposicao padrao (tom padrao para musicas), Ordem das musicas (como sao listadas), Idioma (portugues e espanhol), Monitor de projecao.
O programa suporta i18n — portugues e espanhol. A troca de idioma e feita nas configuracoes.
Para acesso rapido: F1 abre a tela de ajuda dentro do programa.`,
  },

  // ─── APLICACOES ───
  {
    id: 'platforms',
    keywords: ['download', 'baixar', 'instalar', 'mobile', 'celular', 'android', 'windows', 'web', 'app'],
    title: 'Plataformas e Download',
    text: `O LouvorJA esta disponivel em: Android (gratuito na Play Store), Windows (download no site oficial louvorja.com), Web (acesso pelo navegador).
Site oficial: https://louvorja.com.br
Central de ajuda: https://louvorja.com.br/ajuda
O app e open source — repositorio no GitHub: github.com/louvorja`,
  },

  // ─── API DATA (para evitar alucinação de números) ───
  {
    id: 'api-data',
    keywords: ['api', 'endpoint', 'quantas musicas', 'quantos hinos', 'total', 'acervo', 'catalogo'],
    title: 'Dados do Acervo LouvorJA',
    text: `ACERVO LOUVORJA: O acervo possui aproximadamente 1889 musicas, 601 hinos do Hinario Adventista 2022, 613 hinos do Hinario Adventista 1996, e 13 categorias com albuns tematicos.
CATEGORIAS: Incluem Hinario Adventista, Hinario Adventista 2022, JA (Jovens Adventistas), Ministerio de Musica, Diversas, entre outras.
ALBUNS TEMATICOS MAIS USADOS: Adoradores (1-5), Celebra SP, Diferente, Até que Ele Venha, Na Presença de Deus, 2002-2024 (por ano), Salmos, Desbravadores e Aventureiros, entre outros.
API publica: https://api.louvorja.com.br — documentacao Swagger disponivel em /documentation.
NAO INVENTE NUMEROS. Use apenas os dados acima. Se o usuario perguntar sobre um hino especifico por numero, sugira buscar no app ou no site.`,
  },

  // ─── HINARIO 2022 — SECOES TEMATICAS (anti-alucinação forte) ───
  {
    id: 'hymnal-2022-sections',
    keywords: ['hinario 2022', 'nha', 'novo hinario', 'hinario novo', 'secao', 'doutrina', 'tema'],
    title: 'Hinario Adventista 2022 — Secoes por Doutrina',
    text: `HINARIO ADVENTISTA 2022 — 600 hinos organizados por secoes doutrinarias:
ADORACAO/TRINDADE (1-14): Abertura de culto.
DEUS PAI (15-22): Louvor geral.
JESUS CRISTO (23-114): Inclui Natal (79-91), Cruz (92-114).
ESPIRITO SANTO (40-48): Consagracao.
BIBLIA (49-58): Escola Sabatina.
SALVACAO/GRAÇA (115-172): Apelo, conversao.
CRESCIMENTO/FE (173-216): Encorajamento.
MISSAO/EVANGELISMO (223-241): Testemunho.
BATISMO (249-255): Culto batismal.
SANTA CEIA (256-260): Culto de comunhao.
DONS/MINISTERIO (261-276): Ordenacao, Aventureiros (275), Desbravadores (276).
SABADO (290-299): Por do sol, abertura.
MORDOMIA/OFERTAS (300-314): Dizimos e ofertas.
ORACAO (357-367): Momento de oracao.
SANTUARIO (429-439): Juizo, investigacao.
2A VINDA (440-469): Esperanca, encerramento.
NOVA TERRA/CEU (491-507): Consolacao, funeral.
INFANTIS (508-557): Adoracao infantil.
LITURGICOS INTROITO (558-571), OFERTORIO (572-577), DESPEDIDA (592-600).
NAO INVENTE NUMEROS DE HINOS. Se o usuario pedir um hino por tema, sugira a faixa da secao correspondente.`,
  },

  // ─── ALBUNS TEMATICOS (sugestão por tema) ───
  {
    id: 'thematic-albums',
    keywords: ['album', 'suger', 'recomend', 'tema', 'amor', 'graca', 'oracão', 'missao', 'esperanca', 'fe', 'louvor', 'adoracão', 'natal', 'juventude', 'consagracão'],
    title: 'Albuns Tematicos do LouvorJA',
    text: `ALBUNS POR TEMA (guia de sugestao):
AMOR/GRAÇA: Adoradores, Adoradores 2, Celebra SP, 2002-Voce me Pertence.
ORACAO/COMUNHAO: Adoradores 3, Na Presença de Deus, Magnifico Deus.
MISSAO/TESTEMUNHO: 1998-Missao, 2004-Somos Tua Voz, 2019-Somos Tuas Maos.
ESPERANÇA/VOLTA DE JESUS: Até que Ele Venha, 2014-A Unica Esperanca, 2024-Maranata.
FE/CONFIANÇA: 2005-Fiel a Toda Prova, 2008-Vivo por Jesus, Salmos.
LOUVOR/ADORACAO: Adoradores 4, Adoradores 5, Celebra SP 2 e 3.
JOVENS/ENERGIA: Diferente, 2010-Geração Esperanca, 2011-Amigos da Esperanca.
NATAL/PASCOA: Semana Santa 2023, Diversas.
BIBLIA/PALAVRA: Está Escrito Vol.1, 2015-Eu Sou a Mensagem.
CONSAGRACAO: Adoradores 3, 2020-Tudo por Ele, 2017-Eu Creio.
INFANTIL: Desbravadores e Aventureiros (album oficial).
NAO INVENTE NOMES DE MUSICAS OU ALBUNS. Apenas sugira albuns desta lista.`,
  },

  // ─── REPRODUCAO EM SEQUENCIA ───
  {
    id: 'sequential-playback',
    keywords: ['sequencia', 'reproduz', 'seguida', 'proximo', 'automat'],
    title: 'Reproducao de Hinos em Sequencia',
    text: `REPRODUCAO EM SEQUENCIA: Na aba Hinario, selecione um hino e pressione "Em Sequencia". O hino atual sera executado e, ao termino, o proximo hino sera executado automaticamente (ex: hino 51 > 52 > 53...).
Na tela de Playlist (coletanea), o botao "Reproduzir Todas" executa todas as musicas da coletanea em sequencia automaticamente.
FORMAS DE ABERTURA DE HINO: Letra, Slide Cantado, Slide Playback, Slide Sem Audio (manual), Em Sequencia, Arquivo MP3 Cantado, Arquivo MP3 Playback.`,
  },
];

/**
 * Search the RAG knowledge base for chunks relevant to the user query.
 * Uses token-level keyword matching with TF scoring.
 *
 * @param {string} query - The user's question/message
 * @param {number} maxChunks - Maximum chunks to return (default: 3)
 * @returns {string} Formatted context string to inject into LLM system prompt
 */
export function searchRAG(query, maxChunks = 3) {
  if (!query || typeof query !== 'string') return '';

  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 2);

  // Score each chunk
  const scored = CHUNKS.map(chunk => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;

    // 1. Exact keyword match (high weight)
    for (const kw of chunk.keywords) {
      if (queryLower.includes(kw.toLowerCase())) {
        score += 3;
      }
    }

    // 2. Token overlap in chunk text
    for (const token of queryTokens) {
      if (textLower.includes(token)) {
        score += 1;
      }
      // Also check keywords for partial token match
      for (const kw of chunk.keywords) {
        if (kw.toLowerCase().includes(token)) {
          score += 0.5;
        }
      }
    }

    return { ...chunk, score };
  });

  // Sort by score descending, take top N
  const topChunks = scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);

  if (topChunks.length === 0) return '';

  // Format context for injection
  const contextBlocks = topChunks.map(c => `[${c.title}]\n${c.text}`).join('\n\n');
  return contextBlocks;
}

/**
 * Build the full system prompt with RAG context injected.
 *
 * @param {string} query - User's current message
 * @param {string} lang - Language string (e.g. "português brasileiro")
 * @returns {string} Complete system prompt with context
 */
export function buildSystemPrompt(query, lang) {
  const ragContext = searchRAG(query, 3);

  let prompt = `Você é o assistente virtual do LouvorJA, um app de gestão musical e litúrgica para a Igreja Adventista do Sétimo Dia.
Regras:
- Responda em ${lang}
- Seja conciso e útil
- Conhece o LouvorJA: busca de músicas, hinário adventista, projeção, transmissão OBS/VMIX, atalhos de teclado, liturgia, slides, CSS personalizado, exportação (SLJA/PDF/MP3)
- Se não souber, diga honestamente e sugira contato via louvorja.com
- Não invente funcionalidades que o app não tem
- NÃO INVENTE números de hinos, nomes de músicas ou álbuns que não estejam nos dados abaixo. Se voce so tem a faixa numerica (ex: "Batismo 249-255") e nao o nome de cada hino, diga APENAS a faixa e NUNCA invente titulos individuais
- Use formatação HTML básica (<strong>, <em>, <br>, <li>, <h3>). NÃO use markdown (*, ##, etc)
- IMPORTANTE: Se o usuário perguntar em espanhol, TRADUZA os nomes dos hinos e músicas para espanhol. Não deixe títulos em português. Exemplo: "Breve Jesus Voltará" → "Pronto Jesús Volverá", "Vencendo Vem Jesus" → "Vencedor Viene Jesús"`;

  if (ragContext) {
    prompt += `\n\nCONHECIMENTO ESPECÍFICO DO LOUVORJA (use estes dados para responder com precisão):\n\n${ragContext}`;
  }

  return prompt;
}

export default { searchRAG, buildSystemPrompt };
