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

// 100% offline — uses the climasus4r package's own bundled sample data (Rondônia, 2022),
// resolved via system.file() so it works regardless of where R is installed (dev machine or
// the Tauri-embedded runtime). Mirrors the package's own "respiratory mortality" case study,
// simplified to steps that are guaranteed to run without a network connection.
export const RESPIRATORIO_RO: TutorialDef = {
  id: 'respiratorio-ro',
  title: {
    pt: 'Mortalidade Respiratória — RO 2022',
    en: 'Respiratory Mortality — RO 2022',
    es: 'Mortalidad Respiratoria — RO 2022',
  },
  steps: [
    {
      fn: 'sus_data_read',
      values: { path: 'system.file("testdata/sim/SIM_DO_RO_2022.parquet", package = "climasus4r")' },
      explain: {
        pt: 'Lemos os óbitos do SIM (Sistema de Informação sobre Mortalidade) de Rondônia em 2022 — um conjunto de teste que já vem junto com o climasus4r, então este tutorial roda sem precisar baixar nada do DATASUS.',
        en: 'We read SIM (Mortality Information System) deaths for Rondônia, 2022 — a sample dataset shipped inside climasus4r itself, so this tutorial runs without downloading anything from DATASUS.',
        es: 'Leemos los óbitos del SIM (Sistema de Información sobre Mortalidad) de Rondônia en 2022 — un conjunto de prueba que ya viene con climasus4r, así que este tutorial funciona sin descargar nada de DATASUS.',
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
        pt: 'Filtramos apenas óbitos por causas respiratórias (CID-10 capítulo J), o foco desta análise — mesmo critério usado no estudo de caso "mortalidade respiratória pediátrica" do pacote.',
        en: 'We filter to respiratory-cause deaths only (ICD-10 chapter J), the focus of this analysis — the same criterion used in the package\'s "pediatric respiratory mortality" case study.',
        es: 'Filtramos solo óbitos por causas respiratorias (CIE-10 capítulo J), el foco de este análisis — el mismo criterio usado en el estudio de caso "mortalidad respiratoria pediátrica" del paquete.',
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
      values: { time_unit: 'month' },
      explain: {
        pt: 'Agregamos os óbitos filtrados em uma série mensal — a granularidade padrão para detectar sazonalidade em mortalidade respiratória.',
        en: 'We aggregate the filtered deaths into a monthly series — the standard granularity for detecting seasonality in respiratory mortality.',
        es: 'Agregamos los óbitos filtrados en una serie mensual — la granularidad estándar para detectar estacionalidad en la mortalidad respiratoria.',
      },
    },
    {
      fn: 'sus_data_plot_aggregate_ts',
      values: {},
      explain: {
        pt: 'Por fim, visualizamos a série temporal. Repare no padrão sazonal — mortalidade respiratória infantil tende a subir nos meses mais frios/secos do ano. Use o botão "Interativo" para explorar o gráfico.',
        en: 'Finally, we visualize the time series. Notice the seasonal pattern — pediatric respiratory mortality tends to rise in the colder/drier months. Use the "Interactive" button to explore the chart.',
        es: 'Por último, visualizamos la serie temporal. Note el patrón estacional — la mortalidad respiratoria infantil tiende a subir en los meses más fríos/secos del año. Use el botón "Interactivo" para explorar el gráfico.',
      },
    },
  ],
}

export const TUTORIALS: TutorialDef[] = [RESPIRATORIO_RO]
