# Colocando o sistema no ar com banco de dados (Supabase)

Este guia leva o Reservas Saint-Marc do modo local para o uso real: todos os moradores enxergam as mesmas reservas, em qualquer celular, e só a administração consegue aprovar, rejeitar e excluir.

Tempo estimado: 20 a 30 minutos. Custo: o plano gratuito do Supabase atende um condomínio com folga.

> Os nomes dos menus do painel do Supabase mudam de tempos em tempos. Se algum nome for um pouco diferente, procure o equivalente.

## O que muda no uso real

| | Modo local | Uso real |
| --- | --- | --- |
| Onde ficam as reservas | No navegador de cada pessoa | No banco (Supabase), compartilhado |
| Login da administração | Fictício, no código | Real (e-mail e senha), validado pelo servidor |
| Dois moradores no mesmo horário | Possível em aparelhos diferentes | Impossível: o banco recusa |
| Dados pessoais | Fictícios | Reais (nome e telefone), visíveis só para a administração |
| Como saber qual modo está ativo | Selo "Modo local" no topo | Sem o selo |

## Passo 1: criar o projeto

1. Entre em [supabase.com](https://supabase.com) e crie uma conta.
2. **New project**. Escolha um nome (ex.: `reservas-saint-marc`), crie uma senha forte para o banco (guarde em um gerenciador de senhas) e a região **South America (São Paulo)**.
3. Aguarde alguns minutos até o projeto ficar pronto.

## Passo 2: criar as tabelas e as regras

1. No menu lateral, abra **SQL Editor** e clique em **New query**.
2. Abra o arquivo [`supabase/schema.sql`](../supabase/schema.sql) deste repositório, copie **todo** o conteúdo e cole no editor.
3. Clique em **Run**. Deve aparecer *Success. No rows returned*.

Esse arquivo cria as tabelas (incluindo o cadastro de moradores, com senha criptografada), a regra que impede dois eventos no mesmo horário e as permissões de segurança. Pode ser executado de novo sem perder dados.

## Passo 3: criar a conta da administração

1. Menu **Authentication** > **Users** > **Add user** > **Create new user**.
2. Informe o e-mail e uma senha forte e marque **Auto Confirm User**. Clique em **Create user**.
3. Volte ao **SQL Editor**, abra [`supabase/criar-admin.sql`](../supabase/criar-admin.sql), troque `COLOQUE-O-EMAIL-DO-ADMIN-AQUI` pelo e-mail que você acabou de criar e clique em **Run**.
4. A consulta final deve mostrar **uma linha** com o e-mail. Se mostrar zero linhas, o e-mail está diferente do cadastrado.

Para ter mais de um administrador, crie outro usuário e repita o passo 3.

## Passo 4: bloquear cadastros públicos

Em **Authentication** > **Sign In / Providers** (ou *Settings*), desative **Allow new users to sign up**. Assim ninguém consegue criar conta sozinho. Mesmo que alguém criasse, o banco só libera os dados para quem está na tabela `admins`; esta etapa é uma camada extra.

## Passo 5: copiar o endereço e a chave

Em **Project Settings** > **API** (ou **API Keys**) copie:

- **Project URL**, algo como `https://abcdefghijkl.supabase.co`
- A chave **anon** (ou **publishable**)

> Use somente a chave pública (anon/publishable). Ela foi feita para ficar no navegador, e a segurança vem das regras do passo 2. **Nunca** coloque no projeto a chave `service_role` ou `secret`: ela ignora todas as regras.

## Passo 6: testar no seu computador

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Depois:

```bash
npm install
npm run dev
```

Confira:

1. O selo **Modo local** não aparece mais no topo. Se aparecer, as variáveis não foram lidas (confira o nome do arquivo e reinicie o `npm run dev`).
2. Faça uma reserva em **Reservar**. Ela deve aparecer como pendente.
3. Em **Administração**, entre com o e-mail e a senha do passo 3. A reserva deve estar lá.
4. Aprove a reserva e abra o site em outro aparelho (ou aba anônima): o horário aparece como ocupado, sem nome nem telefone.

## Passo 7: publicar

As duas variáveis precisam estar configuradas **na plataforma de publicação**, porque o arquivo `.env.local` não vai para o GitHub.

- **Vercel**: *Project Settings* > *Environment Variables*. Crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e faça um novo deploy.
- **Netlify**: *Site configuration* > *Environment variables*, com os mesmos nomes, e um novo deploy.
- **GitHub Pages**: no repositório, *Settings* > *Secrets and variables* > *Actions* > aba **Variables** > *New repository variable*. Crie as duas variáveis. O workflow `.github/workflows/deploy.yml` já lê esses valores no build.

Ao trocar variáveis, é preciso gerar um novo build: elas são gravadas no site durante o build, não lidas depois.

## Passo 8: configurar o WhatsApp (opcional)

Em `src/config.ts`, preencha `WHATSAPP_ADMINISTRACAO` com o número da administração (só dígitos, com código do país e DDD, ex.: `"5547999999999"`). Depois de reservar, o morador vê um botão que abre o WhatsApp com a mensagem pronta para avisar a administração.

O sistema não envia notificações sozinho. Na administração, o botão **WhatsApp** dos detalhes de cada reserva abre uma conversa com a mensagem pronta (aprovada, rejeitada ou cancelada).

## Como a segurança funciona

- Moradores (visitantes) **não leem** a tabela de reservas. Só chamam duas funções: `disponibilidade()`, que devolve datas, horários e status sem nome nem telefone, e `criar_reserva()`, que valida tudo antes de gravar.
- Somente quem está na tabela `admins` lê os dados completos, aprova, rejeita e exclui. A administração só consegue alterar o **status**; não edita nome nem telefone.
- A regra "dois eventos não ocupam o mesmo horário" é uma restrição do próprio banco. Se dois moradores tentam ao mesmo tempo, um é aceito e o outro recebe a mensagem de horário ocupado.
- Cada telefone pode ter até 5 reservas ativas e futuras. Isso reduz abuso.

### Limitações conhecidas

- **Reservas falsas:** qualquer pessoa com o link pode enviar pedidos. Como pedidos pendentes bloqueiam o horário, alguém mal-intencionado poderia ocupar datas até a administração rejeitar. A rejeição libera o horário na hora. Se virar problema, o próximo passo é adicionar um desafio anti-robô (por exemplo, Cloudflare Turnstile) antes do envio.
- **Sem notificações automáticas:** a administração precisa abrir o painel (ele atualiza sozinho a cada 30 segundos) ou ser avisada pelo WhatsApp do morador.
- **Dados pessoais (LGPD):** o sistema guarda nome, telefone e unidade dos moradores. Avise os moradores para que finalidade os dados são usados e exclua reservas antigas quando não forem mais necessárias.
- **Plano gratuito:** o Supabase pode pausar projetos que ficam muito tempo sem uso. Se o site avisar que não conseguiu carregar, entre no painel do Supabase e reative o projeto.

## Ajustes que exigem mexer nos dois lados

Alguns valores existem no app e também no banco. Se mudar um, mude o outro:

| O que | No app (`src/config.ts`) | No banco (`supabase/schema.sql`) |
| --- | --- | --- |
| Horário de funcionamento | `ABERTURA` e `FECHAMENTO` | `expediente_ok` (480 = 08:00, 1380 = 23:00) e `varios_dias_ok` |
| Máximo de dias seguidos | `MAX_DIAS_SEGUIDOS` | `datas_ok` e `criar_reserva` (valor 6 = 7 dias) |
| Limite por telefone | (não há) | `c_max_ativas` em `criar_reserva` |

Depois de editar o `schema.sql`, cole no SQL Editor e rode de novo. A lista de blocos (`CONDOMINIO.blocos`) só existe no app.

**Atualizando de uma versão anterior (v5.3 lista de espera, v5.4 datas bloqueadas):** cole de novo o `supabase/schema.sql` inteiro no SQL Editor e rode (cria só as tabelas novas `lista_espera` e `bloqueios`; nada é apagado).

## Problemas comuns

| Mensagem ou sintoma | Causa provável |
| --- | --- |
| O selo "Modo local" continua aparecendo | As variáveis não chegaram ao build. Confira os nomes (`VITE_...`), o arquivo `.env.local` e reinicie ou refaça o deploy. |
| "E-mail ou senha incorretos." | Senha errada ou usuário não confirmado. No Supabase, em *Users*, confira se o usuário está confirmado. |
| "Esta conta não tem permissão de administrador." | O usuário existe, mas o `criar-admin.sql` não foi executado com o e-mail dele. |
| "Sem conexão com o servidor." | Sem internet, URL do projeto errada ou projeto pausado. |
| "Não foi possível carregar as reservas." depois de rodar o SQL | Rode o `schema.sql` de novo e confira se ele terminou sem erros. |
| Reserva criada, mas o admin não vê | Confira se o e-mail da tabela `admins` é o mesmo do login (`select * from public.admins;`). |
