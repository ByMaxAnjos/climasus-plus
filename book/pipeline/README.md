# Biblioteca de pipelines do guia

Cada arquivo `.climasus.json` desta pasta é um **Projeto do climasus+ Studio**: o grafo
completo de um Pipeline, com Passos, ordem, Parâmetros e notas. O arquivo pode ser aberto
em **Arquivo → Abrir projeto** e salvo novamente em **Arquivo → Salvar projeto**.

A pasta `R/` contém o **espelho em código** de cada projeto, para quem prefere script,
versionamento em Git ou execução fora da interface. O `.json` e o `.R` descrevem o mesmo
Pipeline; o `.json` é a fonte para o Studio e o `.R` é a fonte para automação.

## Como usar

1. **No Studio**: baixe o `.climasus.json`, abra **Arquivo → Abrir projeto**, confira os
   Parâmetros (UF, período, CID, exposição) e execute.
2. **Em R**: abra o `.R` correspondente, ajuste os caminhos e rode com `climasus4r`
   instalado. O código é uma cadeia `sus_*()` com os mesmos argumentos do projeto.
3. **Compartilhar**: envie o `.json` **junto** com a fonte e o período dos dados, a versão
   do Studio/`climasus4r` e, quando possível, o checksum do arquivo analítico. O `.json`
   não contém dados nem Resultados.

## Pipelines

| Projeto | Capítulo | Passos | Código R | O que reproduz |
|---|---|---|---|---|
| [`pipeline-importacao-saude.climasus.json`](pipeline-importacao-saude.climasus.json) | Cap. 2 | 2 | [`R`](R/pipeline-importacao-saude.R) | Importa dados do DATASUS e gera o relatório de qualidade — o ponto de partida mínimo. |
| [`pipeline-preparacao-basica.climasus.json`](pipeline-preparacao-basica.climasus.json) | Cap. 2 | 7 | [`R`](R/00-preparacao.R) | Encoding, padronização, filtro CID, variáveis derivadas, agregação semanal e relatório de qualidade. |
| [`clima-aggregate-exposicao.climasus.json`](clima-aggregate-exposicao.climasus.json) | Cap. 3 | 6 | [`R`](R/01-integracao.R) | Saúde preparada + estações INMET + agregação com defasagens; opcionalmente preenche falhas. |
| [`mod-dlnm.climasus.json`](mod-dlnm.climasus.json) | Cap. 6 | 5 | [`R`](R/02-modelagem.R) | DLNM, curva exposição-resposta e fração atribuível a partir de uma tabela integrada. |
| [`ec-01-respiratorio-pediatrico.climasus.json`](ec-01-respiratorio-pediatrico.climasus.json) | Cap. 7 | 13 | [`R`](R/ec-01-respiratorio-pediatrico.R) | SIM-DO respiratório <5a no Sudeste (2015–2019), INMET, DLNM e AF. |
| [`ec-02-dengue-clima.climasus.json`](ec-02-dengue-clima.climasus.json) | Cap. 8 | 11 | [`R`](R/ec-02-dengue-clima.R) | SINAN dengue em CE/PE/BA/MA (2015–2019), GDD base 11 °C, DLNM e curva. |
| [`ec-03-cardio-idosos-calor.climasus.json`](ec-03-cardio-idosos-calor.climasus.json) | Cap. 9 | 15 | [`R`](R/ec-03-cardio-idosos-calor.R) | SIM-DO cardiovascular 60+ em São Paulo (2010–2019), ondas de calor, DLNM e AF. |
| [`ec-04-hospitalizacoes-frio.climasus.json`](ec-04-hospitalizacoes-frio.climasus.json) | Cap. 10 | 12 | [`R`](R/ec-04-hospitalizacoes-frio.R) | SIH-RD J09–J18 em Porto Alegre (2010–2019), ondas de frio e ITS com o evento de 2011-07-03. |
| [`tematico-ondas-calor.climasus.json`](tematico-ondas-calor.climasus.json) | Cap. 9 | 5 | [`R`](R/tematico-ondas-calor.R) | Detecção e visualização de ondas de calor (WHO p90) para São Paulo. |
| [`tematico-ondas-frio.climasus.json`](tematico-ondas-frio.climasus.json) | Cap. 10 | 5 | [`R`](R/tematico-ondas-frio.R) | Detecção e visualização de ondas de frio (WHO p10) para o Sul. |
| [`pipeline-qualidade-visualizacao.climasus.json`](pipeline-qualidade-visualizacao.climasus.json) | Cap. 2 | 5 | [`R`](R/qualidade-visualizacao.R) | Lê uma tabela, gera diagnóstico de qualidade e uma visualização rápida. |

## O que o `.json` preserva — e o que não preserva

**Preserva:** Funções escolhidas, ordem dos Passos, Parâmetros, notas do usuário, idioma,
tema e modo de uso (`schemaVersion` 4).

**Não preserva:** os dados de entrada, o cache local, os Resultados, os Artefatos, caminhos
absolutos, a versão do Studio nem a versão do `climasus4r`. Um projeto que abre não é, por
si só, uma análise reproduzível: ele é o **mapa do caminho**. A proveniência dos dados e a
versão do ambiente precisam acompanhar o arquivo.

## Adicionar um novo pipeline

1. Monte o Pipeline no Studio e use **Arquivo → Salvar projeto**.
2. Exporte o equivalente em **Exportar `.R`** e salve em `R/`.
3. Copie o `.climasus.json` para esta pasta e acrescente uma entrada em `manifest.json`
   (título, capítulo, descrição, modo e número de Passos).
4. Rode a validação abaixo: nomes de Função no catálogo, referências `@step:` resolvidas
   e IDs únicos.

## Validação

Os arquivos foram gerados a partir dos templates de catálogo do Studio
(`src/pipelines/templates.ts`), com ajustes para coincidir com os capítulos 7–10, e
validados contra o catálogo (`src/catalog/functions.json`): todos os `fn` existem, todos os
`@step:` apontam para um Passo do mesmo projeto e não há IDs duplicados.
