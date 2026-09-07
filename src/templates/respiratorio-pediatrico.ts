import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const RESPIRATORIO_PEDIATRICO: TutorialDef = {
  id: 'respiratorio-pediatrico',
  title: {
    pt: 'Mortalidade respiratória pediátrica e temperatura — Sudeste 2015-2019',
    en: 'Pediatric respiratory mortality and temperature — Southeast Brazil 2015-2019',
    es: 'Mortalidad respiratoria pediátrica y temperatura — Sudeste 2015-2019',
  },
  audience: 'both',
  steps: [
    {
      fn: 'sus_data_import',
      values: { uf: 'c("SP", "RJ", "MG", "ES")', system: 'SIM-DO', year: '2015:2019' },
      explain: {
        pt: 'Importamos óbitos (SIM-DO) em SP, RJ, MG e ES, 2015 a 2019.',
        en: 'We import deaths (SIM-DO) in SP, RJ, MG, and ES, 2015 to 2019.',
        es: 'Importamos óbitos (SIM-DO) en SP, RJ, MG y ES, 2015 a 2019.',
      },
    },
    { fn: 'sus_data_clean_encoding', values: {}, explain: {
      pt: 'Corrigimos acentos e caracteres que costumam vir quebrados nos arquivos do DATASUS.',
      en: 'We fix accents and characters that commonly come broken in DATASUS files.',
      es: 'Corregimos acentos y caracteres que suelen venir rotos.',
    } },
    { fn: 'sus_data_standardize', values: {}, explain: {
      pt: 'Padronizamos nomes de coluna e tipos.',
      en: 'We standardize column names and types.',
      es: 'Estandarizamos nombres de columna y tipos.',
    } },
    { fn: 'sus_data_filter_cid', values: { disease_group: 'respiratory' }, explain: {
      pt: 'Mantemos só as causas respiratórias (CID-10 capítulo J).',
      en: 'We keep only respiratory causes (ICD-10 chapter J).',
      es: 'Mantenemos solo las causas respiratorias (CIE-10 capítulo J).',
    } },
    { fn: 'sus_data_create_variables', values: { age_breaks: 'c(0, 5, 15, 60, Inf)' }, explain: {
      pt: 'Criamos faixas etárias e variáveis de calendário.',
      en: 'We create age groups and calendar variables.',
      es: 'Creamos franjas etarias y variables de calendario.',
    } },
    { fn: 'sus_data_filter_demographics', values: { age_range: 'c(0, 5)' }, explain: {
      pt: 'Recortamos para crianças menores de 5 anos.',
      en: 'We narrow down to children under 5.',
      es: 'Recortamos a niños menores de 5 años.',
    } },
    {
      id: 'resp-health-agg',
      fn: 'sus_data_aggregate',
      values: { time_unit: 'month' },
      explain: {
        pt: 'Agregamos a série por mês.',
        en: 'We aggregate the series by month.',
        es: 'Agregamos la serie por mes.',
      },
    },
    {
      id: 'resp-spatial',
      fn: 'sus_spatial_join',
      values: {},
      explain: {
        pt: 'Ligamos a série de saúde às fronteiras oficiais dos municípios brasileiros — necessário antes de cruzar com dados de clima por município.',
        en: 'We link the health series to official Brazilian municipality boundaries — required before merging with climate data by municipality.',
        es: 'Vinculamos la serie de salud a los límites oficiales de los municipios brasileños — necesario antes de cruzar con datos de clima por municipio.',
      },
    },
    {
      id: 'resp-inmet',
      fn: 'sus_climate_inmet',
      values: { uf: 'c("SP", "RJ", "MG", "ES")', years: '2015:2019' },
      explain: {
        pt: 'Trazemos a temperatura das estações INMET nas mesmas UFs e anos.',
        en: 'We bring in INMET station temperature for the same states and years.',
        es: 'Traemos la temperatura de las estaciones INMET.',
      },
    },
    {
      fn: 'sus_climate_aggregate',
      values: { health_data: stepRef('resp-spatial'), climate_data: stepRef('resp-inmet'), time_unit: 'month' },
      explain: {
        pt: 'Cruzamos saúde e clima, agregados por mês.',
        en: 'We cross health and climate data, aggregated by month.',
        es: 'Cruzamos salud y clima, agregados por mes.',
      },
    },
    { id: 'resp-dlnm', fn: 'sus_mod_dlnm', values: {}, explain: {
      pt: 'Ajustamos o modelo DLNM sobre a série integrada.',
      en: 'We fit the DLNM model over the integrated series.',
      es: 'Ajustamos el modelo DLNM sobre la serie integrada.',
    } },
    // both plot and af consume the DLNM fit directly — an explicit stepRef is needed here because
    // a plot step never becomes the pipe's "open" variable, so without it the code generator's
    // chain-rendering would wire `sus_mod_af()` onto the plot's line instead of the DLNM fit
    { fn: 'sus_mod_plot_dlnm', values: { fit: stepRef('resp-dlnm') }, explain: {
      pt: 'Visualizamos a curva de exposição-defasagem-risco.',
      en: 'We visualize the exposure-lag-risk curve.',
      es: 'Visualizamos la curva de exposición-rezago-riesgo.',
    } },
    { fn: 'sus_mod_af', values: { fit: stepRef('resp-dlnm') }, explain: {
      pt: 'Calculamos a fração de óbitos atribuível a temperatura fora da faixa segura — não assume que o efeito aparece no mesmo dia da exposição, porque já incorpora a defasagem ajustada pelo DLNM.',
      en: 'We calculate the fraction of deaths attributable to temperature outside the safe range — this does not assume the effect shows up the same day as exposure, since it already incorporates the lag structure fitted by DLNM.',
      es: 'Calculamos la fracción de óbitos atribuible a temperatura fuera del rango seguro.',
    } },
  ],
}
