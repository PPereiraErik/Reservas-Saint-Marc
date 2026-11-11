# Instalação e publicação

## Requisitos

- [Node.js](https://nodejs.org/) 18.18 ou superior
- Git (para clonar o repositório)
- Para o modo conectado: uma conta gratuita no [Supabase](https://supabase.com)

## Executar no computador

```bash
git clone https://github.com/PPereiraErik/Reservas-Saint-Marc.git
cd Reservas-Saint-Marc
npm install
npm run dev
```

O navegador abre em `http://localhost:5173` no **modo local**: começa vazio, sem nenhuma informação. Abra **Administração** e crie o e-mail e a senha do administrador (mínimo de 8 caracteres): só essa conta entra depois disso.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Confere os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Abre o build de produção localmente |
| `npm run typecheck` | Só confere os tipos do TypeScript |
| `npm run build:standalone` | Gera `standalone/reservas-saint-marc.html`, um arquivo único |

## Arquivo único (sem instalar nada)

`standalone/reservas-saint-marc.html` contém o sistema inteiro. Salve no aparelho e abra direto no Chrome ou Safari. Funciona sem internet e sempre no modo local. Não abra o arquivo por dentro de visualizadores (WhatsApp, e-mail, Drive): eles bloqueiam armazenamento e envio de formulários.

## Ativar o modo conectado

1. Siga o [guia do Supabase](SETUP_SUPABASE.md): criar o projeto, rodar `supabase/schema.sql`, criar a conta de administrador e copiar a URL e a chave pública.
2. Copie `.env.example` para `.env.local` e preencha:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

3. Reinicie o `npm run dev`. O selo "Modo local" some do topo e o login passa a usar a conta criada no Supabase.

> Use apenas a chave pública (anon/publishable). Nunca coloque a chave `service_role`.

Ao atualizar o sistema para uma versão nova, rode `supabase/schema.sql` de novo: o arquivo é seguro de repetir e cria as tabelas que faltarem (lista de espera, bloqueios, cadastro de moradores).

## Publicar

O build gera arquivos estáticos em `dist/`, com caminhos relativos. Não é preciso servidor.

| Plataforma | Como |
| --- | --- |
| **Vercel** | Importe o repositório em vercel.com/new. O Vite é detectado sozinho (build `npm run build`, saída `dist`). |
| **Netlify** | Importe o repositório com build `npm run build` e pasta `dist`. |
| **GitHub Pages** | O workflow `.github/workflows/deploy.yml` publica a cada push na `main`. Ative em *Settings > Pages > Source: GitHub Actions*. |

Para publicar no **modo conectado**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na plataforma (no GitHub Pages, em *Settings > Secrets and variables > Actions > Variables*) e gere um novo build.

Depois de publicar, defina `SITE_URL` em `src/config.ts` com o endereço final, para que ele apareça nas mensagens da lista de espera.

## Atualizar os aparelhos instalados

O aplicativo instalado guarda a tela inicial em cache. Para forçar a atualização em todos os aparelhos, mude `VERSAO` em `public/sw.js` antes de publicar.

## Solução de problemas

| Sintoma | Causa provável |
| --- | --- |
| Tela em branco no arquivo único | Aberto dentro de um visualizador. Abra direto no navegador. |
| "Não foi possível carregar as reservas" no modo conectado | URL ou chave erradas, ou `schema.sql` não executado. |
| Administrador não entra | O e-mail não está na tabela `admins` (rode `supabase/criar-admin.sql`). |
| Reserva recusada com "horário ocupado" | Outro morador reservou antes; é o comportamento esperado. |
