import type { Lang } from '../store/pipeline'

export interface TutorialStepDef {
  fn: string
  values: Record<string, string>
  explain: Record<Lang, string>
}

export interface TutorialDef {
  id: string
  title: Record<Lang, string>
  steps: TutorialStepDef[]
}

// 100% offline — uses a small Parquet bundled with climasus+ (São Paulo, 2014-2019),
// resolved via CLIMASUS_RESOURCE_DIR so it works in dev and inside the Tauri app.
// The file is pre-filtered to respiratory deaths to keep the bundle light, while the guided
// pipeline still walks through cleaning, standardisation, age filtering, aggregation and plots.
export const RESPIRATORIO_SP: TutorialDef = {
  id: 'respiratorio-sp',
  title: {
    pt: 'Mortalidade Respiratória — SP 2014-2019',
    en: 'Respiratory Mortality — SP 2014-2019',
    es: 'Mortalidad Respiratoria — SP 2014-2019',
  },
  steps: [
    {
      fn: 'sus_data_read',
      values: { path: 'file.path(Sys.getenv("CLIMASUS_RESOURCE_DIR", "."), "engine", "testdata", "sim_do_sp_2014_2019_respiratory.parquet")' },
      explain: {
        pt: 'Lemos óbitos respiratórios do SIM (Sistema de Informação sobre Mortalidade) para São Paulo, 2014-2019. O arquivo é um Parquet leve incluído no climasus+, então o tutorial roda sem baixar dados durante a execução.',
        en: 'We read respiratory deaths from SIM (Mortality Information System) for São Paulo, 2014-2019. The file is a lightweight Parquet bundled with climasus+, so the tutorial runs without downloading data during execution.',
        es: 'Leemos óbitos respiratorios del SIM (Sistema de Información sobre Mortalidad) para São Paulo, 2014-2019. El archivo es un Parquet liviano incluido en climasus+, así que el tutorial funciona sin descargar datos durante la ejecución.',
      },
    },
    {
      fn: 'sus_data_clean_encoding',
      values: {},
      explain: {
        pt: 'Corrigimos problemas de acentuação/encoding comuns em exportações do DATASUS (ex.: "São Paulo" lido incorretamente como Latin-1).',
        en: 'We fix common encoding issues from DATASUS exports (e.g. "São Paulo" misread as Latin-1).',
        es: 'Corregimos problemas comunes de codificación en las exportaciones de DATASUS (ej.: "São Paulo" leído incorrectamente como Latin-1).',
      },
    },
    {
      fn: 'sus_data_standardize',
      values: {},
      explain: {
        pt: 'Padronizamos nomes de colunas e valores para o vocabulário comum do climasus4r, preparando os dados para as próximas etapas.',
        en: 'We standardize column names and values into climasus4r\'s common vocabulary, preparing the data for the next steps.',
        es: 'Estandarizamos nombres de columnas y valores al vocabulario común de climasus4r, preparando los datos para los siguientes pasos.',
      },
    },
    {
      fn: 'sus_data_filter_cid',
      values: { disease_group: 'respiratory' },
      explain: {
        pt: 'Garantimos o recorte de causas respiratórias (CID-10 capítulo J), o foco desta análise e do estudo de caso pediátrico.',
        en: 'We ensure the respiratory-cause subset (ICD-10 chapter J), the focus of this analysis and of the pediatric case study.',
        es: 'Garantizamos el recorte de causas respiratorias (CIE-10 capítulo J), el foco de este análisis y del estudio de caso pediátrico.',
      },
    },
    {
      fn: 'sus_data_create_variables',
      values: {
        create_age_groups: 'TRUE',
        age_breaks: 'c(0, 5, 15, 60, Inf)',
        create_calendar_vars: 'TRUE',
      },
      explain: {
        pt: 'Criamos faixas etárias (0–4, 5–14, 15–59, 60+) e variáveis de calendário (mês, dia da semana), que serão úteis para agregar e visualizar a série temporal.',
        en: 'We create age groups (0–4, 5–14, 15–59, 60+) and calendar variables (month, weekday), useful for aggregating and visualizing the time series.',
        es: 'Creamos grupos de edad (0–4, 5–14, 15–59, 60+) y variables de calendario (mes, día de la semana), útiles para agregar y visualizar la serie temporal.',
      },
    },
    {
      fn: 'sus_data_filter_demographics',
      values: { age_range: 'c(0, 5)' },
      explain: {
        pt: 'Focamos em crianças menores de 5 anos — o grupo de maior risco para mortalidade respiratória aguda, replicando o recorte do estudo de caso pediátrico.',
        en: 'We focus on children under 5 — the highest-risk group for acute respiratory mortality, replicating the pediatric case study\'s scope.',
        es: 'Nos enfocamos en niños menores de 5 años — el grupo de mayor riesgo de mortalidad respiratoria aguda, replicando el alcance del estudio de caso pediátrico.',
      },
    },
    {
      fn: 'sus_data_aggregate',
      values: { time_unit: 'month', group_by: 'codigo_municipio_residencia' },
      explain: {
        pt: 'Agregamos os óbitos filtrados por mês e município de residência. Esse formato serve tanto para visualizar a série temporal quanto para mapear a distribuição municipal.',
        en: 'We aggregate the filtered deaths by month and municipality of residence. This format supports both time-series visualization and municipal mapping.',
        es: 'Agregamos los óbitos filtrados por mes y municipio de residencia. Este formato sirve tanto para visualizar la serie temporal como para mapear la distribución municipal.',
      },
    },
    {
      fn: 'sus_data_plot_aggregate_ts',
      values: { plot_type: 'heatmap', city: 'São Paulo' },
      explain: {
        pt: 'Visualizamos a série temporal da capital em formato de mapa de calor. Repare como o recorte mensal ajuda a investigar sazonalidade e anos com maior concentração de eventos.',
        en: 'We visualize the capital city time series as a heatmap. Notice how the monthly view helps investigate seasonality and years with higher event concentration.',
        es: 'Visualizamos la serie temporal de la capital como mapa de calor. Observe cómo el recorte mensual ayuda a investigar estacionalidad y años con mayor concentración de eventos.',
      },
    },
    {
      fn: 'sus_data_plot_aggregate_map',
      values: { map_type: 'bubble', top_n: '20', show_labels: 'FALSE' },
      explain: {
        pt: 'Também mapeamos os dados agregados por município. O mapa mostra onde os óbitos respiratórios pediátricos se concentram no estado de São Paulo ao longo de 2014-2019.',
        en: 'We also map the aggregated data by municipality. The map shows where pediatric respiratory deaths concentrate across São Paulo state during 2014-2019.',
        es: 'También mapeamos los datos agregados por municipio. El mapa muestra dónde se concentran los óbitos respiratorios pediátricos en el estado de São Paulo durante 2014-2019.',
      },
    },
  ],
}

export const TUTORIALS: TutorialDef[] = [RESPIRATORIO_SP]
