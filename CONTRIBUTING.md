# Como contribuir

## Branches

| Branch           | Sai de | PR para | Para quê                                 |
| ---------------- | ------ | ------- | ---------------------------------------- |
| `feature/<nome>` | `dev`  | `dev`   | qualquer mudança (também aceita `feat/`) |
| `release/X.Y.Z`  | `dev`  | `main`  | levar o que está na `dev` para produção  |
| `hotfix/X.Y.Z`   | `main` | `main`  | correção urgente em produção             |

Ninguém faz push direto em `main` nem em `dev`: tudo entra por PR.

## Fluxo de uma PR

1. Atualize a branch de origem (`git pull`) e crie a sua a partir dela.
2. Antes do push, rode as mesmas checagens do CI:
   ```bash
   npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
   ```
3. Abra a PR para o destino da tabela. O CI (`verificar`) roda sozinho.
4. Quando a PR for aprovada, a automação ([pr-automacao.yml](.github/workflows/pr-automacao.yml)) espera o CI passar e faz o merge. Em `release/` e `hotfix/`, ela também cria a tag `vX.Y.Z`, a release e leva a `main` de volta para a `dev`. Não faça merge à mão.
5. Se a automação disser que a branch está desatualizada, faça merge do destino na sua branch e peça nova aprovação.

Regras do projeto (o front não calcula, nada de nome fixo de seção, segurança): ver [README.md](README.md). Lista de tarefas: [TODO.md](TODO.md).

## Configuração do repositório (só o dono)

Feita uma vez, em Settings no GitHub:

1. **Branch `dev`** criada a partir da `main`.
2. **GitHub App** (Settings da conta > Developer settings > GitHub Apps), instalado neste repositório, com permissões de repositório: Contents, Pull requests e Workflows em leitura e escrita; Checks, Commit statuses e Metadata em leitura. Em Settings > Secrets and variables > Actions: variável `APP_ID` e segredo `APP_PRIVATE_KEY` (a chave `.pem` do App).
3. **Rulesets** (Settings > Rules > Rulesets) para `main` e `dev`: PR obrigatória com 1 aprovação, aprovação do dono do código (CODEOWNERS), check obrigatório `verificar`, bloqueio de force push e de exclusão. No bypass: o GitHub App e o papel Admin.
4. **Colaboradores** com papel Write, não Admin (Admin passa por cima dos rulesets).
