# Arquitetura

## Visão geral

Aplicação de página única em **React 19 + TypeScript + Vite**, com **CSS puro** (variáveis para tema claro e escuro) e roteamento pelo hash da URL (`#/admin`). As únicas dependências de produção são `react` e `react-dom`. O Supabase é acessado com `fetch`, sem biblioteca.

```
Páginas ──► Hooks (estado) ──► Serviços ──► localStorage  (modo local)
                                       └──► Supabase REST/RPC (modo conectado)
                    ▲
                    └── Utils (regras de negócio puras)
```

## Estrutura de pastas

```
src/
├── components/   Calendário, painel de reserva, formulários, modal, avisos
├── hooks/        useReservations (contexto), useAuth, useRoute, useTheme, useA11y
├── pages/        Início, Reservar, Login, Painel, Reservas, 404
├── services/     Acesso a dados: *.local.ts e *.remote.ts por assunto
├── styles/       base, layout, components, pages, eventos, a11y
├── temas/        Datas comemorativas: regras, aplicação e arte
├── types/        Tipos do domínio
├── utils/        Datas, telefone, regras, mensagens, agenda, bloqueios, espera
├── config.ts     Configuração do condomínio
├── App.tsx       Escolhe a página pela rota
└── main.tsx      Ponto de entrada e registro do service worker
public/           Ícones, manifest, service worker, foto e arte dos temas
supabase/         schema.sql e criar-admin.sql
scripts/          Gerador do arquivo único
standalone/       Arquivo único pronto
docs/             Esta documentação
```

## Dois modos, mesma interface

Cada assunto tem três arquivos em `src/services/`:

- `assunto.local.ts`: guarda no `localStorage` (modo local).
- `assunto.remote.ts`: usa o Supabase (modo conectado).
- `assunto.ts`: escolhe um dos dois com `MODO_DEMO`, que é verdadeiro quando as variáveis do Supabase não existem.

Assuntos: `reservations`, `auth`, `espera`, `bloqueios`. As funções têm as mesmas assinaturas assíncronas, então páginas e componentes não sabem qual modo está ativo. Para usar outro banco, crie uma terceira implementação.

## Estado

`useMorador` (contexto) guarda o cadastro do morador logado (sessão no navegador) e alimenta o preenchimento dos formulários; os serviços `moradores.local.ts` e `moradores.remote.ts` seguem o mesmo padrão dos demais. No modo local a conta do administrador é criada no primeiro acesso (`auth.local.ts`, hash com sal).

`useReservations` (contexto) carrega reservas, ocupação (reservas mais bloqueios como reservas fictícias, para o calendário), lista de espera e bloqueios, e expõe as ações. No modo conectado atualiza a cada 30 segundos e quando a aba volta a ficar visível.

## Robustez

- **Armazenamento:** `src/services/storage.ts` usa `localStorage` e, se o navegador bloquear, uma memória temporária. Todas as chaves começam com `reservas-saint-marc:`.
- **Rotas:** `useRoute` guarda a rota em memória e interpreta cliques em links `#/...`, funcionando mesmo em prévias restritas (iframe com sandbox).
- **Formulários:** os botões de envio funcionam por clique e por Enter, sem depender do envio nativo do navegador.
- **Janelas:** `Modal.tsx` usa `<dialog>` com alternativa para navegadores sem suporte.
- **Erros:** `ErrorBoundary` mostra uma tela de segurança em vez de deixar a página em branco.
- **Offline:** o service worker (`public/sw.js`) guarda a tela inicial; dados do banco exigem conexão.

## Temas de datas comemorativas

`src/temas/eventos.ts` define cada tema e quando ele vale (datas fixas e móveis calculadas por regra). `aplicar.ts` aplica as cores e o atributo `data-arte` no `<html>`. A arte (WebP em `public/eventos/`) é posicionada por `arte.ts`, com âncoras relativas ao texto e à foto, apenas em telas de 900 px ou mais.

## Acessibilidade

HTML semântico, `<dialog>` nativo, labels associados, foco visível, navegação por teclado, respeito a `prefers-reduced-motion` e um painel com tamanho de texto, alto contraste e outras opções (`A11yPanel`, `useA11y`, `a11y.css`).

## Convenções

Campos do domínio em português, iguais aos textos da interface (`nome`, `data`, `status: "pendente"`). Nomes técnicos em inglês (`createReservation`, `useReservations`, `Calendar`). Regras de negócio ficam em funções puras em `utils/`, fora dos componentes.
