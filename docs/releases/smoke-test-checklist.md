# Checklist de smoke test manual (Windows / macOS / Linux)

Objetivo: pegar bugs de classe "só acontece no app empacotado" — permissões do
Tauri, bundling de DLL/lib nativa, paths específicos de SO — que os scripts
`verify-ui`/`verify-run`/`verify-graph` não cobrem porque rodam contra
`npm run dev` no navegador, nunca contra o `.exe`/`.app`/`.AppImage` real.

Rodar em **cada SO alvo**, usando o instalador empacotado (não `tauri dev`),
antes de marcar uma release como pronta para beta nesse SO.

## Instalação

- [ ] Instalador roda em máquina limpa (não a de desenvolvimento).
- [ ] App abre e o motor R embutido sobe (indicador "pronto", sem modo offline).

## Downloads / exportação (cobre o bug de `fs:allow-write-file`)

- [ ] Baixar um resultado tipo tabela como CSV.
- [ ] Baixar o mesmo resultado como XLSX.
- [ ] Baixar o mesmo resultado como Parquet.
- [ ] Baixar um plot como PNG.
- [ ] Baixar um plot como SVG.
- [ ] Salvar um arquivo dentro de `$HOME` (caminho coberto pela permissão atual).
- [ ] Salvar um arquivo fora de `$HOME` (ex.: `D:\` no Windows, `/tmp` fora do
      home no Linux) — hoje isso ainda falha por escopo da permissão; confirmar
      que o erro aparece na tela (não fica em silêncio) em vez de assumir que
      vai funcionar.

## Mapa com limites municipais

- [ ] Rodar um pipeline com `sus_data_plot_aggregate_map` até o mapa coroplético.
- [ ] Confirmar que os limites municipais/estaduais aparecem (não caiu para
      mapa de bolhas).
- [ ] Se os limites não aparecerem, abrir o Console do passo e colar o texto
      "Aviso: ..." exato — isso decide se é bundling de `sf`/`geobr` no
      Windows, falha de rede/TLS em runtime, ou o bug de cache com `~`.

## Guia em app (book)

- [ ] Abrir o guia, clicar direto nas seções pela barra lateral — números
      corretos.
- [ ] Voltar para "Bem-vindo(a)" e clicar na lista dentro do conteúdo — números
      devem bater com a barra lateral (sem lista numerada paralela).

Marcar essa checklist como parte da seção "Cobertura de verificação" do
go/no-go de cada SO (ver `docs/release-macos-go-no-go.md` como modelo).
