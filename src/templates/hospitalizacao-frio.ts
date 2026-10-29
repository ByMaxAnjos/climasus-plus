import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const HOSPITALIZACAO_FRIO: TutorialDef = {
  id: 'hospitalizacao-frio',
  title: {
    pt: 'Hospitalizações respiratórias e frio extremo — Região Sul 2010-2019',
    en: 'Respiratory hospitalizations and extreme cold — Southern Brazil 2010-2019',
    es: 'Hospitalizaciones respiratorias y frío extremo — Región Sur 2010-2019',
  },
  audience: 'both',
  steps: [
    // catalog's `region` enum is lowercase snake_case ('sul'), not the display form 'Sul'
    // month: '1:12' (all months) — required for SIH/CNES/SIA systems, and the cold-wave
    // percentile threshold below needs the full-year distribution, not just winter months.
    { fn: 'sus_data_import', values: { region: 'sul', system: 'SIH-RD', year: '2010:2019', month: '1:12' }, explain: {
      pt: 'Importamos internações (SIH-RD) na região Sul, 2010 a 2019, todos os meses — a detecção de ondas de frio por percentil precisa da distribuição do ano inteiro, não só do inverno.',
      en: 'We import hospitalizations (SIH-RD) in the Southern region, 2010 to 2019, all months — the percentile-based cold-wave detection needs the full-year distribution, not just winter.',
      es: 'Importamos internaciones (SIH-RD) en la región Sur, 2010 a 2019, todos los meses — la detección de olas de frío por percentil necesita la distribución del año completo.',
    } },
    { fn: 'sus_data_clean_encoding', values: {}, explain: {
      pt: 'Corrigimos acentos e caracteres que costumam vir quebrados.',
      en: 'We fix commonly broken accents and characters.',
      es: 'Corregimos acentos y caracteres.',
    } },
    { fn: 'sus_data_standardize', values: {}, explain: {
      pt: 'Padronizamos nomes de coluna e tipos.',
      en: 'We standardize column names and types.',
      es: 'Estandarizamos nombres de columna y tipos.',
    } },
    { fn: 'sus_data_filter_cid', values: { icd_codes: 'c("J09", "J18")', match_type: 'range' }, explain: {
      pt: 'Mantemos a faixa J09-J18 (pneumonias e influenza) — mais específica que o capítulo I inteiro usado no recorte cardiovascular.',
      en: 'We keep the J09-J18 range (pneumonia and influenza) — more specific than the whole chapter I used in the cardiovascular case study.',
      es: 'Mantenemos el rango J09-J18 (neumonías e influenza).',
    } },
    { fn: 'sus_data_create_variables', values: {}, explain: {
      pt: 'Criamos variáveis de calendário.',
      en: 'We create calendar variables.',
      es: 'Creamos variables de calendario.',
    } },
    {
      id: 'frio-health-agg',
      fn: 'sus_data_aggregate',
      values: { time_unit: 'day', group_by: 'codigo_municipio_residencia', complete_dates: 'TRUE' },
      explain: {
        pt: 'Agregamos por dia.',
        en: 'We aggregate by day.',
        es: 'Agregamos por día.',
      },
    },
    {
      id: 'frio-spatial',
      fn: 'sus_spatial_join',
      values: {},
      explain: {
        pt: 'Ligamos a série de saúde às fronteiras oficiais dos municípios brasileiros — necessário antes de cruzar com dados de clima por município.',
        en: 'We link the health series to official Brazilian municipality boundaries — required before merging with climate data by municipality.',
        es: 'Vinculamos la serie de salud a los límites oficiales de los municipios brasileños — necesario antes de cruzar con datos de clima por municipio.',
      },
    },
    {
      id: 'frio-inmet',
      fn: 'sus_climate_inmet',
      // sus_climate_inmet has no `region` arg (catalog: years/uf/station_code/...) — select the
      // three southern states directly via `uf`, the closest equivalent to "região Sul"
      values: { uf: 'c("PR", "SC", "RS")', years: '2010:2019' },
      explain: {
        pt: 'Trazemos temperatura das estações INMET da região Sul (PR, SC, RS), mesmos anos.',
        en: 'We bring in INMET station temperature for the Southern states (PR, SC, RS), same years.',
        es: 'Traemos temperatura de las estaciones INMET de la región Sur (PR, SC, RS).',
      },
    },
    {
      id: 'frio-fill',
      fn: 'sus_climate_fill_inmet',
      values: { target_var: 'c("tair_dry_bulb_c", "tair_max_c", "tair_min_c")' },
      explain: {
        pt: 'Completamos as falhas das séries das estações (temperatura média, máxima e mínima) com um modelo de aprendizado de máquina treinado por estação (XGBoost), para que defasagens e indicadores não tenham buracos. Estações com mais de 40% de falhas são excluídas. Pode levar vários minutos; para testar a qualidade do preenchimento antes, use `run_evaluation = TRUE`.',
        en: 'We fill the gaps in the station series (mean, maximum and minimum temperature) with a machine-learning model trained per station (XGBoost), so lags and indicators have no holes. Stations with more than 40% gaps are excluded. It can take several minutes; to test the quality of the filling first, use `run_evaluation = TRUE`.',
        es: 'Rellenamos los vacíos de las series de las estaciones (temperatura media, máxima y mínima) con un modelo de aprendizaje automático entrenado por estación (XGBoost), para que rezagos e indicadores no tengan huecos. Se excluyen las estaciones con más de 40% de vacíos. Puede tardar varios minutos; para probar la calidad del relleno antes, use `run_evaluation = TRUE`.',
      },
    },
    {
      // cold-wave detection is a TERMINAL side-branch: it must read the raw INMET climate frame
      // (sus_climate_compute_coldwaves aborts unless sus_meta(df,"type") is climate/inmet/filled/
      // indicators — coldwaves.R:306-309) and it returns a climasus_cw list, not a climasus_df,
      // so its output only feeds sus_climate_plot_coldwaves, never the model. It chains directly
      // off frio-inmet (same `clima` family) and nothing downstream reads that variable again.
      // There is deliberately NO sus_climate_aggregate step here: sus_mod_its takes no
      // climate_col argument and needs no climate columns merged in (sus_mod_its.R:245-250).
      fn: 'sus_climate_compute_coldwaves',
      values: { method: 'WHO', percentile: '10', baseline_start: '"2010-01-01"', baseline_end: '"2015-12-31"' },
      explain: {
        pt: 'Detectamos ondas de frio com a metodologia da OMS, percentil 10 como limiar — o espelho do percentil 90 usado para calor. O limiar usa um período de referência fixo (2010–2015), não a série inteira; cinco anos é uma base curta e deve ser declarada como limitação.',
        en: 'We detect cold waves using the WHO methodology, 10th percentile as the threshold — the mirror of the 90th percentile used for heat. The threshold uses a fixed reference period (2010–2015), not the full series; five years is a short baseline and should be declared as a limitation.',
        es: 'Detectamos olas de frío con la metodología de la OMS, percentil 10 como umbral. El umbral usa un período de referencia fijo (2010–2015).',
      },
    },
    {
      fn: 'sus_climate_plot_coldwaves',
      values: {},
      explain: {
        pt: 'Visualizamos os dias classificados como onda de frio.',
        en: 'We visualize the days classified as cold waves.',
        es: 'Visualizamos los días clasificados como ola de frío.',
      },
    },
    {
      id: 'frio-city',
      fn: 'sus_data_filter_demographics',
      // ITS is a single-series design. Filtering to one municipality prevents
      // sus_mod_its() from treating every municipality-day as an independent
      // observation (pseudo-replication). Change the city to your study site.
      values: { df: stepRef('frio-spatial'), city: '"Porto Alegre"' },
      explain: {
        pt: 'Restringimos a análise a um município (Porto Alegre) porque a série temporal interrompida é um desenho de série única. Sem esse filtro, cada linha município-dia seria tratada como observação independente, inflando o n e encolhendo os erros-padrão. Troque a cidade pelo seu local de estudo.',
        en: 'We restrict the analysis to one municipality (Porto Alegre) because interrupted time series is a single-series design. Without this filter, every municipality-day row would be treated as an independent observation, inflating n and shrinking standard errors. Change the city to your study site.',
        es: 'Restringimos el análisis a un municipio (Porto Alegre) porque la serie temporal interrumpida es un diseño de serie única.',
      },
    },
    {
      fn: 'sus_mod_its',
      // `data` must point back at the health chain explicitly: the step immediately above is the
      // cold-wave plot, so without this override the model would be wired onto the climate branch.
      // `interruption_dates` has no default and is required. This date is a placeholder EXAMPLE
      // only, not a verified real cold-wave event — it exists purely so the template loads without
      // a missing-argument error. Users must replace it with a real date before drawing conclusions.
      // SIH-RD counts hospitalizations, so sus_data_aggregate names the outcome column
      // "n_internacoes" (get_smart_column_name, sus_data_aggregate.R:1984-2018), not "n_obitos".
      values: { data: stepRef('frio-city'), outcome_col: 'n_internacoes', interruption_dates: '2013-07-23' },
      explain: {
        pt: 'Avaliamos com série interrompida se um evento de frio específico muda o nível ou a tendência das internações (n_internacoes) em Porto Alegre — um desenho indicado para um evento delimitado, não para ondas de frio recorrentes. A data "2013-07-23" é apenas um EXEMPLO de formato, não um evento real verificado — substitua pela data real do evento que você quer avaliar antes de interpretar os resultados.',
        en: 'We use an interrupted time series to assess whether a specific cold event changes the level or trend of hospitalizations (n_internacoes) in Porto Alegre — a design suited to a bounded event, not recurring cold waves. The date "2013-07-23" is only a placeholder EXAMPLE of the expected format, not a verified real event — replace it with the actual event date you want to evaluate before interpreting any results.',
        es: 'Evaluamos con serie interrumpida si un evento de frío específico cambia el nivel o la tendencia de las internaciones (n_internacoes) en Porto Alegre. La fecha "2013-07-23" es solo un EJEMPLO de formato, no un evento real verificado — reemplácela por la fecha real del evento que desea evaluar antes de interpretar los resultados.',
      },
    },
  ],
}
