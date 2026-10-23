# Guia de Governança & Git Flow - ConecttaOps

## 🌳 Estrutura de Branches
* `main`: Produção estável e auditada.
* `develop`: Ambiente de homologação/integração.
* `feature/nome-da-funcionalidade`: Desenvolvimento de novas features (origem: `develop`).
* `fix/nome-do-bug`: Correções de bugs em homologação (origem: `develop`).
* `hotfix/nome-da-emergencia`: Correções urgentes diretas de produção (origem: `main`).

## 📝 Convenção de Commits (Conventional Commits)
Todas as mensagens de commit devem seguir o padrão:
`<tipo>(<escopo>): <descrição curta em português>`

### Tipos Permitidos:
* `feat`: Nova funcionalidade (ex: `feat(dashboard): adiciona filtro por linha operacional`)
* `fix`: Correção de bug (ex: `fix(api): remove prefixo OFI001 dos modelos`)
* `docs`: Alteração em documentação (ex: `docs(git): adiciona guia de git flow`)
* `refactor`: Refatoração de código sem alterar regra de negócio
* `test`: Adição ou correção de testes automatizados
* `chore`: Atualizações de dependências ou configurações gerais
