import type { Lang } from '../store/pipeline'
import { byName } from '../catalog'

// A pipeline template is a ready-made sequence of steps loaded into the graph as an editable
// starting point. Unlike a guided TutorialDef it carries no per-step narration and is not
// guaranteed to run offline — the case studies below start from sus_data_import() (live DATASUS),
// so the user is expected to adjust args (uf/year/…) before running. Mirrors the climasus4r
// vignettes (vignettes-pt/ec-*.Rmd). All `fn` names are validated against the catalog at load.
export type TemplateCategory = 'pipeline' | 'clima' | 'tematico' | 'caso' | 'modelagem' | 'rap'

export interface PipelineTemplate {
  id: string
  category: TemplateCategory
  title: Record<Lang, string>
  description: Record<Lang, string>
  steps: { fn: string; values: Record<string, string> }[]
  vignetteUrl?: string
}

const PKGDOWN = 'https://climasus.github.io/climasus4r/articles'

export const TEMPLATES: PipelineTemplate[] = [
  // --- Trilha do Pipeline em 9 etapas ------------------------------------------
  {
    id: 'pipeline-importacao-saude',
    category: 'pipeline',
    title: {
      pt: 'Etapa 1: importar dados de saúde',
      en: 'Step 1: import health data',
      es: 'Etapa 1: importar datos de salud',
    },
    description: {
      pt: 'Começa pela base do fluxo: baixa dados do DATASUS para uma UF e período, pronto para limpar e padronizar.',
      en: 'Starts from the foundation: downloads DATASUS data for a state and period, ready for cleaning and standardisation.',
      es: 'Empieza por la base: descarga datos DATASUS para una UF y periodo, listo para limpieza y estandarización.',
    },
    vignetteUrl: `${PKGDOWN}/01-importacao.html`,
    steps: [
      { fn: 'sus_data_import', values: { system: 'SIM-DO', uf: '"SP"', year: '2020:2022' } },
    ],
  },
  {
    id: 'pipeline-preparacao-basica',
    category: 'pipeline',
    title: {
      pt: 'Etapas 2-4: limpar, filtrar e agregar',
      en: 'Steps 2-4: clean, filter and aggregate',
      es: 'Etapas 2-4: limpiar, filtrar y agregar',
    },
    description: {
      pt: 'Fluxo essencial de preparação: encoding, padronização, seleção CID/demográfica, variáveis derivadas e agregação temporal.',
      en: 'Essential preparation flow: encoding, standardisation, ICD/demographic selection, derived variables and temporal aggregation.',
      es: 'Flujo esencial de preparación: codificación, estandarización, selección CIE/demográfica, variables derivadas y agregación temporal.',
    },
    vignetteUrl: `${PKGDOWN}/04-variaveis-agregacao.html`,
    steps: [
      { fn: 'sus_data_import', values: { system: 'SIM-DO', uf: '"SP"', year: '2020:2022' } },
      { fn: 'sus_data_clean_encoding', values: {} },
      { fn: 'sus_data_standardize', values: {} },
      { fn: 'sus_data_filter_cid', values: { disease_group: 'respiratory' } },
      { fn: 'sus_data_create_variables', values: { create_calendar_vars: 'TRUE' } },
      { fn: 'sus_data_aggregate', values: { time_unit: 'month' } },
    ],
  },
  {
    id: 'pipeline-qualidade-visualizacao',
    category: 'pipeline',
    title: {
      pt: 'Qualidade e visualização da série agregada',
      en: 'Quality and visualisation of aggregated series',
      es: 'Calidad y visualización de la serie agregada',
    },
    description: {
      pt: 'Depois da agregação, gera checagens de qualidade e gráficos rápidos para validar série temporal e distribuição espacial.',
      en: 'After aggregation, generates quality checks and quick plots to validate the time series and spatial distribution.',
      es: 'Después de agregar, genera controles de calidad y gráficos rápidos para validar la serie temporal y distribución espacial.',
    },
    vignetteUrl: `${PKGDOWN}/09-modelagem.html`,
    steps: [
      { fn: 'sus_data_read', values: { path: 'dados_agregados.parquet' } },
      { fn: 'sus_data_ts_quality', values: {} },
      { fn: 'sus_data_plot_aggregate_ts', values: {} },
      { fn: 'sus_data_plot_aggregate_map', values: {} },
    ],
  },
  // --- Clima & ambiente: obtenção simples de dados ------------------------------
  {
    id: 'clima-inmet',
    category: 'clima',
    title: {
      pt: 'Clima de estações (INMET)',
      en: 'Station climate (INMET)',
      es: 'Clima de estaciones (INMET)',
    },
    description: {
      pt: 'Baixa séries diárias das estações automáticas do INMET (temperatura, umidade, precipitação) para os anos e UFs escolhidos.',
      en: 'Downloads daily series from INMET automatic stations (temperature, humidity, precipitation) for the chosen years and states.',
      es: 'Descarga series diarias de las estaciones automáticas del INMET (temperatura, humedad, precipitación) para los años y estados elegidos.',
    },
    vignetteUrl: `${PKGDOWN}/07-clima-estacoes.html`,
    steps: [
      { fn: 'sus_climate_inmet', values: { years: '2018:2022', uf: '"SP"' } },
    ],
  },
  {
    id: 'clima-normais',
    category: 'clima',
    title: {
      pt: 'Normais climatológicas (1991–2020)',
      en: 'Climatological normals (1991–2020)',
      es: 'Normales climatológicas (1991–2020)',
    },
    description: {
      pt: 'Obtém as normais climatológicas do INMET para uso como linha de base — por exemplo no cálculo de anomalias.',
      en: 'Fetches INMET climatological normals to use as a baseline — e.g. for anomaly computation.',
      es: 'Obtiene las normales climatológicas del INMET para usarlas como línea de base — p. ej. en el cálculo de anomalías.',
    },
    vignetteUrl: `${PKGDOWN}/07-clima-estacoes.html`,
    steps: [
      { fn: 'sus_climate_normals', values: { period: '1991-2020' } },
    ],
  },
  {
    id: 'grid-chirps',
    category: 'clima',
    title: {
      pt: 'Precipitação em grade (CHIRPS)',
      en: 'Gridded precipitation (CHIRPS)',
      es: 'Precipitación en rejilla (CHIRPS)',
    },
    description: {
      pt: 'Extrai precipitação mensal em grade (CHIRPS) agregada por município — cobertura nacional, sem depender de estações.',
      en: 'Extracts monthly gridded precipitation (CHIRPS) aggregated by municipality — national coverage, no station dependency.',
      es: 'Extrae precipitación mensual en rejilla (CHIRPS) agregada por municipio — cobertura nacional, sin depender de estaciones.',
    },
    vignetteUrl: `${PKGDOWN}/08-clima-grade.html`,
    steps: [
      { fn: 'sus_grid_chirps', values: { resolution: 'monthly', years: '2018:2022' } },
    ],
  },
  {
    id: 'grid-era5',
    category: 'clima',
    title: {
      pt: 'Temperatura e precipitação em grade (ERA5)',
      en: 'Gridded temperature and precipitation (ERA5)',
      es: 'Temperatura y precipitación en rejilla (ERA5)',
    },
    description: {
      pt: 'Obtém temperatura e precipitação da reanálise ERA5 por município, para os anos escolhidos.',
      en: 'Fetches temperature and precipitation from the ERA5 reanalysis by municipality, for the chosen years.',
      es: 'Obtiene temperatura y precipitación del reanálisis ERA5 por municipio, para los años elegidos.',
    },
    vignetteUrl: `${PKGDOWN}/08-clima-grade.html`,
    steps: [
      { fn: 'sus_grid_era5', values: { years: '2018:2022', vars: 'c("t2m","tp")' } },
    ],
  },
  {
    id: 'grid-poluicao-pm25',
    category: 'clima',
    title: {
      pt: 'Poluição do ar PM2.5 (CAMS)',
      en: 'Air pollution PM2.5 (CAMS)',
      es: 'Contaminación del aire PM2.5 (CAMS)',
    },
    description: {
      pt: 'Baixa material particulado fino (PM2.5) e grosso (PM10) da reanálise CAMS para os anos escolhidos.',
      en: 'Downloads fine (PM2.5) and coarse (PM10) particulate matter from the CAMS reanalysis for the chosen years.',
      es: 'Descarga material particulado fino (PM2.5) y grueso (PM10) del reanálisis CAMS para los años elegidos.',
    },
    vignetteUrl: `${PKGDOWN}/08-clima-grade.html`,
    steps: [
      { fn: 'sus_grid_pollution_cams', values: { pollutants: 'c("pm25","pm10")', years: '2018:2022' } },
    ],
  },
  {
    id: 'grid-queimadas',
    category: 'clima',
    title: {
      pt: 'Focos de queimadas (INPE/FIRMS)',
      en: 'Fire hotspots (INPE/FIRMS)',
      es: 'Focos de incendios (INPE/FIRMS)',
    },
    description: {
      pt: 'Obtém a contagem de focos de queimada por município a partir do INPE (ou FIRMS/NASA), útil como proxy de fumaça/poluição.',
      en: 'Fetches fire-hotspot counts by municipality from INPE (or FIRMS/NASA), useful as a smoke/pollution proxy.',
      es: 'Obtiene el conteo de focos de incendio por municipio desde INPE (o FIRMS/NASA), útil como proxy de humo/contaminación.',
    },
    vignetteUrl: `${PKGDOWN}/08-clima-grade.html`,
    steps: [
      { fn: 'sus_grid_fires', values: { years: '2018:2022', source: 'inpe' } },
    ],
  },
  {
    id: 'clima-aggregate-exposicao',
    category: 'clima',
    title: {
      pt: 'Exposição saúde × clima (sus_climate_aggregate)',
      en: 'Health × climate exposure (sus_climate_aggregate)',
      es: 'Exposición salud × clima (sus_climate_aggregate)',
    },
    description: {
      pt: 'O passo-chave de integração: casa a série de saúde agregada com o clima das estações usando janelas móveis de exposição (temperatura, 7 dias), pronto para modelagem. Ajuste climate_data/janela conforme seu estudo.',
      en: 'The key integration step: matches the aggregated health series with station climate using moving exposure windows (temperature, 7 days), ready for modelling. Adjust climate_data/window for your study.',
      es: 'El paso clave de integración: une la serie de salud agregada con el clima de estaciones usando ventanas móviles de exposición (temperatura, 7 días), listo para modelar. Ajuste climate_data/ventana según su estudio.',
    },
    vignetteUrl: `${PKGDOWN}/07-clima-estacoes.html`,
    steps: [
      { fn: 'sus_climate_inmet', values: { years: '2015:2019', uf: '"SP"' } },
      { fn: 'sus_data_read', values: { path: 'obitos_mensais.parquet' } },
      { fn: 'sus_climate_aggregate', values: { climate_data: 'clima', climate_var: 'tair_dry_bulb_c', time_unit: 'month', temporal_strategy: 'moving_window', window_days: '7' } },
      { fn: 'sus_climate_plot_aggregate', values: { plot_type: 'timeseries' } },
    ],
  },
  // --- Tutoriais temáticos ------------------------------------------------------
  {
    id: 'tematico-indices-bioclimaticos',
    category: 'tematico',
    title: {
      pt: 'Índices bioclimáticos para saúde pública',
      en: 'Bioclimatic indicators for public health',
      es: 'Índices bioclimáticos para salud pública',
    },
    description: {
      pt: 'Calcula indicadores como UTCI, WBGT e índice de calor a partir de séries INMET para estudos de estresse térmico.',
      en: 'Computes indicators such as UTCI, WBGT and heat index from INMET series for thermal-stress studies.',
      es: 'Calcula indicadores como UTCI, WBGT e índice de calor desde series INMET para estudios de estrés térmico.',
    },
    vignetteUrl: `${PKGDOWN}/climate_indicators.html`,
    steps: [
      { fn: 'sus_climate_inmet', values: { years: '2018:2022', uf: '"SP"' } },
      { fn: 'sus_climate_compute_indicators', values: {} },
    ],
  },
  {
    id: 'tematico-ondas-calor',
    category: 'tematico',
    title: {
      pt: 'Ondas de calor: detectar e visualizar',
      en: 'Heatwaves: detect and visualise',
      es: 'Olas de calor: detectar y visualizar',
    },
    description: {
      pt: 'Pipeline INMET -> indicadores -> detecção de ondas de calor por método e visualização dos eventos.',
      en: 'INMET -> indicators -> heatwave detection by method and event visualisation.',
      es: 'INMET -> indicadores -> detección de olas de calor por método y visualización de eventos.',
    },
    vignetteUrl: `${PKGDOWN}/ondas_de_calor.html`,
    steps: [
      { fn: 'sus_climate_inmet', values: { years: '2010:2023', uf: '"RS"' } },
      { fn: 'sus_climate_compute_indicators', values: {} },
      { fn: 'sus_climate_compute_heatwaves', values: { method: 'WHO', percentile: '90' } },
      { fn: 'sus_climate_plot_heatwaves', values: {} },
    ],
  },
  {
    id: 'tematico-ondas-frio',
    category: 'tematico',
    title: {
      pt: 'Ondas de frio: detectar e visualizar',
      en: 'Cold waves: detect and visualise',
      es: 'Olas de frío: detectar y visualizar',
    },
    description: {
      pt: 'Usa séries climáticas e indicadores térmicos para identificar eventos de frio e produzir gráficos de acompanhamento.',
      en: 'Uses climate series and thermal indicators to identify cold events and produce monitoring plots.',
      es: 'Usa series climáticas e indicadores térmicos para identificar eventos de frío y producir gráficos de seguimiento.',
    },
    vignetteUrl: `${PKGDOWN}/ondas_de_frio.html`,
    steps: [
      { fn: 'sus_climate_inmet', values: { years: '2010:2023', uf: '"RS"' } },
      { fn: 'sus_climate_compute_indicators', values: {} },
      { fn: 'sus_climate_compute_coldwaves', values: { method: 'WHO', percentile: '10' } },
      { fn: 'sus_climate_plot_coldwaves', values: {} },
    ],
  },
  // --- Estudos de caso: pipelines completos ponta-a-ponta -----------------------
  {
    id: 'ec-01-respiratorio-pediatrico',
    category: 'caso',
    title: {
      pt: 'Mortalidade respiratória pediátrica e temperatura (Sudeste)',
      en: 'Pediatric respiratory mortality and temperature (Southeast)',
      es: 'Mortalidad respiratoria pediátrica y temperatura (Sudeste)',
    },
    description: {
      pt: 'Óbitos respiratórios (CID-10 cap. J) em menores de 5 anos vs. temperatura das estações INMET, com modelo DLNM e fração atribuível.',
      en: 'Respiratory deaths (ICD-10 ch. J) in under-5s vs. INMET station temperature, with a DLNM model and attributable fraction.',
      es: 'Óbitos respiratorios (CIE-10 cap. J) en menores de 5 años vs. temperatura de estaciones INMET, con modelo DLNM y fracción atribuible.',
    },
    vignetteUrl: `${PKGDOWN}/ec-01-respiratorio-pediatrico.html`,
    steps: [
      { fn: 'sus_data_import', values: { system: 'SIM-DO', uf: 'c("SP","RJ","MG","ES")', year: '2015:2019' } },
      { fn: 'sus_data_clean_encoding', values: {} },
      { fn: 'sus_data_standardize', values: {} },
      { fn: 'sus_data_filter_cid', values: { disease_group: 'respiratory' } },
      { fn: 'sus_data_create_variables', values: { create_age_groups: 'TRUE', age_breaks: 'c(0, 5, 15, 60, Inf)', create_calendar_vars: 'TRUE' } },
      { fn: 'sus_data_filter_demographics', values: { age_range: 'c(0, 5)' } },
      { fn: 'sus_data_aggregate', values: { time_unit: 'month' } },
      { fn: 'sus_climate_inmet', values: { years: '2015:2019', uf: 'c("SP","RJ","MG","ES")' } },
      { fn: 'sus_climate_aggregate', values: { time_unit: 'month' } },
      { fn: 'sus_mod_dlnm', values: { outcome_col: 'n_obitos' } },
      { fn: 'sus_mod_plot_dlnm', values: {} },
      { fn: 'sus_mod_af', values: {} },
    ],
  },
  {
    id: 'ec-02-dengue-clima',
    category: 'caso',
    title: {
      pt: 'Dengue, precipitação e temperatura (Nordeste)',
      en: 'Dengue, precipitation and temperature (Northeast)',
      es: 'Dengue, precipitación y temperatura (Nordeste)',
    },
    description: {
      pt: 'Casos de dengue (SINAN) vs. precipitação (CHIRPS em grade), agregação semanal e DLNM.',
      en: 'Dengue cases (SINAN) vs. precipitation (gridded CHIRPS), weekly aggregation and DLNM.',
      es: 'Casos de dengue (SINAN) vs. precipitación (CHIRPS en rejilla), agregación semanal y DLNM.',
    },
    vignetteUrl: `${PKGDOWN}/ec-02-dengue-clima.html`,
    steps: [
      { fn: 'sus_data_import', values: { system: 'SINAN-DENGUE', region: 'nordeste', year: '2015:2019' } },
      { fn: 'sus_data_clean_encoding', values: {} },
      { fn: 'sus_data_standardize', values: {} },
      { fn: 'sus_data_filter_cid', values: { disease_group: 'dengue' } },
      { fn: 'sus_data_create_variables', values: { create_calendar_vars: 'TRUE' } },
      { fn: 'sus_data_aggregate', values: { time_unit: 'week' } },
      { fn: 'sus_grid_chirps', values: { resolution: 'monthly', years: '2015:2019' } },
      { fn: 'sus_grid_join', values: {} },
      { fn: 'sus_mod_dlnm', values: { outcome_col: 'n_dengue' } },
      { fn: 'sus_mod_plot_dlnm', values: {} },
    ],
  },
  {
    id: 'ec-03-cardio-idosos-calor',
    category: 'caso',
    title: {
      pt: 'Mortalidade cardiovascular em idosos e ondas de calor (SP)',
      en: 'Cardiovascular mortality in the elderly and heatwaves (SP)',
      es: 'Mortalidad cardiovascular en ancianos y olas de calor (SP)',
    },
    description: {
      pt: 'Óbitos cardiovasculares (CID-10 cap. I) em idosos (60+) e detecção de ondas de calor, com DLNM e carga atribuível.',
      en: 'Cardiovascular deaths (ICD-10 ch. I) in the elderly (60+) with heatwave detection, DLNM and attributable burden.',
      es: 'Óbitos cardiovasculares (CIE-10 cap. I) en ancianos (60+) con detección de olas de calor, DLNM y carga atribuible.',
    },
    vignetteUrl: `${PKGDOWN}/ec-03-cardio-idosos-calor.html`,
    steps: [
      { fn: 'sus_data_import', values: { system: 'SIM-DO', uf: '"SP"', year: '2010:2019' } },
      { fn: 'sus_data_clean_encoding', values: {} },
      { fn: 'sus_data_standardize', values: {} },
      { fn: 'sus_data_filter_cid', values: { icd_codes: 'I', match_type: 'chapter' } },
      { fn: 'sus_data_create_variables', values: { create_age_groups: 'TRUE', age_breaks: 'c(0, 60, Inf)' } },
      { fn: 'sus_data_filter_demographics', values: { age_range: 'c(60, Inf)' } },
      { fn: 'sus_data_aggregate', values: { time_unit: 'day' } },
      { fn: 'sus_climate_inmet', values: { years: '2010:2019', uf: '"SP"' } },
      { fn: 'sus_climate_compute_heatwaves', values: { method: 'WHO', percentile: '90' } },
      { fn: 'sus_mod_dlnm', values: { outcome_col: 'n_obitos' } },
      { fn: 'sus_mod_af', values: {} },
      { fn: 'sus_mod_plot_af', values: {} },
    ],
  },
  {
    id: 'ec-04-hospitalizacoes-frio',
    category: 'caso',
    title: {
      pt: 'Hospitalizações respiratórias e ondas de frio (Sul)',
      en: 'Respiratory hospitalizations and cold waves (South)',
      es: 'Hospitalizaciones respiratorias y olas de frío (Sur)',
    },
    description: {
      pt: 'Internações respiratórias (SIH) vs. ondas de frio, com série temporal interrompida (ITS).',
      en: 'Respiratory hospitalizations (SIH) vs. cold waves, with interrupted time series (ITS).',
      es: 'Internaciones respiratorias (SIH) vs. olas de frío, con serie temporal interrumpida (ITS).',
    },
    vignetteUrl: `${PKGDOWN}/ec-04-hospitalizacoes-frio.html`,
    steps: [
      { fn: 'sus_data_import', values: { system: 'SIH-RD', region: 'sul', year: '2010:2019' } },
      { fn: 'sus_data_clean_encoding', values: {} },
      { fn: 'sus_data_standardize', values: {} },
      { fn: 'sus_data_filter_cid', values: { icd_codes: 'J09-J18', match_type: 'range' } },
      { fn: 'sus_data_create_variables', values: { create_calendar_vars: 'TRUE' } },
      { fn: 'sus_data_aggregate', values: { time_unit: 'day' } },
      { fn: 'sus_climate_inmet', values: { years: '2010:2019' } },
      { fn: 'sus_climate_compute_coldwaves', values: { method: 'WHO', percentile: '10' } },
      { fn: 'sus_mod_its', values: {} },
    ],
  },
  {
    id: 'mod-dlnm',
    category: 'modelagem',
    title: {
      pt: 'Modelagem DLNM a partir de dados preparados',
      en: 'DLNM modelling from prepared data',
      es: 'Modelado DLNM a partir de datos preparados',
    },
    description: {
      pt: 'Trecho de modelagem: lê uma tabela já agregada (série saúde + clima) e ajusta DLNM, gráfico exposição-resposta e fração atribuível.',
      en: 'Modelling snippet: reads an already-aggregated table (health + climate series) and fits DLNM, exposure–response plot and attributable fraction.',
      es: 'Fragmento de modelado: lee una tabla ya agregada (serie salud + clima) y ajusta DLNM, gráfico exposición-respuesta y fracción atribuible.',
    },
    vignetteUrl: `${PKGDOWN}/mod-01-dlnm.html`,
    steps: [
      { fn: 'sus_data_read', values: { path: 'dados_preparados.parquet' } },
      { fn: 'sus_mod_dlnm', values: { outcome_col: 'n_obitos' } },
      { fn: 'sus_mod_plot_dlnm', values: {} },
      { fn: 'sus_mod_af', values: {} },
      { fn: 'sus_mod_plot_af', values: {} },
    ],
  },
  {
    id: 'mod-espacial-bayes',
    category: 'modelagem',
    title: {
      pt: 'Modelo Bayesiano espacial (por município)',
      en: 'Spatial Bayesian model (by municipality)',
      es: 'Modelo Bayesiano espacial (por municipio)',
    },
    description: {
      pt: 'Trecho de modelagem espacial: lê contagens por município, monta a matriz de vizinhança e ajusta um modelo Bayesiano espacial (BYM).',
      en: 'Spatial modelling snippet: reads municipality counts, builds the neighbourhood matrix and fits a spatial Bayesian (BYM) model.',
      es: 'Fragmento de modelado espacial: lee conteos por municipio, arma la matriz de vecindad y ajusta un modelo Bayesiano espacial (BYM).',
    },
    vignetteUrl: `${PKGDOWN}/mod-07-bayes.html`,
    steps: [
      { fn: 'sus_data_read', values: { path: 'contagens_municipio.parquet' } },
      { fn: 'sus_mod_spatial_weights', values: {} },
      { fn: 'sus_mod_spatial_bayes', values: {} },
      { fn: 'sus_mod_plot_spatial_bayes', values: {} },
    ],
  },
  {
    id: 'mod-casecrossover-its',
    category: 'modelagem',
    title: {
      pt: 'Case-crossover e série temporal interrompida',
      en: 'Case-crossover and interrupted time series',
      es: 'Case-crossover y serie temporal interrumpida',
    },
    description: {
      pt: 'Dois desenhos quase-experimentais para séries preparadas: exposição aguda por case-crossover e avaliação de intervenção/evento por ITS.',
      en: 'Two quasi-experimental designs for prepared series: acute exposure via case-crossover and intervention/event evaluation via ITS.',
      es: 'Dos diseños cuasi-experimentales para series preparadas: exposición aguda por case-crossover y evaluación de intervención/evento por ITS.',
    },
    vignetteUrl: `${PKGDOWN}/mod-03-crossover-its.html`,
    steps: [
      { fn: 'sus_data_read', values: { path: 'serie_clima_saude.parquet' } },
      { fn: 'sus_mod_casecrossover', values: {} },
      { fn: 'sus_mod_its', values: {} },
    ],
  },
  {
    id: 'mod-ml-predicao',
    category: 'modelagem',
    title: {
      pt: 'Machine learning para predição',
      en: 'Machine learning for prediction',
      es: 'Machine learning para predicción',
    },
    description: {
      pt: 'Treina um modelo preditivo com variáveis climáticas, ambientais e socioeconômicas e gera gráficos de desempenho/importância.',
      en: 'Trains a predictive model with climate, environmental and socioeconomic features and generates performance/importance plots.',
      es: 'Entrena un modelo predictivo con variables climáticas, ambientales y socioeconómicas y genera gráficos de desempeño/importancia.',
    },
    vignetteUrl: `${PKGDOWN}/mod-05-ml.html`,
    steps: [
      { fn: 'sus_data_read', values: { path: 'features_modelagem.parquet' } },
      { fn: 'sus_mod_ml', values: {} },
      { fn: 'sus_mod_plot_ml', values: {} },
    ],
  },
  {
    id: 'rap-exportar-executar',
    category: 'rap',
    title: {
      pt: 'RAP: exportar, ler, inspecionar e executar',
      en: 'RAP: export, read, inspect and run',
      es: 'RAP: exportar, leer, inspeccionar y ejecutar',
    },
    description: {
      pt: 'Transforma um pipeline em artefato reprodutível, recarrega o objeto RAP, inspeciona etapas e executa com parâmetros novos.',
      en: 'Turns a pipeline into a reproducible artifact, reloads the RAP object, inspects steps and runs it with new parameters.',
      es: 'Convierte un pipeline en artefacto reproducible, recarga el objeto RAP, inspecciona etapas y lo ejecuta con parámetros nuevos.',
    },
    vignetteUrl: `${PKGDOWN}/rap-01-exportar-executar.html`,
    steps: [
      { fn: 'sus_rap_export', values: {} },
      { fn: 'sus_rap_read', values: { path: 'analise_respiratoria_sp.R' } },
      { fn: 'sus_rap_inspect', values: {} },
      { fn: 'sus_rap_run', values: {} },
    ],
  },
  {
    id: 'rap-targets',
    category: 'rap',
    title: {
      pt: 'RAP: pipeline com targets',
      en: 'RAP: targets pipeline',
      es: 'RAP: pipeline con targets',
    },
    description: {
      pt: 'Gera um _targets.R para cache, paralelismo e reexecução seletiva de análises multiestado ou multiano.',
      en: 'Generates a _targets.R file for cache, parallelism and selective reruns of multi-state or multi-year analyses.',
      es: 'Genera un _targets.R para caché, paralelismo y reejecución selectiva de análisis multiestado o multianual.',
    },
    vignetteUrl: `${PKGDOWN}/rap-02-targets.html`,
    steps: [
      { fn: 'sus_rap_read', values: { path: 'analise_respiratoria_sp.R' } },
      { fn: 'sus_rap_targets', values: {} },
      { fn: 'sus_rap_make', values: {} },
    ],
  },
  {
    id: 'rap-compartilhar-scaffold',
    category: 'rap',
    title: {
      pt: 'RAP: receita YAML e scaffolding',
      en: 'RAP: YAML recipe and scaffolding',
      es: 'RAP: receta YAML y scaffolding',
    },
    description: {
      pt: 'Compartilha pipelines como receita YAML, reimporta análises de colegas ou cria a estrutura completa de um novo projeto.',
      en: 'Shares pipelines as YAML recipes, reimports colleagues analyses or creates the full structure of a new project.',
      es: 'Comparte pipelines como receta YAML, reimporta análisis de colegas o crea la estructura completa de un nuevo proyecto.',
    },
    vignetteUrl: `${PKGDOWN}/rap-03-compartilhar.html`,
    steps: [
      { fn: 'sus_rap_recipe', values: {} },
      { fn: 'sus_rap_from_recipe', values: { path: 'receita.yaml' } },
      { fn: 'sus_rap_template', values: {} },
    ],
  },
]

// dev-only self-check: every template step references a real catalog function
if (import.meta.env.DEV) {
  const missing = TEMPLATES.flatMap((t) => t.steps.map((s) => s.fn)).filter((fn) => !byName.has(fn))
  if (missing.length) console.error('[templates] unknown fn(s):', [...new Set(missing)])
}
