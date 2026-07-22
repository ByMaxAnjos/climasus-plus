# Publicação no GitHub Release

Este projeto já tem o `.dmg` pronto localmente, mas a sessão atual do Codex não tem um comando disponível para:

- criar um repositório GitHub novo
- criar um GitHub Release com upload de binário

Por isso, este arquivo descreve o fechamento manual mínimo.

## Recomendação

Publicar como:

- repositório: preferencialmente um repositório dedicado do app, por exemplo `climasus/climasus-plus`
- tag: `v0.1.0-beta-macos`
- título da release: `climasus+ v0.1.0-beta-macos`
- tipo: `Pre-release`

## Arquivos para anexar

- `src-tauri/target/debug/bundle/macos/climasus-plus_0.1.0_aarch64.dmg`

## Texto da release

Use o conteúdo de [macos-beta-v0.1.0.md](./macos-beta-v0.1.0.md).

## Checklist de publicação

1. Criar o repositório no GitHub.
2. Marcar o repositório como público, se essa for a estratégia da beta.
3. Subir pelo menos `README.md`, `LICENSE` e a documentação inicial.
4. Criar a tag `v0.1.0-beta-macos`.
5. Criar um `Pre-release`.
6. Anexar o arquivo `.dmg`.
7. Colar as notas da release.
8. Publicar.

## Observação importante

Como esta beta ainda não está assinada com `Developer ID` nem notarizada pela Apple, o texto da release deve avisar explicitamente que:

- esta é uma beta controlada
- o primeiro uso pode exigir `botão direito > Abrir`
