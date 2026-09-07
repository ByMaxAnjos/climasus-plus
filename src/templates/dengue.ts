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
      values: { time_unit: 'week', group_by: 'codigo_municipio_residencia' },
      explain: {
        pt: 'Agregamos a série por semana — a unidade certa para dengue, mais fina que os meses usados no recorte respiratório.',
        en: 'We aggregate the series by week — the right unit for dengue, finer than the months used in the respiratory case study.',
        es: 'Agregamos la serie por semana — la unidad correcta para el dengue.',
      },
    },
    {
      id: 'dengue-spatial',
      fn: 'sus_spatial_join',
      values: {},
      explain: {
        pt: 'Ligamos a série de saúde às fronteiras oficiais dos municípios brasileiros — necessário antes de cruzar com dados de clima por município.',
        en: 'We link the health series to official Brazilian municipality boundaries — required before merging with climate data by municipality.',
        es: 'Vinculamos la serie de salud a los límites oficiales de los municipios brasileños — necesario antes de cruzar con datos de clima por municipio.',
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
      // temporal_strategy='distributed_lag' is what creates the tair_dry_bulb_c_lag0..N columns
      // that sus_mod_dlnm requires (it aborts without them). lag_days is the max lag, in DAYS
      // (the join shifts the climate calendar by `date + l`), and climate_var is pinned to a
      // single variable so sus_mod_dlnm's climate_col auto-detection has no ambiguity.
      // time_unit is deliberately left unset (default "day"): it only controls the CLIMATE
      // pre-aggregation, and daily climate rows are what make every integer lag find a match
      // against the weekly health date — flooring the climate to weeks would leave the
      // non-multiple-of-7 lag columns all-NA, which empties the model frame downstream.
      values: {
        health_data: stepRef('dengue-spatial'),
        climate_data: stepRef('dengue-inmet'),
        climate_var: 'tair_dry_bulb_c',
        temporal_strategy: 'distributed_lag',
        lag_days: '28',
      },
      explain: {
        pt: 'Cruzamos saúde e clima criando as colunas de defasagem (temperatura de 0 a 28 dias antes de cada semana) que o DLNM precisa. A janela de 28 dias é um valor ILUSTRATIVO, plausível para o ciclo do vetor, não um parâmetro calibrado na literatura — ajuste-o para a sua pergunta.',
        en: 'We cross health and climate data, creating the lag columns (temperature from 0 to 28 days before each week) that DLNM needs. The 28-day window is an ILLUSTRATIVE value, plausible for the vector cycle, not a literature-calibrated parameter — adjust it for your question.',
        es: 'Cruzamos salud y clima creando las columnas de rezago (temperatura de 0 a 28 días antes de cada semana) que el DLNM necesita. La ventana de 28 días es un valor ILUSTRATIVO, no un parámetro calibrado en la literatura — ajústelo a su pregunta.',
      },
    },
    {
      fn: 'sus_mod_dlnm',
      // SINAN-DENGUE counts cases, so sus_data_aggregate names the outcome column "n_casos"
      // (get_smart_column_name, sus_data_aggregate.R:1984-2018), not the function default "n_obitos"
      values: { outcome_col: 'n_casos' },
      explain: {
        pt: 'Ajustamos o modelo DLNM sobre a contagem de casos (n_casos): o risco de dengue sobe com o acúmulo de temperatura favorável ao vetor ao longo de várias semanas, não no mesmo dia — é essa defasagem que o DLNM captura.',
        en: 'We fit the DLNM model over the case count (n_casos): dengue risk rises with vector-favorable temperature accumulated over several weeks, not on the same day — this lag is what DLNM captures.',
        es: 'Ajustamos el modelo DLNM sobre el conteo de casos (n_casos): el riesgo de dengue aumenta con la temperatura favorable al vector acumulada durante varias semanas.',
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
