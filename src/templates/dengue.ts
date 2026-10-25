import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const DENGUE_CLIMA: TutorialDef = {
  id: 'dengue-clima',
  title: {
    pt: 'Dengue e graus-dia — Nordeste 2015-2019',
    en: 'Dengue and degree days — Northeast Brazil 2015-2019',
    es: 'Dengue y grados-día — Nordeste 2015-2019',
  },
  audience: 'both',
  steps: [
    {
      fn: 'sus_data_import',
      // Four Northeast states with the highest historical dengue burden (the same
      // four used by the original climasus4r dengue vignette). Keeping the analysis
      // at state level avoids pooling nine heterogeneous states into one series.
      values: { uf: 'c("CE", "PE", "BA", "MA")', system: 'SINAN-DENGUE', year: '2015:2019' },
      explain: {
        pt: 'Importamos casos notificados de dengue (SINAN) em quatro estados do Nordeste com maior carga histórica — CE, PE, BA e MA —, 2015 a 2019. Ajuste a UF/ano para a sua pergunta.',
        en: 'We import notified dengue cases (SINAN) for four Northeast states with the highest historical burden — CE, PE, BA and MA — from 2015 to 2019. Adjust state/years for your question.',
        es: 'Importamos casos notificados de dengue (SINAN) en cuatro estados del Nordeste con mayor carga histórica — CE, PE, BA y MA —, 2015 a 2019. Ajuste la UF/año según su pregunta.',
      },
    },
    {
      fn: 'sus_data_clean_encoding',
      values: {},
      explain: {
        pt: 'Corrigimos acentos e caracteres que costumam vir quebrados nos arquivos do DATASUS.',
        en: 'We fix accents and characters that commonly come broken in DATASUS files.',
        es: 'Corregimos acentos y caracteres que suelen venir rotos en los archivos del DATASUS.',
      },
    },
    {
      fn: 'sus_data_standardize',
      values: {},
      explain: {
        pt: 'Padronizamos nomes de coluna e valores para o vocabulário comum do climasus4r. Em português, a data de primeiros sintomas fica como `data_primeiros_sintomas`.',
        en: 'We standardize column names and values into climasus4r\'s common vocabulary. In Portuguese, the first-symptom date becomes `data_primeiros_sintomas`.',
        es: 'Estandarizamos nombres de columna y valores al vocabulario común de climasus4r. En portugués, la fecha de primeros síntomas queda como `data_primeiros_sintomas`.',
      },
    },
    {
      fn: 'sus_data_create_variables',
      values: { create_calendar_vars: 'TRUE' },
      explain: {
        pt: 'Criamos variáveis de calendário (semana epidemiológica, ano, mês), necessárias para agregar por semana e controlar sazonalidade.',
        en: 'We create calendar variables (epidemiological week, year, month), needed to aggregate by week and control for seasonality.',
        es: 'Creamos variables de calendario (semana epidemiológica, año, mes), necesarias para agregar por semana y controlar la estacionalidad.',
      },
    },
    {
      id: 'dengue-health-agg',
      fn: 'sus_data_aggregate',
      // Dengue is a weekly disease: use the epidemiological week (Sunday–Saturday)
      // and the first-symptom date, not the notification date. `complete_dates`
      // fills weeks with zero cases so the DLNM receives an evenly spaced series.
      values: {
        time_unit: 'week',
        group_by: 'codigo_municipio_residencia',
        complete_dates: 'TRUE',
        date_col: 'data_primeiros_sintomas',
      },
      explain: {
        pt: 'Agregamos a série por semana epidemiológica, usando a data dos primeiros sintomas (não a de notificação) e preenchendo semanas sem casos com zero. Sem isso, o modelo veria uma série com espaçamento irregular e a exposição ficaria deslocada pelo atraso de notificação.',
        en: 'We aggregate by epidemiological week, using the first-symptom date (not notification) and filling weeks without cases with zero. Without this, the model would see an irregularly spaced series and exposure would be shifted by reporting delay.',
        es: 'Agregamos la serie por semana epidemiológica, usando la fecha de primeros síntomas (no la de notificación) y rellenando semanas sin casos con cero.',
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
      values: { uf: 'c("CE", "PE", "BA", "MA")', years: '2015:2019' },
      explain: {
        pt: 'Trazemos a temperatura das estações INMET dos mesmos quatro estados e anos. Para dengue, a estação mais próxima é uma aproximação da exposição do município; confira a distância estação–município antes de interpretar.',
        en: 'We bring in INMET station temperature for the same four states and years. For dengue, the nearest station is an approximation of municipality exposure; check the station–municipality distance before interpreting.',
        es: 'Traemos la temperatura de las estaciones INMET de los mismos cuatro estados y años.',
      },
    },
    {
      id: 'dengue-gdd',
      fn: 'sus_climate_compute_indicators',
      // GDD is the exposure that matches the vector cycle. Base 11 °C is the
      // Aedes aegypti developmental threshold; the upper cap (35 °C) avoids
      // counting heat that suppresses development. `custom_thresholds` overrides
      // the regional defaults in sus_climate_compute_indicators().
      values: {
        df: stepRef('dengue-inmet'),
        indicators: 'gdd',
        custom_thresholds: 'list(gdd_base = 11, gdd_upper = 35)',
      },
      explain: {
        pt: 'Calculamos graus-dia de desenvolvimento (GDD) com base 11 °C e teto de 35 °C — a faixa biológica do Aedes aegypti. É a exposição que acumula energia térmica ao longo do ciclo do vetor, em vez de olhar apenas a temperatura do dia.',
        en: 'We compute growing degree days (GDD) with a base of 11 °C and an upper cap of 35 °C — the biological range of Aedes aegypti. This exposure accumulates thermal energy over the vector cycle instead of looking only at same-day temperature.',
        es: 'Calculamos grados-día de desarrollo (GDD) con base 11 °C y techo de 35 °C — el rango biológico de Aedes aegypti.',
      },
    },
    {
      fn: 'sus_climate_aggregate',
      // 0–84 days = 12 weeks. The biological window spans larval development
      // (~7–10 days), extrinsic incubation (~8–12 days at 28 °C), human
      // incubation and reporting. A 28-day window truncates that tail.
      values: {
        health_data: stepRef('dengue-spatial'),
        climate_data: stepRef('dengue-gdd'),
        climate_var: 'gdd_c',
        temporal_strategy: 'distributed_lag',
        lag_days: '84',
      },
      explain: {
        pt: 'Cruzamos a série semanal de casos com o GDD diário, criando as colunas de defasagem de 0 a 84 dias (12 semanas). Essa janela cobre desenvolvimento larval, incubação extrínseca do vírus, incubação humana e atraso de notificação. A janela é uma faixa biológica de partida; teste 28/56/84 dias como sensibilidade.',
        en: 'We cross the weekly case series with daily GDD, creating lag columns from 0 to 84 days (12 weeks). This window covers larval development, extrinsic incubation, human incubation and reporting delay. It is a biological starting range; test 28/56/84 days as sensitivity.',
        es: 'Cruzamos la serie semanal de casos con el GDD diario, creando columnas de rezago de 0 a 84 días (12 semanas).',
      },
    },
    {
      id: 'dengue-fit',
      fn: 'sus_mod_dlnm',
      // SINAN-DENGUE counts cases, so sus_data_aggregate names the outcome
      // "n_casos" (get_smart_column_name). Pin climate_col to gdd_c so the
      // auto-detection cannot pick another lagged variable.
      values: { outcome_col: 'n_casos', climate_col: 'gdd_c', dof_per_year: '2' },
      explain: {
        pt: 'Ajustamos o DLNM sobre a contagem de casos (n_casos) e o GDD. O risco de dengue sobe com o acúmulo de temperatura favorável ao vetor ao longo de várias semanas; a estrutura de defasagem do DLNM captura esse acúmulo. Reduzimos a flexibilidade da tendência (2 graus de liberdade por ano) porque a série tem cinco anos.',
        en: 'We fit the DLNM on the case count (n_casos) and GDD. Dengue risk rises with vector-favorable temperature accumulated over several weeks; the DLNM lag structure captures that accumulation. We reduce trend flexibility (2 df per year) because the series has five years.',
        es: 'Ajustamos el DLNM sobre el conteo de casos (n_casos) y el GDD.',
      },
    },
    {
      fn: 'sus_mod_plot_dlnm',
      values: { fit: stepRef('dengue-fit') },
      explain: {
        pt: 'Visualizamos a curva de exposição–defasagem–risco. Interprete o pico de lag junto com a biologia do vetor e faça sensibilidade da janela e da base térmica.',
        en: 'We visualize the exposure–lag–risk curve. Interpret the lag peak alongside vector biology and run sensitivity on the window and thermal base.',
        es: 'Visualizamos la curva de exposición–rezago–riesgo.',
      },
    },
  ],
}
