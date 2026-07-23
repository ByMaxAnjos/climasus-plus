# O Motor R é invisível para o usuário

O climasus+ embarca um R completo (`climasus4r` + dependências) como executor do Pipeline, mas o público-alvo são profissionais de saúde/pesquisa que não sabem — nem precisam saber — programar em R. **Decidimos tratar o R como detalhe interno: a UI chama o executor de "Motor" (nunca "Motor R"), e mensagens de erro/estado nunca citam R nem `.R`.**

O code-export continua existindo (é o modo de degradação quando não há Motor local, e o modo padrão da versão web "vitrine"), mas é recurso avançado, não o discurso principal. A promessa "rodar análise sem saber que R existe" é a razão de todo o esforço de embarcar e relocalizar o R no instalador — reverter (assumir R na UI) invalidaria essa proposta de valor.

## Consequences

- Toda cópia user-facing (i18n PT/ES/EN) deve evitar "R"/".R"/"engine". A cópia atual ainda viola isso ("Motor R offline", "export the .R code") — dívida a corrigir.
- Ver glossário: **Motor**, **Executar** em [CONTEXT.md](../../CONTEXT.md).
