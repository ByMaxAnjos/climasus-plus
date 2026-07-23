import type { Lang } from '../store/pipeline'
import type { StageId } from '../catalog'

type Dict = Record<string, { pt: string; en: string; es: string }>

const dict: Dict = {
  subtitle: {
    pt: 'Estúdio de análises em saúde e clima',
    en: 'Health & climate analytics studio',
    es: 'Estudio de análisis en salud y clima',
  },
  search: { pt: 'Buscar função…', en: 'Search function…', es: 'Buscar función…' },
  pipeline: { pt: 'Pipeline', en: 'Pipeline', es: 'Pipeline' },
  emptyPipeline: {
    pt: 'Pipeline vazio. Escolha uma função à esquerda — comece por sus_data_import para baixar dados do DATASUS.',
    en: 'Empty pipeline. Pick a function on the left — start with sus_data_import to download DATASUS data.',
    es: 'Pipeline vacío. Elija una función a la izquierda — empiece por sus_data_import para descargar datos de DATASUS.',
  },
  addToPipeline: { pt: '＋ Adicionar ao pipeline', en: '＋ Add to pipeline', es: '＋ Añadir al pipeline' },
  params: { pt: 'Parâmetros', en: 'Parameters', es: 'Parámetros' },
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
  restartEngine: { pt: 'Reiniciar motor', en: 'Restart engine', es: 'Reiniciar motor' },
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
  help: { pt: '📚 Pipelines', en: '📚 Pipelines', es: '📚 Pipelines' },
  helpTitle: { pt: 'Centro de Pipelines', en: 'Pipeline Center', es: 'Centro de Pipelines' },
  helpIntro: {
    pt: 'Escolha um pipeline pronto para carregá-lo no grafo como ponto de partida editável. A central agora segue os tutoriais: trilha em etapas, clima/ambiente, temáticos, estudos de caso, modelagem e RAP.',
    en: 'Pick a ready-made pipeline to load it into the graph as an editable starting point. The center now follows the tutorials: step-by-step track, climate/environment, thematic guides, case studies, modelling and RAP.',
    es: 'Elija un pipeline listo para cargarlo en el grafo como punto de partida editable. El centro ahora sigue los tutoriales: ruta por etapas, clima/ambiente, temáticos, estudios de caso, modelado y RAP.',
  },
  helpPipeline: { pt: 'Trilha do pipeline', en: 'Pipeline track', es: 'Ruta del pipeline' },
  helpClima: { pt: 'Clima & ambiente', en: 'Climate & environment', es: 'Clima y ambiente' },
  helpThematic: { pt: 'Tutoriais temáticos', en: 'Thematic tutorials', es: 'Tutoriales temáticos' },
  helpCaseStudies: { pt: 'Estudos de caso', en: 'Case studies', es: 'Estudios de caso' },
  helpModeling: { pt: 'Modelagem', en: 'Modeling', es: 'Modelado' },
  helpRap: { pt: 'RAP reprodutível', en: 'Reproducible RAP', es: 'RAP reproducible' },
  helpLoadTemplate: { pt: 'Carregar', en: 'Load', es: 'Cargar' },
  helpViewTutorial: { pt: 'Ver tutorial ↗', en: 'View tutorial ↗', es: 'Ver tutorial ↗' },
  guidedTutorial: { pt: '🎓 Tutorial guiado (offline)', en: '🎓 Guided tutorial (offline)', es: '🎓 Tutorial guiado (offline)' },
  close: { pt: 'Fechar', en: 'Close', es: 'Cerrar' },
  // Project file IO
  saveProject: { pt: '💾 Salvar projeto', en: '💾 Save project', es: '💾 Guardar proyecto' },
  openProject: { pt: '📂 Abrir projeto', en: '📂 Open project', es: '📂 Abrir proyecto' },
  openData: { pt: '📥 Importar dados', en: '📥 Import data', es: '📥 Importar datos' },
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
  rap: {
    pt: 'RAP', en: 'RAP', es: 'RAP',
    sub: {
      pt: 'Pipelines analíticos reprodutíveis (sus_rap_*)',
      en: 'Reproducible analytical pipelines (sus_rap_*)',
      es: 'Pipelines analíticos reproducibles (sus_rap_*)',
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
