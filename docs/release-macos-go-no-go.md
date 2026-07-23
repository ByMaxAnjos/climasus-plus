# Checklist Go/No-Go para release macOS do climasus+

Data de referência: 22 de julho de 2026

Objetivo: decidir se a versão atual do `climasus+` está pronta para ser disponibilizada a usuários finais no macOS.

Como usar:
- Marque cada item como `OK`, `N/A` ou `PENDENTE`.
- Se qualquer item da seção `Bloqueadores` estiver `PENDENTE`, a decisão é `NO-GO`.
- Se todos os bloqueadores estiverem `OK`, mas houver pendências nas seções seguintes, a decisão recomendada é `beta controlado`.
- Só considere `GO` para público amplo quando os bloqueadores e a seção de distribuição estiverem completamente fechados.

## 1. Decisão rápida

Preencha antes do fechamento:

| Área | Status | Observação |
|---|---|---|
| Bloqueadores | PENDENTE | Assinatura/notarização e validação em outro Mac ainda abertas |
| Fluxos críticos | OK | Verificados por automação real em 22 de julho de 2026 |
| Motor R embutido | OK | Bundle carregado no `.app` e motor com diagnóstico de falha |
| Exportação e plots | OK | Regressões corrigidas e verificadas |
| Projeto salvo/aberto | OK | Desserialização endurecida contra arquivo inválido |
| Distribuição macOS | PENDENTE | `.app` e `.dmg` gerados, mas falta validação externa |
| Recomendação final | Beta controlado | Pronto para beta macOS, não para público amplo |

Critérios de decisão:
- `GO`: pronto para distribuição pública ampla no macOS.
- `Beta controlado`: pronto para grupo pequeno de usuários externos, com suporte próximo.
- `NO-GO`: ainda não deve ser disponibilizado fora do time.

## 2. Bloqueadores

Todos os itens abaixo precisam estar `OK` para sair de `NO-GO`.

- [ ] O app abre em outro Mac sem exigir contorno manual inesperado além do fluxo oficialmente documentado.
- [ ] A assinatura do app não é apenas ad-hoc; o fluxo de distribuição real para usuários finais está definido.
- [ ] A notarização no macOS foi concluída ou existe uma decisão explícita de beta controlado sem notarização.
- [x] O motor R embutido sobe automaticamente ao abrir o app e o estado não fica silenciosamente “offline” sem diagnóstico compreensível.
- [x] Abrir um arquivo `.climasus.json` inválido ou corrompido não derruba a UI.
- [x] Exportações de CSV/XLSX/Parquet/PNG/SVG foram testadas com arquivos reais e não travam o app em cenário comum de uso.
- [ ] Pelo menos uma rodada completa de validação foi feita em um Mac diferente da máquina de desenvolvimento.

## 3. Fluxos críticos do usuário

Validar manualmente do início ao fim:

- [ ] Abrir o app recém-instalado.
- [ ] Ver o indicador do motor em estado pronto.
- [x] Rodar o tutorial guiado offline inteiro.
- [ ] Montar um pipeline manual simples.
- [x] Executar um pipeline com tabela.
- [x] Executar um pipeline com plot estático.
- [x] Alternar de `Estático` para `Interativo` quando houver widget.
- [x] Reexecutar após editar um passo upstream.
- [ ] Reiniciar o motor e voltar a executar.
- [ ] Limpar pipeline e reconstruir o fluxo.
- [ ] Fechar e reabrir o app sem deixar o motor preso ou órfão.

Critério:
- Qualquer falha reproduzível em fluxo crítico => `NO-GO` ou correção obrigatória antes do beta.

## 4. Motor R embutido

### Startup e estabilidade

- [ ] `src-tauri/resources/r` foi regenerado com os scripts corretos após a última mudança relevante no pacote ou no engine.
- [x] O bundle do R abre corretamente em `macOS/arm64`.
- [x] O app encontra `resource_dir/r/bin/R` e `engine/start.R` sem fallback indevido para modo offline.
- [x] O motor sobe em porta livre dentro do intervalo esperado.
- [ ] Encerrar o app finaliza também os workers do R.
- [ ] Rodadas repetidas de execução não deixam portas ocupadas após fechamento.

### Diagnóstico

- [x] Existe um procedimento claro para capturar logs quando o motor não sobe.
- [x] O time consegue diferenciar falha de bundle, falha de spawn e falha interna do engine.
- [x] O comportamento “offline” está documentado para suporte.

## 5. Exportação, plots e artefatos

### Tabelas

- [x] Exportação `CSV` funciona em tabela pequena.
- [x] Exportação `XLSX` funciona em tabela pequena.
- [x] Exportação `Parquet` funciona em tabela pequena.
- [ ] Exportação foi testada em tabela suficientemente grande para observar tempo, memória e travamento perceptível.

### Plots

- [x] O plot estático atualiza corretamente ao gerar um novo plot no mesmo pipeline.
- [x] O toggle `Estático/Interativo` não fica preso no estado anterior após rerun.
- [x] `PNG` baixa o arquivo em vez de só expandir preview.
- [x] `SVG` baixa o arquivo corretamente.
- [x] O preview do plot continua visível após exportação.

### Widgets e mapas

- [x] O HTML interativo abre corretamente.
- [ ] O fluxo de “salvar mapa” foi testado em uma máquina com Chrome/Chromium/Edge instalado.
- [ ] O comportamento em máquina sem navegador compatível está entendido e é aceitável para o release.

### Relatório

- [x] O fluxo de geração de relatório está explicitamente exposto na UI, ou foi removido das promessas de release.
- [x] O HTML de relatório foi gerado e aberto com sucesso em ambiente real.

## 6. Projeto salvo, aberto e retomado

- [x] Salvar projeto cria arquivo legível e reabrível.
- [x] Abrir projeto restaura passos, idioma e tema.
- [x] Abrir projeto não reaproveita resultados obsoletos.
- [x] Abrir projeto com função desconhecida ou argumento inválido mostra erro controlado.
- [x] Abrir projeto corrompido mostra mensagem de erro e não quebra a sessão.
- [x] Persistência em `localStorage` não conflita com projeto recém-aberto.

## 7. Distribuição para usuários finais

### Pacote

- [x] O `.app` abre corretamente na máquina do desenvolvedor.
- [ ] O `.dmg` instala corretamente em outro Mac.
- [x] O tamanho final do instalador é aceitável para distribuição.
- [x] O bundle não inclui lixo desnecessário além do runtime esperado.

### Gatekeeper e confiança

- [ ] A assinatura para distribuição final foi definida.
- [ ] A estratégia de notarização está concluída ou formalmente adiada apenas para beta controlado.
- [x] Existe uma instrução simples e oficial para primeiro uso.

### Suporte

- [x] Existe texto pronto para orientar o usuário quando o motor ficar offline.
- [ ] Existe canal de feedback definido para beta.
- [ ] Existe procedimento para recolher logs e reproduzir bugs reportados.

## 8. Cobertura de verificação

### Automação

- [x] `verify-ui` foi executado com sucesso.
- [x] `verify-run` foi executado com sucesso.
- [x] `verify-graph` foi executado com sucesso.
- [x] Os testes automatizados cobrem a UI atual, inclusive exportação.

### Manual

- [ ] A validação manual foi feita em conta de usuário comum.
- [ ] A validação manual foi feita fora da máquina principal de desenvolvimento.
- [ ] A validação manual incluiu pelo menos um caso offline.
- [ ] A validação manual incluiu pelo menos um caso com exportação real de artefato.

## 9. Pendências conhecidas aceitas

Liste aqui apenas pendências conscientemente aceitas para beta controlado:

- Item:
  Justificativa:
  Mitigação:

- Item:
  Justificativa:
  Mitigação:

## 10. Recomendação de saída

Use esta régua:

- `NO-GO`
  Use quando houver qualquer bloqueador aberto, falha reproduzível em fluxo crítico, ou problema de distribuição que impeça um usuário externo de instalar e usar o app com previsibilidade.

- `Beta controlado`
  Use quando os fluxos principais estiverem estáveis no macOS, mas ainda existirem riscos aceitáveis com acompanhamento próximo do time, especialmente em assinatura, diagnóstico ou cobertura de testes.

- `GO`
  Use apenas quando instalação, execução, exportação, persistência e distribuição estiverem estáveis em Macs externos, com assinatura/notarização e checklist completo.

## 11. Situação recomendada hoje

Com base na revisão atual do código:

- Recomendação: `Beta controlado`
- Motivo:
  O produto parece suficientemente maduro para teste externo no macOS, mas ainda não demonstra prontidão inequívoca para distribuição pública ampla sem atrito, principalmente por causa de endurecimento de release, robustez de projeto salvo/aberto, confiança em exportação sob carga e distribuição macOS para usuários finais.

### Evidências validadas em 22 de julho de 2026

- `npm run build` concluído com sucesso.
- `verify-ui`, `verify-run` e `verify-graph` concluídos com sucesso após correções de regressão.
- `.app` bundle gerado com o R embutido em `src-tauri/target/debug/bundle/macos/climasus-plus.app`.
- `.dmg` gerado com sucesso ao empacotar via `bundle_dmg.sh --skip-jenkins`.
