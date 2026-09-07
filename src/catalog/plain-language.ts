// Plain-language (no statistical jargon) titles/descriptions for Vigilância mode, covering only
// the functions used by the 4 ready-made templates (src/templates/). Any function without an
// entry here falls back to the technical FRIENDLY text in friendly.ts — see friendlyName/
// friendlyDescription in catalog/index.ts.

import type { Lang } from '../store/pipeline'

export type PlainEntry = { title: Record<Lang, string>; description: Record<Lang, string> }

export const PLAIN_LANGUAGE: Record<string, PlainEntry> = {
  sus_data_import: {
    title: { pt: 'Trazer os dados do sistema de saúde', en: 'Bring in the health-system data', es: 'Traer los datos del sistema de salud' },
    description: {
      pt: 'Baixa os registros oficiais (mortes, internações, casos notificados) direto do DATASUS para o período e o local escolhidos.',
      en: 'Downloads the official records (deaths, hospitalizations, notified cases) straight from DATASUS for the chosen period and place.',
      es: 'Descarga los registros oficiales (muertes, internaciones, casos notificados) directo de DATASUS para el período y el lugar elegidos.',
    },
  },
  sus_data_clean_encoding: {
    title: { pt: 'Corrigir letras erradas nos textos', en: 'Fix garbled text', es: 'Corregir letras erróneas en los textos' },
    description: {
      pt: 'Corrige acentos e caracteres que costumam vir quebrados nos arquivos do DATASUS (ex.: "São Paulo" virando texto ilegível).',
      en: 'Fixes accents and characters that commonly come broken in DATASUS files (e.g. "São Paulo" turning into unreadable text).',
      es: 'Corrige acentos y caracteres que suelen venir rotos en los archivos de DATASUS.',
    },
  },
  sus_data_standardize: {
    title: { pt: 'Padronizar nomes e categorias', en: 'Standardize names and categories', es: 'Estandarizar nombres y categorías' },
    description: {
      pt: 'Deixa os nomes de coluna e as categorias (sexo, raça etc.) num formato único, para as próximas etapas funcionarem sem ajuste manual.',
      en: 'Puts column names and categories (sex, race, etc.) into one consistent format so the next steps work without manual tweaking.',
      es: 'Deja los nombres de columna y las categorías en un formato único.',
    },
  },
  sus_data_filter_cid: {
    title: { pt: 'Selecionar a doença de interesse', en: 'Select the disease of interest', es: 'Seleccionar la enfermedad de interés' },
    description: {
      pt: 'Mantém só os registros da doença ou grupo de doenças que você quer estudar (ex.: dengue, causas respiratórias, cardiovasculares).',
      en: 'Keeps only the records for the disease or disease group you want to study (e.g. dengue, respiratory causes, cardiovascular).',
      es: 'Mantiene solo los registros de la enfermedad o grupo de enfermedades de interés.',
    },
  },
  sus_data_create_variables: {
    title: { pt: 'Criar faixas de idade e data', en: 'Create age and calendar groupings', es: 'Crear franjas de edad y fecha' },
    description: {
      pt: 'Cria colunas úteis para analisar depois, como faixa etária e semana/mês do ano.',
      en: 'Creates useful columns for later analysis, like age group and week/month of year.',
      es: 'Crea columnas útiles para analizar después, como franja etaria y semana/mes del año.',
    },
  },
  sus_data_filter_demographics: {
    title: { pt: 'Recortar o grupo populacional', en: 'Narrow down the population group', es: 'Recortar el grupo poblacional' },
    description: {
      pt: 'Mantém só o grupo de pessoas de interesse (ex.: idosos, crianças menores de 5 anos).',
      en: 'Keeps only the population group of interest (e.g. elderly, children under 5).',
      es: 'Mantiene solo el grupo de personas de interés.',
    },
  },
  sus_data_aggregate: {
    title: { pt: 'Somar os casos ao longo do tempo', en: 'Add up cases over time', es: 'Sumar los casos a lo largo del tiempo' },
    description: {
      pt: 'Transforma registros individuais em uma contagem por período (dia, semana ou mês) — o formato que os próximos passos precisam.',
      en: 'Turns individual records into a count per period (day, week, or month) — the format the next steps need.',
      es: 'Transforma registros individuales en un conteo por período (día, semana o mes).',
    },
  },
  sus_climate_inmet: {
    title: { pt: 'Trazer dados de temperatura das estações', en: 'Bring in station temperature data', es: 'Traer datos de temperatura de las estaciones' },
    description: {
      pt: 'Baixa a temperatura registrada pelas estações meteorológicas do INMET para o período e local escolhidos.',
      en: 'Downloads the temperature recorded by INMET weather stations for the chosen period and place.',
      es: 'Descarga la temperatura registrada por las estaciones meteorológicas del INMET.',
    },
  },
  sus_climate_aggregate: {
    title: { pt: 'Juntar saúde e clima na mesma tabela', en: 'Combine health and climate into one table', es: 'Unir salud y clima en la misma tabla' },
    description: {
      pt: 'Une a série de casos de saúde à série de clima, no mesmo período, para poder relacionar os dois depois.',
      en: 'Merges the health-case series with the climate series over the same period, so the two can be related afterwards.',
      es: 'Une la serie de casos de salud a la serie de clima, en el mismo período.',
    },
  },
  sus_grid_chirps: {
    title: { pt: 'Trazer dados de chuva por satélite', en: 'Bring in satellite rainfall data', es: 'Traer datos de lluvia por satélite' },
    description: {
      pt: 'Baixa a chuva acumulada estimada por satélite, útil onde não há estação meteorológica próxima.',
      en: 'Downloads satellite-estimated accumulated rainfall, useful where no nearby weather station exists.',
      es: 'Descarga la lluvia acumulada estimada por satélite.',
    },
  },
  sus_grid_join: {
    title: { pt: 'Juntar saúde e ambiente por município', en: 'Combine health and environment by municipality', es: 'Unir salud y ambiente por municipio' },
    description: {
      pt: 'Une a série de casos de saúde ao dado ambiental (chuva, poluição etc.) de cada município.',
      en: 'Merges the health-case series with the environmental data (rainfall, pollution, etc.) for each municipality.',
      es: 'Une la serie de casos de salud al dato ambiental de cada municipio.',
    },
  },
  sus_climate_compute_heatwaves: {
    title: { pt: 'Detectar dias de onda de calor', en: 'Detect heatwave days', es: 'Detectar días de ola de calor' },
    description: {
      pt: 'Marca quais dias, na série de temperatura, contam como onda de calor, usando um critério padrão internacional.',
      en: 'Flags which days in the temperature series count as a heatwave, using a standard international criterion.',
      es: 'Marca qué días de la serie de temperatura cuentan como ola de calor.',
    },
  },
  sus_climate_compute_coldwaves: {
    title: { pt: 'Detectar dias de onda de frio', en: 'Detect cold-wave days', es: 'Detectar días de ola de frío' },
    description: {
      pt: 'Marca quais dias, na série de temperatura, contam como onda de frio, usando um critério padrão internacional.',
      en: 'Flags which days in the temperature series count as a cold wave, using a standard international criterion.',
      es: 'Marca qué días de la serie de temperatura cuentan como ola de frío.',
    },
  },
  sus_mod_dlnm: {
    title: { pt: 'Estimar o risco ligado ao clima', en: 'Estimate the climate-linked risk', es: 'Estimar el riesgo ligado al clima' },
    description: {
      pt: 'Estima como o risco de saúde muda conforme a temperatura, considerando que o efeito pode aparecer dias depois da exposição.',
      en: 'Estimates how health risk changes with temperature, accounting for the effect showing up days after exposure.',
      es: 'Estima cómo cambia el riesgo de salud según la temperatura, considerando que el efecto puede aparecer días después.',
    },
  },
  sus_mod_af: {
    title: { pt: 'Calcular quantos casos são por causa do clima', en: 'Calculate how many cases are climate-caused', es: 'Calcular cuántos casos son por causa del clima' },
    description: {
      pt: 'Traduz o risco estimado em um número e uma proporção: quantos casos, no período estudado, são atribuíveis ao clima.',
      en: 'Translates the estimated risk into a number and a proportion: how many cases, in the studied period, are attributable to climate.',
      es: 'Traduce el riesgo estimado en un número y una proporción atribuible al clima.',
    },
  },
  sus_mod_its: {
    title: { pt: 'Avaliar o efeito de um período específico', en: 'Assess the effect of a specific period', es: 'Evaluar el efecto de un período específico' },
    description: {
      pt: 'Compara o antes e o depois de um evento (como uma onda de frio) para ver se ele realmente mudou os números de saúde.',
      en: 'Compares before and after an event (like a cold wave) to see whether it actually changed the health numbers.',
      es: 'Compara el antes y el después de un evento para ver si realmente cambió los números de salud.',
    },
  },
  sus_mod_plot_af: {
    title: { pt: 'Ver o gráfico de casos atribuíveis', en: 'View the attributable-cases chart', es: 'Ver el gráfico de casos atribuibles' },
    description: {
      pt: 'Mostra em gráfico e tabela quantos casos são atribuíveis ao clima, pronto para apresentar.',
      en: 'Shows, as a chart and table, how many cases are climate-attributable, ready to present.',
      es: 'Muestra en gráfico y tabla cuántos casos son atribuibles al clima.',
    },
  },
  sus_mod_plot_dlnm: {
    title: { pt: 'Ver a curva de risco', en: 'View the risk curve', es: 'Ver la curva de riesgo' },
    description: {
      pt: 'Mostra em gráfico como o risco de saúde muda com a temperatura e com os dias após a exposição.',
      en: 'Shows as a chart how health risk changes with temperature and with days since exposure.',
      es: 'Muestra en gráfico cómo cambia el riesgo de salud con la temperatura.',
    },
  },
}
