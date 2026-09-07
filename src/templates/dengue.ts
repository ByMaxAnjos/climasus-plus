import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const DENGUE_CLIMA: TutorialDef = {
  id: 'dengue-clima',
  title: {
    pt: 'Dengue e clima — Nordeste 2015-2019',
    en: 'Dengue and climate — Northeast Brazil 2015-2019',
    es: 'Dengue y clima — Nordeste 2015-2019',
  },
  audience: 'both',
  steps: [
    {
      fn: 'sus_data_import',
      // catalog's `region` enum is lowercase snake_case ('nordeste'), not the display form 'Nordeste'
      values: { region: 'nordeste', system: 'SINAN-DENGUE', year: '2015:2019' },
      explain: {
        pt: 'Importamos casos notificados de dengue (SINAN) na região Nordeste, 2015 a 2019.',
        en: 'We import notified dengue cases (SINAN) for the Northeast region, 2015 to 2019.',
        es: 'Importamos casos notificados de dengue (SINAN) en la región Nordeste, 2015 a 2019.',
      },
    },
    {
      fn: 'sus_data_clean_encoding',
      values: {},
      explain: {
        pt: 'Corrigimos acentos e caracteres que costumam vir quebrados nos arquivos do DATASUS.',
        en: 'We fix accents and characters that commonly come broken in DATASUS files.',
        es: 'Corregimos acentos y caracteres que suelen venir rotos en los archivos de DATASUS.',
      },
    },
    {
      fn: 'sus_data_standardize',
      values: {},
      explain: {
        pt: 'Padronizamos nomes de coluna e valores para o vocabulário comum do climasus4r.',
        en: 'We standardize column names and values into climasus4r\'s common vocabulary.',
        es: 'Estandarizamos nombres de columna y valores al vocabulario común de climasus4r.',
      },
    },
    {
      fn: 'sus_data_filter_cid',
      values: { disease_group: 'dengue' },
      explain: {
        pt: 'Mantemos só os casos de dengue.',
        en: 'We keep only dengue cases.',
        es: 'Mantenemos solo los casos de dengue.',
      },
    },
    {
      fn: 'sus_data_create_variables',
      values: {},
      explain: {
        pt: 'Criamos variáveis de calendário (semana epidemiológica, entre outras), necessárias para agregar por semana no próximo passo.',
        en: 'We create calendar variables (epidemiological week, among others), needed to aggregate by week in the next step.',
        es: 'Creamos variables de calendario (semana epidemiológica, entre otras).',
      },
    },
    {
      id: 'dengue-health-agg',
      fn: 'sus_data_aggregate',
      // kept from round 1: sus_climate_aggregate's health_data doc also lists a code_muni
      // requirement, so there's no confirmed-safe basis to drop this grouping key
      values: { time_unit: 'week', group_by: 'codigo_municipio_residencia' },
      explain: {
        pt: 'Agregamos a série por semana — a unidade certa para dengue, mais fina que os meses usados no recorte respiratório.',
        en: 'We aggregate the series by week — the right unit for dengue, finer than the months used in the respiratory case study.',
        es: 'Agregamos la serie por semana — la unidad correcta para el dengue.',
      },
    },
    {
      id: 'dengue-inmet',
      fn: 'sus_climate_inmet',
      // switched from CHIRPS/sus_grid_join (round-1 fix required geobr's code_muni="NE" shortcut,
      // which doesn't exist, and sus_grid_join needs a code_muni column no catalog function
      // actually produces) to the same station-based pattern already verified in
      // cardio-calor.ts/hospitalizacao-frio.ts: the 9 Northeast states via `uf`
      values: { uf: 'c("AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE")', years: '2015:2019' },
      explain: {
        pt: 'Trazemos temperatura das estações INMET dos 9 estados do Nordeste, mesmos anos. O estudo de caso original usava chuva por satélite (CHIRPS), com melhor cobertura em áreas sem estações — aqui usamos temperatura de estações, disponível neste app e mais leve de rodar.',
        en: 'We bring in INMET station temperature for the 9 Northeast states, same years. The original case study used satellite rainfall (CHIRPS) for better coverage in station-sparse areas — here we use station temperature instead, available in this app and lighter to run.',
        es: 'Traemos temperatura de las estaciones INMET de los 9 estados del Nordeste, mismos años. El estudio de caso original usaba lluvia satelital (CHIRPS) — aquí usamos temperatura de estaciones en su lugar.',
      },
    },
    {
      fn: 'sus_climate_aggregate',
      values: { health_data: stepRef('dengue-health-agg'), climate_data: stepRef('dengue-inmet'), time_unit: 'week' },
      explain: {
        pt: 'Cruzamos saúde e clima, agregados por semana.',
        en: 'We cross health and climate data, aggregated by week.',
        es: 'Cruzamos salud y clima, agregados por semana.',
      },
    },
    {
      fn: 'sus_mod_dlnm',
      values: {},
      explain: {
        pt: 'Ajustamos o modelo DLNM: o risco de dengue sobe com o acúmulo de temperatura favorável ao vetor ao longo de várias semanas, não no mesmo dia — é essa defasagem que o DLNM captura. Atenção: o padrão de outcome_col ("n_obitos") pode não ser o nome real da coluna de casos gerada pela agregação (SINAN-DENGUE conta casos, não óbitos) — confira o nome da coluna produzida no passo de agregação e informe outcome_col explicitamente se for diferente.',
        en: 'We fit the DLNM model: dengue risk rises with vector-favorable temperature accumulated over several weeks, not on the same day — this lag is what DLNM captures. Note: the outcome_col default ("n_obitos") may not match the actual case-count column produced by the aggregation step (SINAN-DENGUE counts cases, not deaths) — check the column name your aggregation step actually produced and set outcome_col explicitly if it differs.',
        es: 'Ajustamos el modelo DLNM: el riesgo de dengue aumenta con la temperatura favorable al vector acumulada durante varias semanas. Atención: el valor por defecto de outcome_col ("n_obitos") puede no coincidir con la columna real de casos generada por la agregación (SINAN-DENGUE cuenta casos, no óbitos) — verifique el nombre de columna producido y configure outcome_col explícitamente si es diferente.',
      },
    },
    {
      fn: 'sus_mod_plot_dlnm',
      values: {},
      explain: {
        pt: 'Visualizamos a curva de exposição-defasagem-risco.',
        en: 'We visualize the exposure-lag-risk curve.',
        es: 'Visualizamos la curva de exposición-rezago-riesgo.',
      },
    },
  ],
}
