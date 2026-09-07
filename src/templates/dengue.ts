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
      // group_by is required so the aggregated output keeps a `code_muni` column —
      // sus_grid_join's health_data doc requires it for the join key
      values: { time_unit: 'week', group_by: 'codigo_municipio_residencia' },
      explain: {
        pt: 'Agregamos a série por semana — a unidade certa para dengue, mais fina que os meses usados no recorte respiratório.',
        en: 'We aggregate the series by week — the right unit for dengue, finer than the months used in the respiratory case study.',
        es: 'Agregamos la serie por semana — la unidad correcta para el dengue.',
      },
    },
    {
      id: 'dengue-chirps',
      fn: 'sus_grid_chirps',
      // municipalities must be set to an sf polygon object, otherwise sus_grid_chirps returns a
      // raw file-path vector instead of a climasus_df — the wrong type for sus_grid_join's
      // grid_data. Assumption (not verified against a live R session): geobr::read_municipality()
      // accepts the macro-region shortcut "NE" for code_muni, the same way it does for code_state
      // in some geobr functions. If it doesn't, replace with an rbind of the 9 Northeast state codes.
      values: { resolution: 'monthly', years: '2015:2019', municipalities: 'geobr::read_municipality(code_muni = "NE", year = 2020)' },
      explain: {
        pt: 'Trazemos chuva acumulada por satélite (CHIRPS) para os mesmos anos, já agregada por município do Nordeste — chuva por satélite cobre bem a região, onde a rede de estações é irregular.',
        en: 'We bring in satellite-estimated accumulated rainfall (CHIRPS) for the same years, already aggregated per Northeast municipality — satellite rainfall covers the region well, where the weather-station network is uneven.',
        es: 'Traemos lluvia acumulada por satélite (CHIRPS) para los mismos años, ya agregada por municipio del Nordeste.',
      },
    },
    {
      fn: 'sus_grid_join',
      // by = c("code_muni") only (no "date"): CHIRPS is monthly, the health series is weekly —
      // dropping "date" from the join key lets the join broadcast each month's rainfall across
      // its weeks instead of failing to match on exact date
      values: { health_data: stepRef('dengue-health-agg'), grid_data: stepRef('dengue-chirps'), by: 'c("code_muni")' },
      explain: {
        pt: 'Juntamos a chuva de satélite à série de dengue já agregada, por município — usamos só o município como chave (não a data exata), porque a chuva é mensal e a série de dengue é semanal.',
        en: 'We join the satellite rainfall to the already-aggregated dengue series, by municipality only — not by exact date, since the rainfall is monthly and the dengue series is weekly.',
        es: 'Unimos la lluvia satelital a la serie de dengue ya agregada, solo por municipio (no por fecha exacta), porque la lluvia es mensual y la serie de dengue es semanal.',
      },
    },
    {
      fn: 'sus_mod_dlnm',
      values: {},
      explain: {
        pt: 'Ajustamos o modelo DLNM: o risco de dengue sobe com o acúmulo de chuva ao longo de várias semanas, não no mesmo dia — é essa defasagem que o DLNM captura. Atenção: o padrão de outcome_col ("n_obitos") pode não ser o nome real da coluna de casos gerada pela agregação (SINAN-DENGUE conta casos, não óbitos) — confira o nome da coluna produzida no passo de agregação e informe outcome_col explicitamente se for diferente.',
        en: 'We fit the DLNM model: dengue risk rises with rainfall accumulated over several weeks, not on the same day — this lag is what DLNM captures. Note: the outcome_col default ("n_obitos") may not match the actual case-count column produced by the aggregation step (SINAN-DENGUE counts cases, not deaths) — check the column name your aggregation step actually produced and set outcome_col explicitly if it differs.',
        es: 'Ajustamos el modelo DLNM. Atención: el valor por defecto de outcome_col ("n_obitos") puede no coincidir con la columna real de casos generada por la agregación (SINAN-DENGUE cuenta casos, no óbitos) — verifique el nombre de columna producido y configure outcome_col explícitamente si es diferente.',
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
