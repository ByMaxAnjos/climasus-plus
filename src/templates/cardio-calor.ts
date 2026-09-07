import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const CARDIO_IDOSOS_CALOR: TutorialDef = {
  id: 'cardio-idosos-calor',
  title: {
    pt: 'Mortalidade cardiovascular em idosos e ondas de calor — SP 2010-2019',
    en: 'Cardiovascular mortality in older adults and heatwaves — São Paulo 2010-2019',
    es: 'Mortalidad cardiovascular en adultos mayores y olas de calor — SP 2010-2019',
  },
  audience: 'both',
  steps: [
    { fn: 'sus_data_import', values: { uf: 'SP', system: 'SIM-DO', year: '2010:2019' }, explain: {
      pt: 'Importamos óbitos (SIM-DO) em SP, 2010 a 2019 — uma janela mais longa, porque ondas de calor extremas não acontecem todo ano.',
      en: 'We import deaths (SIM-DO) in São Paulo state, 2010 to 2019 — a longer window, since extreme heatwaves don\'t happen every year.',
      es: 'Importamos óbitos (SIM-DO) en SP, 2010 a 2019.',
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
    { fn: 'sus_data_filter_cid', values: { icd_codes: 'I', match_type: 'chapter' }, explain: {
      pt: 'Mantemos todo o capítulo I do CID-10 (doenças cardiovasculares).',
      en: 'We keep all of ICD-10 chapter I (cardiovascular disease).',
      es: 'Mantenemos todo el capítulo I de la CIE-10.',
    } },
    { fn: 'sus_data_create_variables', values: { age_breaks: 'c(0, 60, Inf)' }, explain: {
      pt: 'Criamos a faixa etária que separa idosos (60+) do restante.',
      en: 'We create the age group separating older adults (60+) from the rest.',
      es: 'Creamos la franja etaria que separa a los adultos mayores (60+).',
    } },
    { fn: 'sus_data_filter_demographics', values: { age_range: 'c(60, Inf)' }, explain: {
      pt: 'Recortamos para a população idosa.',
      en: 'We narrow down to the older-adult population.',
      es: 'Recortamos a la población adulta mayor.',
    } },
    {
      id: 'cardio-health-agg',
      fn: 'sus_data_aggregate',
      values: { time_unit: 'day' },
      explain: {
        pt: 'Agregamos por dia — o efeito do calor sobre óbito cardiovascular agudo é quase imediato.',
        en: 'We aggregate by day — the effect of heat on acute cardiovascular death is nearly immediate.',
        es: 'Agregamos por día.',
      },
    },
    {
      id: 'cardio-inmet',
      fn: 'sus_climate_inmet',
      values: { uf: 'SP', years: '2010:2019' },
      explain: {
        pt: 'Trazemos temperatura das estações INMET de SP, mesmos anos.',
        en: 'We bring in INMET station temperature for São Paulo, same years.',
        es: 'Traemos temperatura de las estaciones INMET de SP.',
      },
    },
    {
      id: 'cardio-merged',
      fn: 'sus_climate_aggregate',
      values: { health_data: stepRef('cardio-health-agg'), climate_data: stepRef('cardio-inmet'), time_unit: 'day' },
      explain: {
        pt: 'Cruzamos a série diária de óbitos com a série diária de temperatura.',
        en: 'We cross the daily death series with the daily temperature series.',
        es: 'Cruzamos la serie diaria de óbitos con la serie diaria de temperatura.',
      },
    },
    {
      fn: 'sus_climate_compute_heatwaves',
      values: { method: 'WHO', percentile: '90' },
      explain: {
        pt: 'Detectamos ondas de calor com a metodologia da OMS, percentil 90 como limiar.',
        en: 'We detect heatwaves using the WHO methodology, 90th percentile as the threshold.',
        es: 'Detectamos olas de calor con la metodología de la OMS, percentil 90 como umbral.',
      },
    },
    { fn: 'sus_mod_dlnm', values: {}, explain: {
      pt: 'Ajustamos o DLNM sobre a série diária — aqui a maior parte do efeito tende a aparecer nos primeiros dias após a exposição ao calor.',
      en: 'We fit DLNM over the daily series — here most of the effect tends to show up in the first days after heat exposure.',
      es: 'Ajustamos el DLNM sobre la serie diaria.',
    } },
    { fn: 'sus_mod_af', values: {}, explain: {
      pt: 'Calculamos a fração e o número de óbitos atribuíveis ao calor extremo.',
      en: 'We calculate the fraction and number of deaths attributable to extreme heat.',
      es: 'Calculamos la fracción y el número de óbitos atribuibles al calor extremo.',
    } },
    { fn: 'sus_mod_plot_af', values: {}, explain: {
      pt: 'Visualizamos a fração atribuível em gráfico e tabela, prontos para comunicação.',
      en: 'We visualize the attributable fraction as a chart and table, ready to communicate.',
      es: 'Visualizamos la fracción atribuible en gráfico y tabla.',
    } },
  ],
}
