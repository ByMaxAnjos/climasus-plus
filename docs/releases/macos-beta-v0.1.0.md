# climasus+ v0.1.0-beta-macos

Primeira beta pública controlada do aplicativo desktop `climasus+` para macOS.

## O que está incluído

- Aplicativo desktop macOS com o motor embutido.
- Execução visual de pipelines do `climasus4r`.
- Resultados com tabelas, gráficos estáticos e interativos quando disponíveis.
- Exportação de CSV, XLSX, Parquet, PNG e SVG.
- Salvamento e abertura de projetos `.climasus.json`.

## Status desta release

Esta release deve ser tratada como **beta controlado**.

O app já está funcional para uso externo inicial, mas ainda não é uma distribuição pública final ampla. Em especial:

- a assinatura atual é ad-hoc
- não há notarização Apple concluída
- o primeiro uso em outros Macs pode exigir `botão direito > Abrir`

## Artefato

- `climasus-plus_0.1.0_aarch64.dmg`

## Verificação do arquivo

- SHA-256: `1fc69a14fb27c6cd7443827e8ed4c00892a23f36733e6847da56ac00a74a2631`

## Instruções de instalação

Veja [macos-installation.md](https://github.com/ByMaxAnjos/climasus-plus/blob/main/docs/releases/macos-installation.md).

## Feedback desejado nesta beta

- instalação em Macs fora da máquina de desenvolvimento
- comportamento do motor ao abrir o app pela primeira vez
- exportação de tabelas e gráficos
- alternância entre visualização estática e interativa
- abertura de projetos salvos

## Limitações conhecidas

- o Gatekeeper do macOS pode mostrar aviso por falta de notarização
- alguns mapas/widgets dependem de preview PNG gerado pelo motor para oferecer alternância estático/interativo
- em ambientes sem navegador compatível instalado, alguns fluxos de snapshot de widget podem ser limitados

## Mensagem curta para o GitHub Release

`Beta macOS do climasus+ com motor embutido, execução local de pipelines, exportações e suporte inicial a gráficos interativos.`
