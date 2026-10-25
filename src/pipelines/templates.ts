import type { Lang } from '../store/pipeline'
import { byName } from '../catalog'
import { stepRef } from '../store/pipeline'
import { CASE_TEMPLATES } from '../templates'

// A pipeline template is a ready-made sequence of steps loaded into the graph as an editable
// starting point. Unlike a guided TutorialDef it carries no per-step narration and is not
// guaranteed to run offline — the case studies below start from sus_data_import() (live DATASUS),
// so the user is expected to adjust args (uf/year/…) before running. Mirrors the climasus4r
// vignettes (vignettes-pt/ec-*.Rmd). All `fn` names are validated against the catalog at load.
export type TemplateCategory = 'pipeline' | 'clima' | 'tematico' | 'caso' | 'modelagem'

export interface PipelineTemplate {
  id: string
  category: TemplateCategory
  title: Record<Lang, string>
  description: Record<Lang, string>
  // `id` is only needed on steps another step points at via stepRef() (a 2nd data input)
  steps: { id?: string; fn: string; values: Record<string, string> }[]
  vignetteUrl?: string
}

const PKGDOWN = 'https://climasus.github.io/climasus4r/articles'

// the case studies reuse the guided tutorials' (verified-runnable) step lists, so the two can't drift
const caseSteps = (id: string) =>
  CASE_TEMPLATES.find((c) => c.id === id)!.steps.map(({ id, fn, values }) => ({ id, fn, values }))

// The preparation chain recommended for most DATASUS systems (SIM, SIH, SINASC, SIA, CNES),
// shown in the empty Pipeline panel as a one-click starting point. SINAN has no ICD column to
// filter on, so its variant drops sus_data_filter_cid.
export const PREP_SEQUENCE = [
  'sus_data_import',
  'sus_data_clean_encoding',
  'sus_data_standardize',
  'sus_data_filter_cid',
  'sus_data_create_variables',
  'sus_data_filter_demographics',
  'sus_data_aggregate',
]
export const PREP_SEQUENCE_CID_ONLY = 'sus_data_filter_cid'
export const PREP_SEQUENCE_SINAN = PREP_SEQUENCE.filter((fn) => fn !== PREP_SEQUENCE_CID_ONLY)

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
      pt: 'Começa pela base do fluxo: baixa dados do DATASUS para uma UF e período, pronto para limpar e padronizar. O exemplo usa 2015–2019 para evitar o período atípico da COVID-19.',
      en: 'Starts from the foundation: downloads DATASUS data for a state and period, ready for cleaning and standardisation. The example uses 2015–2019 to avoid the atypical COVID-19 period.',
      es: 'Empieza por la base: descarga datos DATASUS para una UF y periodo, listo para limpieza y estandarización. El ejemplo usa 2015–2019 para evitar el período atípico de la COVID-19.',
    },
    vignetteUrl: `${PKGDOWN}/01-importacao.html`,
    steps: [
      { fn: 'sus_data_import', values: { system: 'SIM-DO', uf: '"SP"', year: '2015:2019' } },
      { fn: 'sus_data_quality_report', values: {} },
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
      pt: 'Fluxo essencial de preparação: encoding, padronização, seleção CID, variáveis derivadas e agregação semanal por município — resolução compatível com desfechos agudos e com a integração clima–saúde.',
      en: 'Essential preparation flow: encoding, standardisation, ICD selection, derived variables and weekly aggregation by municipality — a resolution compatible with acute outcomes and climate–health integration.',
      es: 'Flujo esencial de preparación: codificación, estandarización, selección CIE, variables derivadas y agregación semanal por municipio.',
    },
    vignetteUrl: `${PKGDOWN}/04-variaveis-agregacao.html`,
    steps: [
      { fn: 'sus_data_import', values: { system: 'SIM-DO', uf: '"SP"', year: '2015:2019' } },
      { fn: 'sus_data_clean_encoding', values: {} },
      { fn: 'sus_data_standardize', values: {} },
      { fn: 'sus_data_filter_cid', values: { disease_group: 'respiratory' } },
      { fn: 'sus_data_create_variables', values: { create_calendar_vars: 'TRUE' } },
      { fn: 'sus_data_aggregate', values: { time_unit: 'week', group_by: 'codigo_municipio_residencia', complete_dates: 'TRUE' } },
      { fn: 'sus_data_quality_report', values: {} },
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
      pt: 'Depois da agregação, gera checagens de qualidade e gráficos rápidos para validar série temporal e distribuição espacial. Use uma tabela diária por município — `sus_data_ts_quality()` é desenhado para essa resolução.',
      en: 'After aggregation, generates quality checks and quick plots to validate the time series and spatial distribution. Use a daily table by municipality — `sus_data_ts_quality()` is designed for that resolution.',
      es: 'Después de agregar, genera controles de calidad y gráficos rápidos para validar la serie temporal y la distribución espacial. Use una tabla diaria por municipio.',
    },
    vignetteUrl: `${PKGDOWN}/09-modelagem.html`,
    steps: [
      { id: 'q-read', fn: 'sus_data_read', values: { path: '' } },
      // ts_quality returns a report list, not a table: pin both it and the plots to the table
      // so the report never replaces `dados` in the chain
      { fn: 'sus_data_quality_report', values: { df: stepRef('q-read') } },
      { fn: 'sus_data_ts_quality', values: { data: stepRef('q-read') } },
      { fn: 'sus_data_plot_aggregate_ts', values: { df: stepRef('q-read') } },
      { fn: 'sus_data_plot_aggregate_map', values: { df: stepRef('q-read') } },
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
      pt: 'Baixa séries diárias das estações automáticas do INMET (temperatura, umidade, precipitação) para os anos e UFs escolhidos. Confira a distância estação–município e as falhas antes de usar: o Studio não tem, hoje, um nó de preenchimento de falhas.',
      en: 'Downloads daily series from INMET automatic stations (temperature, humidity, precipitation) for the chosen years and states. Check station–municipality distance and gaps before use: the Studio currently has no gap-filling node.',
      es: 'Descarga series diarias de las estaciones automáticas del INMET (temperatura, humedad, precipitación) para los años y estados elegidos. Verifique la distancia estación–municipio y los vacíos.',
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
      pt: 'Obtém as normais climatológicas do INMET (1991–2020) para uso como linha de base — por exemplo no cálculo de anomalias. As normais são por estação e `var_code`; confira os códigos com `sus_climate_normals_meta()` antes de juntar com `sus_climate_inmet()`.',
      en: 'Fetches INMET climatological normals (1991–2020) to use as a baseline — e.g. for anomaly computation. Normals are by station and `var_code`; check the codes with `sus_climate_normals_meta()` before joining with `sus_climate_inmet()`.',
      es: 'Obtiene las normales climatológicas del INMET (1991–2020) para usarlas como línea de base. Las normales son por estación y `var_code`; verifique los códigos con `sus_climate_normals_meta()`.',
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
      pt: 'Extrai precipitação em grade (CHIRPS) agregada por município. O exemplo usa São Paulo e resolução mensal; para dengue, troque para `resolution = "daily"` e ajuste `municipalities` para a sua área (use `code_muni = "all"` para cobertura nacional).',
      en: 'Extracts gridded precipitation (CHIRPS) aggregated by municipality. The example uses São Paulo and monthly resolution; for dengue, switch to `resolution = "daily"` and adjust `municipalities` to your area (use `code_muni = "all"` for national coverage).',
      es: 'Extrae precipitación mensual en rejilla (CHIRPS) agregada por municipio. El ejemplo usa São Paulo; para dengue, use `resolution = "daily"`.',
    },
    vignetteUrl: `${PKGDOWN}/08-clima-grade.html`,
    steps: [
      { fn: 'sus_grid_chirps', values: { resolution: 'monthly', years: '2018:2022', municipalities: 'geobr::read_municipality(code_muni = "SP", year = 2020)' } },
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
      pt: 'Obtém temperatura e precipitação da reanálise ERA5 por município. O exemplo usa São Paulo e o padrão `c("t2m", "tp")`; para desfechos de calor, troque `vars` para `t2m_max` (máxima) e mantenha `t2m` (média) para ciclos de vetor. Resolução nativa ~0,25° (~31 km): declare a limitação.',
      en: 'Fetches temperature and precipitation from the ERA5 reanalysis by municipality. The example uses São Paulo and the default `c("t2m", "tp")`; for heat outcomes, switch `vars` to `t2m_max` (maximum) and keep `t2m` (mean) for vector cycles. Native resolution ~0.25° (~31 km): state the limitation.',
      es: 'Obtiene temperatura y precipitación del reanálisis ERA5 por municipio. El ejemplo usa São Paulo y el valor predeterminado `c("t2m", "tp")`; para calor, use `t2m_max`.',
    },
    vignetteUrl: `${PKGDOWN}/08-clima-grade.html`,
    steps: [
      { fn: 'sus_grid_era5', values: { years: '2018:2022', municipalities: 'geobr::read_municipality(code_muni = "SP", year = 2020)' } },
    ],
  },
  {
    id: 'grid-poluicao-pm25',
    category: 'clima',
    title: {
      pt: 'Poluição do ar PM2.5 (GHAP)',
      en: 'Air pollution PM2.5 (GHAP)',
      es: 'Contaminación del aire PM2.5 (GHAP)',
    },
    description: {
      pt: 'Baixa PM2.5 (e O3) do produto GHAP (~1 km) agregado por município. O exemplo usa São Paulo. Para exposição intra-urbana, GHAP é preferível à reanálise CAMS (~0,75°, ~80 km); CAMS pode ser usada como checagem de sensibilidade.',
      en: 'Downloads PM2.5 (and O3) from GHAP (~1 km) aggregated by municipality. The example uses São Paulo. For intra-urban exposure, GHAP is preferable to the CAMS reanalysis (~0.75°, ~80 km); CAMS can be used as a sensitivity check.',
      es: 'Descarga PM2.5 (y O3) del producto GHAP (~1 km) agregado por municipio. El ejemplo usa São Paulo. Para exposición intra-urbana, GHAP es preferible a CAMS.',
    },
    vignetteUrl: `${PKGDOWN}/08-clima-grade.html`,
    steps: [
      { fn: 'sus_grid_pollution_ghap', values: { pollutants: 'pm25', resolution: 'monthly', years: '2018:2022', municipalities: 'geobr::read_municipality(code_muni = "SP", year = 2020)' } },
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
      pt: 'Obtém a contagem de focos de queimada por município a partir do INPE (ou FIRMS/NASA). O exemplo usa São Paulo. Foco de queimada é um proxy de fumaça, não exposição direta: considere distância/transporte e produtos de fumaça como sensibilidade.',
      en: 'Fetches fire-hotspot counts by municipality from INPE (or FIRMS/NASA). The example uses São Paulo. A fire hotspot is a smoke proxy, not direct exposure: consider distance/transport and smoke products as sensitivity.',
      es: 'Obtiene el conteo de focos de incendio por municipio desde INPE (o FIRMS/NASA). El ejemplo usa São Paulo. El foco es un proxy de humo, no exposición directa.',
    },
    vignetteUrl: `${PKGDOWN}/08-clima-grade.html`,
    steps: [
      { fn: 'sus_grid_fires', values: { years: '2018:2022', source: 'inpe', municipalities: 'geobr::read_municipality(code_muni = "SP", year = 2020)' } },
    ],
  },
  {
    id: 'clima-aggregate-exposicao',
    category: 'clima',
    title: {
      pt: 'Exposição aguda saúde × clima (lag distribuído)',
      en: 'Acute health × climate exposure (distributed lag)',
      es: 'Exposición aguda salud × clima (rezago distribuido)',
    },
    description: {
      pt: 'O passo-chave de integração: casa uma série de saúde diária ou semanal com o clima das estações, criando defasagens de 0 a 21 dias — pronto para o DLNM. A entrada deve ser uma tabela no stage `aggregate` com `date` e uma coluna de município (ex.: `codigo_municipio_residencia`); ajuste UF/anos e confira a distância estação–município.',
      en: 'The key integration step: matches a daily or weekly health series with station climate, creating 0–21 day lags — ready for DLNM. The input must be an `aggregate`-stage table with `date` and a municipality column (e.g., `codigo_municipio_residencia`); adjust state/years and check station–municipality distance.',
      es: 'El paso clave de integración: une una serie de salud diaria o semanal con el clima de estaciones, creando rezagos de 0 a 21 días — listo para DLNM. La entrada debe ser una tabla en stage `aggregate` con `date` y una columna de municipio (ej.: `codigo_municipio_residencia`).',
    },
    vignetteUrl: `${PKGDOWN}/07-clima-estacoes.html`,
    steps: [
      { fn: 'sus_data_read', values: { path: '' } },
      // sus_climate_aggregate only accepts health data at stage "spatial"
      { id: 'exp-spatial', fn: 'sus_spatial_join', values: {} },
      { id: 'exp-inmet', fn: 'sus_climate_inmet', values: { years: '2015:2019', uf: '"SP"' } },
      { fn: 'sus_climate_aggregate', values: { health_data: stepRef('exp-spatial'), climate_data: stepRef('exp-inmet'), climate_var: 'tair_dry_bulb_c', temporal_strategy: 'distributed_lag', lag_days: '21' } },
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
      pt: 'Calcula indicadores como UTCI, WBGT e índice de calor a partir de séries INMET para estudos de estresse térmico. UTCI/PET/HI são aproximações internas: use para ranking e comparação dentro da série, não como valores absolutos equivalentes aos índices oficiais.',
      en: 'Computes indicators such as UTCI, WBGT and heat index from INMET series for thermal-stress studies. UTCI/PET/HI are internal approximations: use them for ranking and within-series comparison, not as absolute values equivalent to the official indices.',
      es: 'Calcula indicadores como UTCI, WBGT e índice de calor desde series INMET para estudios de estrés térmico. UTCI/PET/HI son aproximaciones internas.',
    },
    vignetteUrl: `${PKGDOWN}/climate_indicators.html`,
    steps: [
      { fn: 'sus_climate_inmet', values: { years: '2018:2022', uf: '"RS"' } },
      { fn: 'sus_climate_compute_indicators', values: { region: 'south' } },
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
      pt: 'Pipeline INMET -> indicadores -> detecção de ondas de calor por método e visualização dos eventos. O limiar usa um período de referência fixo (2010–2016), não a série inteira; 7 anos é curto e deve ser declarado como limitação. Teste também os métodos EHF e INMET como sensibilidade.',
      en: 'INMET -> indicators -> heatwave detection by method and event visualisation. The threshold uses a fixed reference period (2010–2016), not the full series; 7 years is short and should be declared as a limitation. Test the EHF and INMET methods as sensitivity.',
      es: 'INMET -> indicadores -> detección de olas de calor por método y visualización de eventos. El umbral usa un período de referencia fijo (2010–2016). Pruebe también los métodos EHF e INMET.',
    },
    vignetteUrl: `${PKGDOWN}/ondas_de_calor.html`,
    steps: [
      { fn: 'sus_climate_inmet', values: { years: '2010:2023', uf: '"RS"' } },
      { fn: 'sus_climate_compute_indicators', values: {} },
      { fn: 'sus_climate_compute_heatwaves', values: { method: 'WHO', percentile: '90', baseline_start: '"2010-01-01"', baseline_end: '"2016-12-31"' } },
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
      pt: 'Usa séries climáticas e indicadores térmicos para identificar eventos de frio e produzir gráficos de acompanhamento. O limiar usa um período de referência fixo (2010–2016); 7 anos é curto e deve ser declarado como limitação.',
      en: 'Uses climate series and thermal indicators to identify cold events and produce monitoring plots. The threshold uses a fixed reference period (2010–2016); 7 years is short and should be declared as a limitation.',
      es: 'Usa series climáticas e indicadores térmicos para identificar eventos de frío y producir gráficos de seguimiento. El umbral usa un período de referencia fijo (2010–2016).',
    },
    vignetteUrl: `${PKGDOWN}/ondas_de_frio.html`,
    steps: [
      { fn: 'sus_climate_inmet', values: { years: '2010:2023', uf: '"RS"' } },
      { fn: 'sus_climate_compute_indicators', values: {} },
      { fn: 'sus_climate_compute_coldwaves', values: { method: 'WHO', percentile: '10', baseline_start: '"2010-01-01"', baseline_end: '"2016-12-31"' } },
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
      pt: 'Óbitos respiratórios (CID-10 cap. J) em menores de 5 anos vs. temperatura das estações INMET, com agregação semanal, DLNM e fração atribuível.',
      en: 'Respiratory deaths (ICD-10 ch. J) in under-5s vs. INMET station temperature, with weekly aggregation, DLNM and attributable fraction.',
      es: 'Óbitos respiratorios (CIE-10 cap. J) en menores de 5 años vs. temperatura de estaciones INMET, con agregación semanal, DLNM y fracción atribuible.',
    },
    vignetteUrl: `${PKGDOWN}/ec-01-respiratorio-pediatrico.html`,
    steps: caseSteps('respiratorio-pediatrico'),
  },
  {
    id: 'ec-02-dengue-clima',
    category: 'caso',
    title: {
      pt: 'Dengue e graus-dia (Nordeste)',
      en: 'Dengue and degree days (Northeast)',
      es: 'Dengue y grados-día (Nordeste)',
    },
    description: {
      pt: 'Casos de dengue (SINAN) vs. graus-dia de desenvolvimento (GDD, base 11 °C) das estações INMET, agregação semanal por primeiros sintomas, defasagens de 0–84 dias e DLNM. O vignette original usa janela móvel de 14 dias; este template usa GDD para alinhar a exposição ao ciclo do vetor. Ajuste estados, janela e base térmica ao seu estudo.',
      en: 'Dengue cases (SINAN) vs. growing degree days (GDD, base 11 °C) from INMET stations, weekly aggregation by first-symptom date, 0–84 day lags and DLNM. The original vignette uses a 14-day moving window; this template uses GDD to align exposure with the vector cycle. Adjust states, window and thermal base to your study.',
      es: 'Casos de dengue (SINAN) vs. grados-día de desarrollo (GDD, base 11 °C) de estaciones INMET, agregación semanal por primeros síntomas, rezagos de 0–84 días y DLNM.',
    },
    vignetteUrl: `${PKGDOWN}/ec-02-dengue-clima.html`,
    steps: caseSteps('dengue-clima'),
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
    steps: caseSteps('cardio-idosos-calor'),
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
      pt: 'Internações respiratórias (SIH) em Porto Alegre vs. ondas de frio detectadas para o Sul, com série temporal interrompida (ITS) para um evento específico. A ITS usa uma série de um único município; a data do evento é um exemplo e deve ser substituída.',
      en: 'Respiratory hospitalizations (SIH) in Porto Alegre vs. cold waves detected for the South, with interrupted time series (ITS) for a specific event. ITS uses a single-municipality series; the event date is an example and must be replaced.',
      es: 'Internaciones respiratorias (SIH) en Porto Alegre vs. olas de frío detectadas para el Sur, con serie temporal interrumpida (ITS) para un evento específico.',
    },
    vignetteUrl: `${PKGDOWN}/ec-04-hospitalizacoes-frio.html`,
    steps: caseSteps('hospitalizacao-frio'),
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
      pt: 'Trecho de modelagem: lê uma tabela já agregada **com colunas `_lagN`** (produzidas por `sus_climate_aggregate(temporal_strategy = "distributed_lag")`) e ajusta DLNM, gráfico exposição-resposta e fração atribuível. Ajuste `outcome_col` (n_obitos, n_internacoes, n_casos).',
      en: 'Modelling snippet: reads an already-aggregated table **with `_lagN` columns** (produced by `sus_climate_aggregate(temporal_strategy = "distributed_lag")`) and fits DLNM, exposure–response plot and attributable fraction. Adjust `outcome_col` (n_obitos, n_internacoes, n_casos).',
      es: 'Fragmento de modelado: lee una tabla ya agregada **con columnas `_lagN`** y ajusta DLNM, gráfico exposición-respuesta y fracción atribuible. Ajuste `outcome_col`.',
    },
    vignetteUrl: `${PKGDOWN}/mod-01-dlnm.html`,
    steps: [
      { fn: 'sus_data_read', values: { path: '' } },
      { id: 'dlnm-fit', fn: 'sus_mod_dlnm', values: { outcome_col: 'n_obitos' } },
      // plot_dlnm and af both need the DLNM fit, not each other's output
      { fn: 'sus_mod_plot_dlnm', values: { fit: stepRef('dlnm-fit') } },
      { fn: 'sus_mod_af', values: { fit: stepRef('dlnm-fit') } },
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
      pt: 'Trecho de modelagem espacial: lê **uma linha por município** com o desfecho e uma coluna de expected counts/população (`expected_deaths`), monta a matriz de vizinhança e ajusta um modelo Bayesiano espacial (BYM) com offset. Sem offset, o mapa reflete tamanho populacional, não risco.',
      en: 'Spatial modelling snippet: reads **one row per municipality** with the outcome and an expected-counts/population column (`expected_deaths`), builds the neighbourhood matrix and fits a spatial Bayesian (BYM) model with an offset. Without an offset, the map reflects population size, not risk.',
      es: 'Fragmento de modelado espacial: lee **una fila por municipio** con el desfecho y una columna de expected counts/población (`expected_deaths`), arma la matriz de vecindad y ajusta un modelo Bayesiano espacial (BYM) con offset.',
    },
    vignetteUrl: `${PKGDOWN}/mod-07-bayes.html`,
    steps: [
      // weights come first: they need polygons (sf), not the health table, so the step must start
      // its own block; adjust the UF/year to the municipalities in your table
      { id: 'sp-w', fn: 'sus_mod_spatial_weights', values: { municipalities: 'geobr::read_municipality(code_muni = "RN", year = 2020)' } },
      { fn: 'sus_data_read', values: { path: '' } },
      { fn: 'sus_mod_spatial_bayes', values: { outcome: 'n_obitos', offset: 'expected_deaths', W: stepRef('sp-w') } },
      { fn: 'sus_mod_plot_spatial_bayes', values: { municipalities: 'geobr::read_municipality(code_muni = "RN", year = 2020)' } },
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
      pt: 'Dois desenhos quase-experimentais para uma **série de um único município**: exposição aguda por case-crossover (lags 0–3 dias) e avaliação de intervenção/evento por ITS. A data de interrupção é um exemplo (COVID-19) e deve ser substituída. Se a tabela já é de um único município, remova o passo de filtro.',
      en: 'Two quasi-experimental designs for a **single-municipality series**: acute exposure via case-crossover (0–3 day lags) and intervention/event evaluation via ITS. The interruption date is an example (COVID-19) and must be replaced. If the table is already single-municipality, remove the filter step.',
      es: 'Dos diseños cuasi-experimentales para una **serie de un solo municipio**: exposición aguda por case-crossover (rezagos 0–3 días) y evaluación de intervención/evento por ITS. La fecha de interrupción es un ejemplo (COVID-19) y debe reemplazarse.',
    },
    vignetteUrl: `${PKGDOWN}/mod-03-crossover-its.html`,
    steps: [
      { id: 'cc-read', fn: 'sus_data_read', values: { path: '' } },
      // Both designs are single-series. Filtering to one municipality avoids
      // pseudo-replication in sus_mod_its() and the wrong contrast in the
      // time-stratified case-crossover. Remove this step if the input is already
      // one row per date.
      { id: 'cc-city', fn: 'sus_data_filter_demographics', values: { df: stepRef('cc-read'), city: '"Sao Paulo"' } },
      { fn: 'sus_mod_casecrossover', values: { data: stepRef('cc-city'), exposure_col: 'tair_dry_bulb_c', lag: 'c(0, 1, 2, 3)' } },
      // interruption_dates has no default — this is a real example (COVID-19
      // distancing in São Paulo); replace it with the event you want to study.
      { fn: 'sus_mod_its', values: { data: stepRef('cc-city'), interruption_dates: '2020-03-17' } },
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
      pt: 'Treina um modelo preditivo com variáveis climáticas, ambientais e socioeconômicas e gera gráficos de desempenho/importância. A validação é agrupada por município (`id_col = code_muni`) para evitar vazamento entre cidades. A tabela de entrada deve incluir as defasagens/rolling features que você quer que o modelo use; para inferência causal, use o DLNM.',
      en: 'Trains a predictive model with climate, environmental and socioeconomic features and generates performance/importance plots. Validation is grouped by municipality (`id_col = code_muni`) to avoid leakage across cities. The input table must include the lag/rolling features you want the model to use; for causal inference, use DLNM.',
      es: 'Entrena un modelo predictivo con variables climáticas, ambientales y socioeconómicas y genera gráficos de desempeño/importancia. La validación se agrupa por municipio (`id_col = code_muni`). La tabla de entrada debe incluir los rezagos/rolling features.',
    },
    vignetteUrl: `${PKGDOWN}/mod-05-ml.html`,
    steps: [
      { fn: 'sus_data_read', values: { path: '' } },
      { fn: 'sus_mod_ml', values: { outcome_col: 'n_obitos', id_col: 'code_muni', max_depth: '4', min_child_weight: '5' } },
      { fn: 'sus_mod_plot_ml', values: {} },
    ],
  },
]

// dev-only self-check: every template step references a real catalog function
if (import.meta.env.DEV) {
  const missing = TEMPLATES.flatMap((t) => t.steps.map((s) => s.fn)).filter((fn) => !byName.has(fn))
  if (missing.length) console.error('[templates] unknown fn(s):', [...new Set(missing)])
}
