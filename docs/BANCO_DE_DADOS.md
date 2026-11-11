# Banco de dados (modo conectado)

PostgreSQL no Supabase. Todo o esquema está em [`supabase/schema.sql`](../supabase/schema.sql), que pode ser executado várias vezes sem perder dados.

## Tabelas

| Tabela | Conteúdo | Quem lê | Quem escreve |
| --- | --- | --- | --- |
| `reservas` | Reservas com período, horários, status e dados do morador | Só administração | Visitantes criam pela função `criar_reserva`; administração altera o status e exclui |
| `atividades` | Histórico (criada, aprovada, rejeitada, cancelada, excluída) | Só administração | Gerada automaticamente por gatilho |
| `admins` | Usuários com permissão de administrador | Só o próprio sistema | Via `supabase/criar-admin.sql` |
| `lista_espera` | Moradores aguardando um dia | Só administração | Visitantes pela função `entrar_lista_espera`; administração remove |
| `bloqueios` | Dias em que o salão está fechado | Público (só leitura) | Só administração |
| `moradores` | Cadastro por apartamento (nome, telefone, bloco, apartamento e senha criptografada) | Só administração, e sem a coluna da senha | Visitantes pelas funções `cadastrar_morador` e `atualizar_morador`; administração remove |

## Funções

| Função | Para quê |
| --- | --- |
| `disponibilidade()` | Devolve só datas, horários e status ocupados, sem dados pessoais. É o que o calendário público usa. |
| `criar_reserva(...)` | Valida tudo no servidor (datas, períodos, bloqueios, limite por telefone, conflito) e cria a reserva como pendente. |
| `entrar_lista_espera(...)` | Valida e registra a espera. |
| `is_admin()` | Verifica se o usuário logado está em `admins`. |
| `cadastrar_morador(...)` | Cria o cadastro de um apartamento, com a senha em `bcrypt` (pgcrypto). Recusa apartamento já cadastrado e senha fora de 4 a 6 números. |
| `entrar_morador(...)` | Confere a senha e devolve nome e telefone. Conta as tentativas erradas e bloqueia o apartamento por 15 minutos depois de 5. |
| `atualizar_morador(...)` | Atualiza nome e telefone, com a mesma verificação de senha. |
| `verificar_morador(...)` | Uso interno das funções acima; não é exposta pela API. |

## Segurança

- **Row Level Security** ativa em todas as tabelas. Visitantes (`anon`) não leem reservas, atividades, admins nem a lista de espera.
- Administradores só alteram a coluna `status` das reservas; não editam nome, telefone ou horário.
- As funções que criam reservas e esperas são `security definer` e validam os dados dentro do banco.
- A chave usada no navegador é a pública (anon/publishable). Nunca use a `service_role`.
- Desative o cadastro público de usuários (passo 4 do [guia](SETUP_SUPABASE.md)).

## Restrições importantes

- `sem_conflito`: restrição de exclusão (`exclude using gist`) que impede reservas ativas sobrepostas, mesmo sob concorrência.
- `expediente_ok`: horário entre 08:00 e 23:00.
- `datas_ok` e `varios_dias_ok`: no máximo 7 dias seguidos, sempre dia todo.
- `telefone_ok`, `apartamento_ok`, `nome_ok`, `observacoes_ok`: formato e tamanho dos dados.
- `espera_unica`: um telefone só entra uma vez na espera de cada dia.

## Alterando regras no banco

Horário de funcionamento e limite de dias estão nas restrições `expediente_ok`, `datas_ok` e `varios_dias_ok` e dentro de `criar_reserva`. Altere também `src/config.ts` para que a interface acompanhe. O limite de 5 reservas ativas por telefone é a constante `c_max_ativas` em `criar_reserva`.

## Cópia de segurança

No plano gratuito do Supabase, exporte periodicamente a tabela `reservas` (Table Editor > Export to CSV) se quiser manter um histórico próprio.
