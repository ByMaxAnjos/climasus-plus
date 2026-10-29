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
    { fn: 'sus_data_create_variables', values: { age_breaks: 'c(0, 5, 15, 60, Inf)', create_calendar_vars: 'TRUE' }, explain: {
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
      // Weekly resolution keeps the outcome compatible with the daily lag
      // structure used below. Monthly aggregation + daily lags (the old default)
      // made adjacent months' exposure windows overlap almost completely.
      values: { time_unit: 'week', group_by: 'codigo_municipio_residencia', complete_dates: 'TRUE' },
      explain: {
        pt: 'Agregamos a série por semana — resolução compatível com as defasagens em dias usadas no DLNM. A agregação mensal anterior deixava as janelas de meses vizinhos quase totalmente sobrepostas.',
        en: 'We aggregate the series by week — a resolution compatible with the daily lags used in the DLNM. The previous monthly aggregation made adjacent months\' exposure windows overlap almost completely.',
        es: 'Agregamos la serie por semana — una resolución compatible con los rezagos diarios usados en el DLNM.',
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
      id: 'resp-fill',
      fn: 'sus_climate_fill_inmet',
      values: { target_var: 'c("tair_dry_bulb_c", "rh_mean_porc")' },
      explain: {
        pt: 'Completamos as falhas das séries das estações (temperatura e umidade) com um modelo de aprendizado de máquina treinado por estação (XGBoost), para que defasagens e indicadores não tenham buracos. Estações com mais de 40% de falhas são excluídas. Pode levar vários minutos; para testar a qualidade do preenchimento antes, use `run_evaluation = TRUE`.',
        en: 'We fill the gaps in the station series (temperature and humidity) with a machine-learning model trained per station (XGBoost), so lags and indicators have no holes. Stations with more than 40% gaps are excluded. It can take several minutes; to test the quality of the filling first, use `run_evaluation = TRUE`.',
        es: 'Rellenamos los vacíos de las series de las estaciones (temperatura y humedad) con un modelo de aprendizaje automático entrenado por estación (XGBoost), para que rezagos e indicadores no tengan huecos. Se excluyen las estaciones con más de 40% de vacíos. Puede tardar varios minutos; para probar la calidad del relleno antes, use `run_evaluation = TRUE`.',
      },
    },
    {
      fn: 'sus_climate_aggregate',
      // The outcome is now weekly, so a 0–21 day lag is a genuine three-week
      // exposure window instead of a 0–30 day lag on monthly data.
      values: {
        health_data: stepRef('resp-spatial'),
        climate_data: stepRef('resp-fill'),
        climate_var: 'all',
        temporal_strategy: 'distributed_lag',
        lag_days: '21',
      },
      explain: {
        pt: 'Cruzamos saúde semanal e clima diário criando as colunas de defasagem de 0 a 21 dias para as variáveis climáticas disponíveis (incluindo temperatura e umidade). A janela de três semanas é um ponto de partida; teste 7/14/21 dias como sensibilidade. A umidade entra como covariável no modelo (lag 0) para reduzir confundimento.',
        en: 'We cross weekly health and daily climate, creating 0–21 day lag columns for the available climate variables (including temperature and humidity). The three-week window is a starting point; test 7/14/21 days as sensitivity. Humidity enters the model as a covariate (lag 0) to reduce confounding.',
        es: 'Cruzamos salud semanal y clima diario, creando columnas de rezago de 0 a 21 días para temperatura y humedad.',
      },
    },
    { id: 'resp-dlnm', fn: 'sus_mod_dlnm', values: { climate_col: 'tair_dry_bulb_c', covariates: 'rh_mean_porc_lag0', dof_per_year: '2' }, explain: {
      pt: 'Ajustamos o modelo DLNM sobre a série integrada. Reduzimos a flexibilidade da tendência (2 graus de liberdade por ano) para evitar sobreajuste em cinco anos de dados.',
      en: 'We fit the DLNM model over the integrated series. We reduce trend flexibility (2 df per year) to avoid overfitting five years of data.',
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
