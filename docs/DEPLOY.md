# Deploy — Railway (API) + Locaweb (Frontend)

## Visão geral

```
Usuário → Locaweb (HTML/CSS/JS estático)
                  ↓ chamadas API
           Railway (NestJS + PostgreSQL)
```

---

## 1. Backend → Railway

### 1.1 Pré-requisitos
- Conta em [railway.app](https://railway.app)
- GitHub com o projeto (ou deploy direto via CLI)

### 1.2 Configurar o projeto no Railway

1. No painel Railway → **New Project → Deploy from GitHub repo**
2. Selecione o repositório
3. Railway detecta Node.js automaticamente

### 1.3 Adicionar PostgreSQL

1. No projeto Railway → **+ New → Database → PostgreSQL**
2. Railway gera `DATABASE_URL` automaticamente e injeta como variável de ambiente

### 1.4 Variáveis de ambiente (Settings → Variables)

```
JWT_SECRET=gere_uma_chave_aleatoria_forte_aqui
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://seudominio.com.br
```

> `DATABASE_URL` já vem preenchido automaticamente pelo PostgreSQL do Railway.

### 1.5 Configurar o Root Directory

Em **Settings → Source** → Root Directory: `apps/api`

### 1.6 Adicionar Dockerfile na API

Crie `apps/api/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/main"]
```

### 1.7 Rodar migrations

No Railway → **Settings → Deploy → Start Command**:
```
npx prisma migrate deploy && node dist/main
```

### 1.8 Pegar a URL da API

Após o deploy: **Settings → Networking → Generate Domain**

Você vai receber algo como: `https://autopart-api-production.up.railway.app`

---

## 2. Frontend → Locaweb (estático)

### 2.1 Configurar URL da API

No arquivo `apps/web/.env.production`, crie:
```
NEXT_PUBLIC_API_URL=https://autopart-api-production.up.railway.app
```

### 2.2 Gerar o build estático

```bash
cd apps/web
npm install
npm run build
```

Isso gera a pasta `apps/web/out/` com HTML/CSS/JS puro.

### 2.3 Fazer upload para Locaweb

**Via FTP (FileZilla ou similar):**

1. Acesse o painel Locaweb → **Hospedagem → Acesso FTP**
2. Pegue os dados: host, usuário, senha
3. No FileZilla, conecte e navegue até `public_html/`
4. **Arraste todo o conteúdo de `apps/web/out/`** para `public_html/`

**Via Gerenciador de Arquivos do painel Locaweb:**

1. Painel → **Gerenciador de Arquivos**
2. Acesse `public_html/`
3. Faça upload dos arquivos da pasta `out/`

### 2.4 Configurar .htaccess (SPA routing)

Crie um arquivo `.htaccess` em `public_html/`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]
```

> Isso garante que rotas como `/busca` e `/auth/login` funcionem corretamente.

---

## 3. CORS — Liberar Locaweb → Railway

No backend (`apps/api/src/main.ts`), o CORS já está configurado para ler `FRONTEND_URL`.

Certifique-se de que a variável no Railway esteja com o domínio correto:
```
FRONTEND_URL=https://seudominio.com.br
```

---

## 4. Checklist de deploy

### Railway (API)
- [ ] Repositório conectado
- [ ] PostgreSQL adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] Root directory: `apps/api`
- [ ] Start command com migrate + start
- [ ] Domain gerado e funcionando
- [ ] `GET https://sua-api.railway.app/auth/me` retorna 401 (API online)

### Locaweb (Frontend)
- [ ] `.env.production` com URL correta da Railway API
- [ ] `npm run build` executado sem erros
- [ ] Pasta `out/` enviada para `public_html/`
- [ ] `.htaccess` criado em `public_html/`
- [ ] Site abre em `https://seudominio.com.br`
- [ ] Busca por part number funciona

---

## 5. Atualizações futuras

**API (Railway):** push no GitHub → deploy automático.

**Frontend (Locaweb):**
```bash
cd apps/web && npm run build
# FTP: re-upload da pasta out/ para public_html/
```

> Considere automatizar com GitHub Actions + FTP deploy para o Locaweb.
