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
    { fn: 'sus_data_import', values: { region: 'sul', system: 'SIH-RD', year: '2010:2019' }, explain: {
      pt: 'Importamos internações (SIH-RD) na região Sul, 2010 a 2019.',
      en: 'We import hospitalizations (SIH-RD) in the Southern region, 2010 to 2019.',
      es: 'Importamos internaciones (SIH-RD) en la región Sur, 2010 a 2019.',
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
      values: { time_unit: 'day' },
      explain: {
        pt: 'Agregamos por dia.',
        en: 'We aggregate by day.',
        es: 'Agregamos por día.',
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
      id: 'frio-merged',
      fn: 'sus_climate_aggregate',
      values: { health_data: stepRef('frio-health-agg'), climate_data: stepRef('frio-inmet'), time_unit: 'day' },
      explain: {
        pt: 'Cruzamos a série diária de internações com a série diária de temperatura.',
        en: 'We cross the daily hospitalization series with the daily temperature series.',
        es: 'Cruzamos la serie diaria de internaciones con la serie diaria de temperatura.',
      },
    },
    {
      fn: 'sus_climate_compute_coldwaves',
      values: { method: 'WHO', percentile: '10' },
      explain: {
        pt: 'Detectamos ondas de frio com a metodologia da OMS, percentil 10 como limiar — o espelho do percentil 90 usado para calor.',
        en: 'We detect cold waves using the WHO methodology, 10th percentile as the threshold — the mirror of the 90th percentile used for heat.',
        es: 'Detectamos olas de frío con la metodología de la OMS, percentil 10 como umbral.',
      },
    },
    {
      fn: 'sus_mod_its',
      // `interruption_dates` has no default and is required — placeholder illustrates the format
      // (a real cold snap that hit Southern Brazil, July 2013); users replace it with the actual
      // event date(s) they want to evaluate before running.
      values: { interruption_dates: '2013-07-23' },
      explain: {
        pt: 'Avaliamos com série interrompida se os períodos de onda de frio mudam o nível ou a tendência das internações — um desenho mais leve que o DLNM, indicado para perguntas sobre um evento específico. Ajuste a data de interrupção para o evento que você quer avaliar.',
        en: 'We use an interrupted time series to assess whether cold-wave periods change the level or trend of hospitalizations — a lighter design than DLNM, suited to questions about a specific event. Adjust the interruption date to the event you want to evaluate.',
        es: 'Evaluamos con serie interrumpida si los períodos de ola de frío cambian el nivel o la tendencia de las internaciones. Ajuste la fecha de interrupción al evento que desea evaluar.',
      },
    },
  ],
}
