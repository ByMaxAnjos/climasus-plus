import type { Lang } from '../store/pipeline'
import type { StageId } from '../catalog'

type Dict = Record<string, { pt: string; en: string; es: string }>

const dict: Dict = {
  subtitle: {
    pt: 'Módulo Studio do ecossistema climaSUS',
    en: 'Studio module of the climaSUS ecosystem',
    es: 'Módulo Studio del ecosistema climaSUS',
  },
  search: { pt: 'Buscar função…', en: 'Search function…', es: 'Buscar función…' },
  emptyCodeComment: {
    pt: '# Monte seu pipeline adicionando funções à esquerda',
    en: '# Build your pipeline by adding functions on the left',
    es: '# Arme su pipeline agregando funciones a la izquierda',
  },
  pipeline: { pt: 'Pipeline', en: 'Pipeline', es: 'Pipeline' },
  emptyPipeline: {
    pt: 'Pipeline vazio. Escolha uma função à esquerda — a base recomendada é: Importar dados do DATASUS + Corrigir acentuação e caracteres + Padronizar nomes e valores.',
    en: 'Empty pipeline. Pick a function on the left — the recommended base is: Import DATASUS data + Correct accents and characters + Standardize names and values.',
    es: 'Pipeline vacío. Elija una función a la izquierda — la base recomendada es: Importar datos de DATASUS + Corregir acentos y caracteres + Estandarizar nombres y valores.',
  },
  emptyPipelinePick: {
    pt: 'Escolha uma função na biblioteca.',
    en: 'Choose a function from the library.',
    es: 'Elija una función en la biblioteca.',
  },
  emptyPipelineTune: {
    pt: 'Ajuste os parâmetros no painel à direita.',
    en: 'Tune its parameters in the right panel.',
    es: 'Ajuste los parámetros en el panel derecho.',
  },
  emptyPipelineRun: {
    pt: 'Execute o pipeline ou exporte o código R.',
    en: 'Run the pipeline or export the R code.',
    es: 'Ejecute el pipeline o exporte el código R.',
  },
  emptyPipelineTutorial: {
    pt: 'Para testar sem configurar nada, use um modelo pronto no topo.',
    en: 'To test without configuring anything, use a ready-made template in the topbar.',
    es: 'Para probar sin configurar nada, use un modelo listo en la barra superior.',
  },
  emptyPipelineChooseMode: {
    pt: '⚙ Antes de começar, escolha seu Modo de uso (Vigilância ou Pesquisa).',
    en: '⚙ Before you start, choose your Usage mode (Surveillance or Research).',
    es: '⚙ Antes de empezar, elija su Modo de uso (Vigilancia o Investigación).',
  },
  emptyPipelineKeepTerminal: {
    pt: '🟢 Mantenha aberta a janela de terminal que abriu junto com o aplicativo — é ela que mantém o motor R rodando. Se fechar, o indicador "R" no topo apaga e o Executar para de funcionar.',
    en: '🟢 Keep the terminal window that opened alongside the app open — it keeps the R engine running. Closing it turns off the "R" indicator at the top and Run stops working.',
    es: '🟢 Mantenga abierta la ventana de terminal que se abrió junto con la aplicación — es la que mantiene el motor R funcionando. Si la cierra, el indicador "R" arriba se apaga y Ejecutar deja de funcionar.',
  },
  addToPipeline: { pt: '＋ Adicionar ao pipeline', en: '＋ Add to pipeline', es: '＋ Añadir al pipeline' },
  params: { pt: 'Parâmetros', en: 'Parameters', es: 'Parámetros' },
  stepPosition: { pt: 'Passo {n} de {total}', en: 'Step {n} of {total}', es: 'Paso {n} de {total}' },
  aboutFunction: { pt: 'Sobre esta função', en: 'About this function', es: 'Sobre esta función' },
  requiredLegend: { pt: 'obrigatório', en: 'required', es: 'obligatorio' },
  requiredMissingHint: { pt: 'Preencha este campo antes de executar.', en: 'Fill this field before running.', es: 'Complete este campo antes de ejecutar.' },
  usingDefault: { pt: 'Usando padrão: {value}', en: 'Using default: {value}', es: 'Usando valor predeterminado: {value}' },
  advancedParams: { pt: 'Avançado', en: 'Advanced', es: 'Avanzado' },
  advancedSummary: {
    pt: 'Opções menos comuns. Ajuste apenas se precisar mudar o comportamento padrão.',
    en: 'Less common options. Change these only when you need to override the default behavior.',
    es: 'Opciones menos comunes. Ajuste solo si necesita cambiar el comportamiento predeterminado.',
  },
  codeR: { pt: 'Código R', en: 'R code', es: 'Código R' },
  copy: { pt: 'Copiar', en: 'Copy', es: 'Copiar' },
  copied: { pt: 'Copiado!', en: 'Copied!', es: '¡Copiado!' },
  exportR: { pt: 'Exportar .R', en: 'Export .R', es: 'Exportar .R' },
  clearAll: { pt: 'Limpar', en: 'Clear', es: 'Limpiar' },
  defaultHint: { pt: 'padrão', en: 'default', es: 'por defecto' },
  selectFn: {
    pt: 'Selecione uma função na biblioteca ou um passo do pipeline para editar seus parâmetros.',
    en: 'Select a function from the library or a pipeline step to edit its parameters.',
    es: 'Seleccione una función de la biblioteca o un paso del pipeline para editar sus parámetros.',
  },
  steps: { pt: 'passos', en: 'steps', es: 'pasos' },
  run: { pt: 'Executar', en: 'Run', es: 'Ejecutar' },
  running: { pt: 'Executando…', en: 'Running…', es: 'Ejecutando…' },
  runUpToHere: { pt: 'Executar até aqui', en: 'Run up to here', es: 'Ejecutar hasta aquí' },
  moveStepUp: { pt: 'Mover passo para cima', en: 'Move step up', es: 'Mover paso hacia arriba' },
  moveStepDown: { pt: 'Mover passo para baixo', en: 'Move step down', es: 'Mover paso hacia abajo' },
  dragToReorder: { pt: 'Arraste para reordenar', en: 'Drag to reorder', es: 'Arrastre para reordenar' },
  freeTextOption: { pt: '— texto livre —', en: '— free text —', es: '— texto libre —' },
  stepRefValue: { pt: 'Resultado do passo', en: 'Result from step', es: 'Resultado del paso' },
  invalidStepRef: {
    pt: '{fn}: o parâmetro "{arg}" referencia um passo que não existe mais ou vem depois — escolha outro.',
    en: '{fn}: parameter "{arg}" references a step that no longer exists or comes later — pick another.',
    es: '{fn}: el parámetro "{arg}" referencia un paso que ya no existe o viene después — elija otro.',
  },
  removeStep: { pt: 'Remover passo', en: 'Remove step', es: 'Eliminar paso' },
  restartEngine: { pt: 'Reiniciar motor', en: 'Restart engine', es: 'Reiniciar motor' },
  chooseMode: { pt: 'Modo de uso', en: 'Usage mode', es: 'Modo de uso' },
  settings: { pt: 'Configurações', en: 'Settings', es: 'Configuración' },
  language: { pt: 'Idioma', en: 'Language', es: 'Idioma' },
  theme: { pt: 'Tema', en: 'Theme', es: 'Tema' },
  modeVigilancia: { pt: 'Vigilância e gestão', en: 'Surveillance & management', es: 'Vigilancia y gestión' },
  modePesquisa: { pt: 'Pesquisa avançada', en: 'Advanced research', es: 'Investigación avanzada' },
  modeSelectorTitle: {
    pt: 'Qual é o seu objetivo neste projeto?',
    en: 'What is your goal for this project?',
    es: '¿Cuál es su objetivo en este proyecto?',
  },
  modeSelectorLede: {
    pt: 'Os dois modos compartilham dados, projetos e resultados — só mudam o nível de liberdade, a linguagem e a exigência metodológica. Você pode trocar de modo a qualquer momento.',
    en: 'Both modes share data, projects and results — only the level of freedom, language and methodological rigor differ. You can switch modes at any time.',
    es: 'Ambos modos comparten datos, proyectos y resultados — solo cambian el nivel de libertad, el lenguaje y la exigencia metodológica. Puede cambiar de modo en cualquier momento.',
  },
  modeVigilanciaGoal: {
    pt: 'Monitorar riscos e apoiar resposta',
    en: 'Monitor risk and support response',
    es: 'Monitorear riesgos y apoyar la respuesta',
  },
  modeVigilanciaUser: {
    pt: 'Vigilância, APS, gestão municipal/estadual',
    en: 'Surveillance, primary care, municipal/state management',
    es: 'Vigilancia, APS, gestión municipal/estatal',
  },
  modeVigilanciaLanguage: {
    pt: '"O que aumentou? Onde? Quem priorizar?"',
    en: '"What increased? Where? Who to prioritize?"',
    es: '"¿Qué aumentó? ¿Dónde? ¿A quién priorizar?"',
  },
  modeVigilanciaDecision: {
    pt: 'Apoia ação e priorização',
    en: 'Supports action and prioritization',
    es: 'Apoya la acción y la priorización',
  },
  modePesquisaGoal: {
    pt: 'Estimar, testar e produzir evidência científica',
    en: 'Estimate, test and produce scientific evidence',
    es: 'Estimar, probar y producir evidencia científica',
  },
  modePesquisaUser: {
    pt: 'Epidemiologia, estatística, pesquisa',
    en: 'Epidemiology, statistics, research',
    es: 'Epidemiología, estadística, investigación',
  },
  modePesquisaLanguage: {
    pt: '"Qual método? Qual suposição? Qual incerteza?"',
    en: '"Which method? Which assumption? Which uncertainty?"',
    es: '"¿Qué método? ¿Qué suposición? ¿Qué incertidumbre?"',
  },
  modePesquisaDecision: {
    pt: 'Apoia publicação, avaliação e síntese',
    en: 'Supports publication, evaluation and synthesis',
    es: 'Apoya la publicación, evaluación y síntesis',
  },
  modeGoalLabel: { pt: 'Objetivo', en: 'Goal', es: 'Objetivo' },
  modeUserLabel: { pt: 'Usuário principal', en: 'Primary user', es: 'Usuario principal' },
  modeLanguageLabel: { pt: 'Linguagem', en: 'Language', es: 'Lenguaje' },
  modeDecisionLabel: { pt: 'Decisão', en: 'Decision', es: 'Decisión' },
  undo: { pt: 'Desfazer', en: 'Undo', es: 'Deshacer' },
  redo: { pt: 'Refazer', en: 'Redo', es: 'Rehacer' },
  undoHint: { pt: 'Desfazer (Ctrl/Cmd+Z)', en: 'Undo (Ctrl/Cmd+Z)', es: 'Deshacer (Ctrl/Cmd+Z)' },
  redoHint: { pt: 'Refazer (Ctrl/Cmd+Shift+Z)', en: 'Redo (Ctrl/Cmd+Shift+Z)', es: 'Rehacer (Ctrl/Cmd+Shift+Z)' },
  report: { pt: '📄 Relatório', en: '📄 Report', es: '📄 Informe' },
  reportHint: {
    pt: 'Gerar e baixar um relatório HTML com os resultados já executados nesta sessão',
    en: 'Generate and download an HTML report with the results already executed in this session',
    es: 'Generar y descargar un informe HTML con los resultados ya ejecutados en esta sesión',
  },
  console: { pt: 'Console', en: 'Console', es: 'Consola' },
  noResults: {
    pt: 'Nenhum resultado ainda. Clique em Executar para ver os resultados.',
    en: 'No results yet. Click Run to see the results.',
    es: 'Aún no hay resultados. Haga clic en Ejecutar para ver los resultados.',
  },
  codeTab: { pt: 'Código', en: 'Code', es: 'Código' },
  resultsTab: { pt: 'Resultados', en: 'Results', es: 'Resultados' },
  engine_offline: { pt: 'Motor offline', en: 'Engine offline', es: 'Motor sin conexión' },
  engine_ready: { pt: 'Motor pronto', en: 'Engine ready', es: 'Motor listo' },
  engine_busy: { pt: 'Motor ocupado', en: 'Engine busy', es: 'Motor ocupado' },
  staticPlot: { pt: 'Estático', en: 'Static', es: 'Estático' },
  interactivePlot: { pt: 'Interativo', en: 'Interactive', es: 'Interactivo' },
  autoFromPrevious: {
    pt: 'vem do passo anterior', en: 'comes from the previous step', es: 'viene del paso anterior',
  },
  autoArgIgnoredWarning: {
    pt: 'Este valor será ignorado — escolha um passo acima ou deixe em branco para usar o passo anterior automaticamente.',
    en: 'This value will be ignored — pick a step above, or leave it blank to use the previous step automatically.',
    es: 'Este valor será ignorado — elija un paso arriba o déjelo vacío para usar el paso anterior automáticamente.',
  },
  loadTutorial: { pt: '🎓 Tutorial', en: '🎓 Tutorial', es: '🎓 Tutorial' },
  tutorialStepOf: { pt: 'Passo {n} de {total}', en: 'Step {n} of {total}', es: 'Paso {n} de {total}' },
  tutorialPrev: { pt: '← Anterior', en: '← Previous', es: '← Anterior' },
  tutorialNext: { pt: 'Próximo →', en: 'Next →', es: 'Siguiente →' },
  tutorialFinish: { pt: 'Concluir', en: 'Finish', es: 'Finalizar' },
  tutorialExit: { pt: 'Sair do tutorial', en: 'Exit tutorial', es: 'Salir del tutorial' },
  saveMap: { pt: '💾 Salvar mapa', en: '💾 Save map', es: '💾 Guardar mapa' },
  expandPanel: { pt: 'Ampliar painel', en: 'Expand panel', es: 'Ampliar panel' },
  collapsePanel: { pt: 'Restaurar painel', en: 'Restore panel', es: 'Restaurar panel' },
  unknownFn: { pt: 'Função desconhecida: {fn}', en: 'Unknown function: {fn}', es: 'Función desconocida: {fn}' },
  missingArg: {
    pt: '{fn}: parâmetro obrigatório ausente: {arg}',
    en: '{fn}: missing required parameter: {arg}',
    es: '{fn}: falta el parámetro obligatorio: {arg}',
  },
  invalidEnum: {
    pt: '{fn}: valor inválido em {arg}. Use um dos valores permitidos.',
    en: '{fn}: invalid value in {arg}. Use one of the allowed values.',
    es: '{fn}: valor inválido en {arg}. Use uno de los valores permitidos.',
  },
  invalidNumber: {
    pt: '{fn}: valor não numérico em {arg}.',
    en: '{fn}: non-numeric value in {arg}.',
    es: '{fn}: valor no numérico en {arg}.',
  },
  offlineHint: {
    pt: 'Motor offline — exporte o código da análise para executar em outro ambiente, ou reinicie o Motor.',
    en: 'Engine offline — export the analysis code to run it elsewhere, or restart the engine.',
    es: 'Motor sin conexión — exporte el código del análisis para ejecutarlo en otro entorno, o reinicie el Motor.',
  },
  offlineDetails: {
    pt: 'Detalhes do motor: {message}',
    en: 'Engine details: {message}',
    es: 'Detalles del motor: {message}',
  },
  // Pipeline center
  help: { pt: 'Pipelines', en: 'Pipelines', es: 'Pipelines' },
  about: { pt: 'Sobre', en: 'About', es: 'Acerca de' },
  helpTitle: { pt: 'Centro de Pipelines', en: 'Pipeline Center', es: 'Centro de Pipelines' },
  helpIntro: {
    pt: 'Escolha um ponto de partida editável para o grafo. Pipelines prontos carregam uma sequência de funções; o tutorial guiado ensina o fluxo passo a passo.',
    en: 'Choose an editable starting point for the graph. Ready-made pipelines load a function sequence; the guided tutorial teaches the flow step by step.',
    es: 'Elija un punto de partida editable para el grafo. Los pipelines listos cargan una secuencia de funciones; el tutorial guiado enseña el flujo paso a paso.',
  },
  helpRecommended: { pt: 'Recomendados', en: 'Recommended', es: 'Recomendados' },
  helpPipeline: { pt: 'Trilha do pipeline', en: 'Pipeline track', es: 'Ruta del pipeline' },
  helpClima: { pt: 'Clima & ambiente', en: 'Climate & environment', es: 'Clima y ambiente' },
  helpThematic: { pt: 'Tutoriais temáticos', en: 'Thematic tutorials', es: 'Tutoriales temáticos' },
  helpCaseStudies: { pt: 'Estudos de caso', en: 'Case studies', es: 'Estudios de caso' },
  helpModeling: { pt: 'Modelagem', en: 'Modeling', es: 'Modelado' },
  helpLoadTemplate: { pt: 'Carregar no grafo', en: 'Load into graph', es: 'Cargar en el grafo' },
  helpSearchPlaceholder: {
    pt: 'Buscar por dengue, INMET, DLNM, poluição...',
    en: 'Search dengue, INMET, DLNM, pollution...',
    es: 'Buscar dengue, INMET, DLNM, contaminación...',
  },
  helpSearchResults: { pt: 'Resultados da busca', en: 'Search results', es: 'Resultados de búsqueda' },
  helpNoResults: {
    pt: 'Nenhum pipeline encontrado. Tente buscar por tema, fonte de dados ou função.',
    en: 'No pipeline found. Try searching by theme, data source or function.',
    es: 'No se encontró ningún pipeline. Intente buscar por tema, fuente de datos o función.',
  },
  helpShowFunctions: { pt: 'Ver funções técnicas', en: 'Show technical functions', es: 'Ver funciones técnicas' },
  downloadsData: { pt: 'baixa dados', en: 'downloads data', es: 'descarga datos' },
  requiresPreparedData: { pt: 'requer dados', en: 'needs data', es: 'requiere datos' },
  requiresPreparedDataHint: {
    pt: 'Este template começa a partir de um arquivo preparado. Carregue o pipeline e informe o arquivo no parâmetro path, ou use Importar dados no topo para iniciar de um arquivo local.',
    en: 'This template starts from a prepared file. Load the pipeline and set the path parameter, or use Import data in the topbar to start from a local file.',
    es: 'Este template empieza desde un archivo preparado. Cargue el pipeline e informe el parámetro path, o use Importar datos en la barra superior para iniciar desde un archivo local.',
  },
  guidedTutorial: { pt: 'Tutorial guiado', en: 'Guided tutorial', es: 'Tutorial guiado' },
  templatesButton: { pt: 'Templates', en: 'Templates', es: 'Templates' },
  close: { pt: 'Fechar', en: 'Close', es: 'Cerrar' },
  // Project file IO
  saveProject: { pt: 'Salvar projeto', en: 'Save project', es: 'Guardar proyecto' },
  openProject: { pt: 'Abrir projeto', en: 'Open project', es: 'Abrir proyecto' },
  openData: { pt: 'Importar dados', en: 'Import data', es: 'Importar datos' },
  saveProjectHint: {
    pt: 'Salvar o pipeline atual (funções e parâmetros) em um arquivo .climasus.json',
    en: 'Save the current pipeline (functions and parameters) to a .climasus.json file',
    es: 'Guardar el pipeline actual (funciones y parámetros) en un archivo .climasus.json',
  },
  openProjectHint: {
    pt: 'Abrir um projeto salvo (.climasus.json) para retomar o pipeline de onde parou',
    en: 'Open a saved project (.climasus.json) to resume the pipeline where you left off',
    es: 'Abrir un proyecto guardado (.climasus.json) para retomar el pipeline donde lo dejó',
  },
  openDataHint: {
    pt: 'Começar a partir de um arquivo de dados (.parquet/.csv/.xlsx/.rds) de uma análise anterior',
    en: 'Start from a data file (.parquet/.csv/.xlsx/.rds) from a previous analysis',
    es: 'Comenzar a partir de un archivo de datos (.parquet/.csv/.xlsx/.rds) de un análisis anterior',
  },
  invalidProject: {
    pt: 'Arquivo de projeto inválido ou corrompido.',
    en: 'Invalid or corrupted project file.',
    es: 'Archivo de proyecto inválido o corrupto.',
  },
}

export const STAGE_LABELS: Record<StageId, { pt: string; en: string; es: string; sub: Record<Lang, string> }> = {
  preparacao: {
    pt: 'Preparação', en: 'Preparation', es: 'Preparación',
    sub: {
      pt: 'Importação, limpeza, filtros e agregação (sus_data_*)',
      en: 'Import, cleaning, filters and aggregation (sus_data_*)',
      es: 'Importación, limpieza, filtros y agregación (sus_data_*)',
    },
  },
  integracao: {
    pt: 'Integração', en: 'Integration', es: 'Integración',
    sub: {
      pt: 'Espacial, censo, clima e ambiente (sus_join, sus_socio, sus_climate, sus_grid)',
      en: 'Spatial, census, climate and environment (sus_join, sus_socio, sus_climate, sus_grid)',
      es: 'Espacial, censo, clima y ambiente (sus_join, sus_socio, sus_climate, sus_grid)',
    },
  },
  modelagem: {
    pt: 'Análise & Modelagem', en: 'Analysis & Modeling', es: 'Análisis y Modelado',
    sub: {
      pt: 'DLNM, carga atribuível, Bayes espacial, ML (sus_mod_*)',
      en: 'DLNM, attributable burden, spatial Bayes, ML (sus_mod_*)',
      es: 'DLNM, carga atribuible, Bayes espacial, ML (sus_mod_*)',
    },
  },
}

export const FAMILY_LABELS: Record<string, Record<Lang, string>> = {
  core: { pt: 'Processamento', en: 'Processing', es: 'Procesamiento' },
  plot: { pt: 'Visualização', en: 'Visualization', es: 'Visualización' },
  spatial: { pt: 'Agregação espacial', en: 'Spatial aggregation', es: 'Agregación espacial' },
  censo: { pt: 'Censo demográfico', en: 'Census', es: 'Censo demográfico' },
  climate: { pt: 'Clima (estações)', en: 'Climate (stations)', es: 'Clima (estaciones)' },
  grid: { pt: 'Clima & ambiente (grade)', en: 'Climate & environment (gridded)', es: 'Clima y ambiente (rejilla)' },
}

export function t(key: keyof typeof dict, lang: Lang): string {
  return dict[key][lang]
}

// t() with {placeholder} substitution, for messages built outside a component (e.g. validation)
export function tp(key: keyof typeof dict, lang: Lang, params: Record<string, string>): string {
  return Object.entries(params).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), t(key, lang))
}
