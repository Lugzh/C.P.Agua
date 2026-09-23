# Sistema C.P. Água — primeiro marco

Este repositório contém a base do módulo de Compras usando Next.js, TypeScript, Tailwind CSS, Prisma, MySQL e Zod.

## Desenvolvimento local

```bash
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm dev
```

A conexão real com o MySQL será validada quando o `DATABASE_URL` apontar para um banco disponível. Não use o usuário `root` na aplicação.

## Preparação do MySQL no Ubuntu/Oracle

Execute no servidor, depois de confirmar que possui um backup ou snapshot:

```bash
sudo mysql
```

Dentro do MySQL, crie um banco e um usuário exclusivo:

```sql
CREATE DATABASE cp_agua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cp_agua_app'@'localhost' IDENTIFIED BY 'SUBSTITUA_POR_UMA_SENHA_FORTE';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON cp_agua.* TO 'cp_agua_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

A senha real não deve ser colocada no GitHub nem enviada no chat. A porta `3306` deve continuar fechada na Oracle Cloud e no firewall público. Inicialmente o acesso deve ocorrer localmente no servidor, por túnel SSH ou por um backend privado.

## Migration inicial

Com o `.env` configurado no ambiente que executará as migrations:

```bash
pnpm prisma format
pnpm prisma validate
pnpm prisma migrate dev --name init_compras
pnpm prisma generate
```

Em produção, use migrations versionadas e:

```bash
pnpm prisma migrate deploy
```

## Próximas entregas

1. Seed de papéis e permissões.
2. Sessões seguras com cookie HTTP-only e hash de token.
3. Login e proteção de rotas.
4. Cadastro de fornecedores.
5. Solicitação de compras com cálculo decimal no backend.
6. Aprovação, reprovação com motivo, histórico e assinatura vinculada ao usuário.
7. Bloqueio de mutações após aprovação.
8. Envio ao Financeiro somente para solicitações aprovadas.
