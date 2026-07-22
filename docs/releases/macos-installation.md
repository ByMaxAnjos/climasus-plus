# Instalação no macOS

Data de referência: 22 de julho de 2026

## Como instalar

1. Baixe o arquivo `climasus-plus_0.1.0_aarch64.dmg`.
2. Abra o `.dmg`.
3. Arraste `climasus-plus.app` para `Applications`.
4. Abra o app.

## Se o macOS bloquear na primeira abertura

Como esta beta ainda não está notarizada, o macOS pode impedir a abertura na primeira vez.

Use este fluxo:

1. Abra `Applications`.
2. Clique com o botão direito em `climasus-plus.app`.
3. Clique em `Abrir`.
4. Confirme novamente em `Abrir`.

Depois da primeira confirmação, o app tende a abrir normalmente nas próximas vezes.

## O que esperar ao abrir

- o app sobe o motor local automaticamente
- a interface deve mostrar o indicador `R` em estado pronto após a inicialização
- se o motor não subir, a interface pode entrar em modo offline com mensagem de diagnóstico

## Recomendações para testers

- testar instalação em um Mac diferente da máquina de desenvolvimento
- validar pelo menos um pipeline com tabela e um com gráfico
- testar exportação de CSV e PNG
- testar salvar e reabrir um projeto

## Verificação do arquivo baixado

SHA-256 esperado:

```text
1fc69a14fb27c6cd7443827e8ed4c00892a23f36733e6847da56ac00a74a2631
```
