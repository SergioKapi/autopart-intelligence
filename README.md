# AutoPart Intelligence

SaaS de catálogo inteligente e compatibilidade de peças automotivas.

## Stack

- **Frontend:** Next.js 14 + TypeScript + TailwindCSS
- **Backend:** NestJS + Prisma + PostgreSQL
- **Infra:** Docker Compose + Redis

## Setup rápido

```bash
# 1. Copie as variáveis de ambiente
cp .env.example .env

# 2. Suba os serviços de banco
docker-compose up postgres redis -d

# 3. Instale dependências e configure o banco
cd apps/api && npm install
npx prisma generate
npx prisma db push

# 4. Suba o backend
npm run start:dev

# 5. Em outro terminal, suba o frontend
cd apps/web && npm install
npm run dev
```

## URLs

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |

## Endpoints principais

### Auth
- `POST /auth/register` — Cadastro
- `POST /auth/login` — Login
- `GET /auth/me` — Usuário autenticado

### Peças
- `GET /parts` — Lista paginada
- `GET /parts/:id` — Detalhe com compatibilidades e equivalências
- `POST /parts` — Criar (requer auth ADMIN/TECHNICIAN)
- `PATCH /parts/:id` — Atualizar
- `DELETE /parts/:id` — Remover (requer auth ADMIN)

### Busca
- `GET /search?q=06H103495AH&type=partnumber` — Por part number
- `GET /search?q=bomba+alta+amarok&type=text` — Textual

### Veículos
- `GET /vehicles/brands` — Marcas
- `GET /vehicles/brands/:id/models` — Modelos
- `GET /vehicles/models/:id/versions` — Versões
- `GET /vehicles/versions/:id/parts` — Peças compatíveis

### Compatibilidade
- `GET /compatibility/parts/:id/equivalents` — Peças equivalentes
- `POST /compatibility/parts/:partId/vehicles/:versionId` — Adicionar compatibilidade

## Documentação

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Arquitetura completa + DDL PostgreSQL + ES schema
- [`docs/PRD.md`](docs/PRD.md) — PRD com épicos e user stories

## Estrutura

```
autopart-intelligence/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # NestJS backend
│       └── prisma/
│           └── schema.prisma
└── docs/
    ├── ARCHITECTURE.md
    └── PRD.md
```
