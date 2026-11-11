-- =====================================================================
-- Reservas Saint-Marc | Banco de dados (Supabase / PostgreSQL)
--
-- Como usar: Supabase > SQL Editor > New query > cole este arquivo > Run.
-- É seguro rodar mais de uma vez (não apaga reservas existentes).
--
-- Como a segurança funciona:
--  * Moradores (anon) NÃO leem a tabela de reservas. Eles só chamam duas
--    funções: disponibilidade() (sem nome nem telefone) e criar_reserva().
--  * Somente quem está na tabela "admins" lê, aprova, rejeita e exclui.
--  * Dois eventos nunca ocupam o mesmo horário: quem garante isso é o
--    próprio banco (restrição "sem_conflito"), mesmo com dois moradores
--    reservando no mesmo segundo.
-- =====================================================================


-- ---------- Reservas -------------------------------------------------
create table if not exists public.reservas (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  telefone     text not null,
  bloco        text not null,
  apartamento  text not null,
  data         date not null,           -- primeiro dia
  data_fim     date not null,           -- último dia (igual a "data" em reserva de um dia)
  periodo      text not null,
  inicio       text not null,           -- "HH:MM", em cada dia da reserva
  fim          text not null,
  observacoes  text not null default '',
  status       text not null default 'pendente',
  criada_em    timestamptz not null default now(),

  -- Horários em minutos (08:00 = 480). Servem para comparar sobreposição.
  inicio_min   integer generated always as (substr(inicio, 1, 2)::int * 60 + substr(inicio, 4, 2)::int) stored,
  fim_min      integer generated always as (substr(fim, 1, 2)::int * 60 + substr(fim, 4, 2)::int) stored,

  constraint nome_ok          check (char_length(btrim(nome)) between 3 and 100),
  constraint telefone_ok      check (telefone ~ '^\(\d{2}\) \d{4,5}-\d{4}$'),
  constraint bloco_ok         check (char_length(btrim(bloco)) between 1 and 40),
  constraint apartamento_ok   check (apartamento ~ '^\d{1,4}$'),
  constraint observacoes_ok   check (char_length(observacoes) <= 500),
  constraint periodo_ok       check (periodo in ('manha', 'tarde', 'noite', 'dia-todo', 'personalizado')),
  constraint status_ok        check (status in ('pendente', 'aprovada', 'rejeitada', 'cancelada')),
  constraint inicio_formato   check (inicio ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  constraint fim_formato      check (fim ~ '^([01]\d|2[0-3]):[0-5]\d$'),

  -- Horário de funcionamento: 08:00 às 23:00 (igual a ABERTURA/FECHAMENTO em src/config.ts).
  constraint expediente_ok    check (fim_min > inicio_min and inicio_min >= 480 and fim_min <= 1380),
  -- No máximo 7 dias seguidos (igual a MAX_DIAS_SEGUIDOS em src/config.ts).
  constraint datas_ok         check (data_fim >= data and data_fim - data <= 6),
  -- Vários dias seguidos sempre ocupam o dia todo.
  constraint varios_dias_ok   check (data_fim = data or (periodo = 'dia-todo' and inicio_min = 480 and fim_min = 1380)),

  -- Reservas pendentes ou aprovadas não podem se sobrepor em data E horário.
  -- Rejeitadas e canceladas liberam o horário.
  constraint sem_conflito exclude using gist (
    daterange(data, data_fim, '[]') with &&,
    int4range(inicio_min, fim_min, '[)') with &&
  ) where (status in ('pendente', 'aprovada'))
);

create index if not exists reservas_data_idx on public.reservas (data, data_fim);


-- ---------- Atividade recente (painel do administrador) --------------
create table if not exists public.atividades (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in ('criada', 'aprovada', 'rejeitada', 'cancelada', 'excluida')),
  nome          text not null,
  data_reserva  date not null,
  em            timestamptz not null default now()
);

create index if not exists atividades_em_idx on public.atividades (em desc);

create or replace function public.registrar_atividade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.atividades (tipo, nome, data_reserva) values ('criada', new.nome, new.data);
    return new;
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status and new.status <> 'pendente' then
      insert into public.atividades (tipo, nome, data_reserva) values (new.status, new.nome, new.data);
    end if;
    return new;
  else
    insert into public.atividades (tipo, nome, data_reserva) values ('excluida', old.nome, old.data);
    return old;
  end if;
end;
$$;

drop trigger if exists reservas_atividade on public.reservas;
create trigger reservas_atividade
  after insert or update or delete on public.reservas
  for each row execute function public.registrar_atividade();


-- ---------- Administradores ------------------------------------------
-- Criar o usuário em Authentication > Users e depois rodar supabase/criar-admin.sql.
create table if not exists public.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  email    text
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;


-- ---------- Funções públicas (moradores) ------------------------------

-- Mostra só o que o calendário precisa. Nunca devolve nome, telefone ou unidade.
create or replace function public.disponibilidade()
returns table (data date, data_fim date, periodo text, inicio text, fim text, status text)
language sql
security definer
stable
set search_path = public
as $$
  select r.data, r.data_fim, r.periodo, r.inicio, r.fim, r.status
  from public.reservas r
  where r.status in ('pendente', 'aprovada')
    and r.data_fim >= (now() at time zone 'America/Sao_Paulo')::date
  order by r.data, r.inicio;
$$;

-- Cria uma reserva "pendente". As mesmas regras do app são conferidas aqui,
-- porque o navegador do morador não é confiável.
create or replace function public.criar_reserva(
  p_nome         text,
  p_telefone     text,
  p_bloco        text,
  p_apartamento  text,
  p_data         date,
  p_data_fim     date,
  p_periodo      text,
  p_inicio       text,
  p_fim          text,
  p_observacoes  text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_max_ativas  constant int := 5;     -- reservas ativas e futuras por telefone
  v_agora       timestamp := now() at time zone 'America/Sao_Paulo';
  v_hoje        date := v_agora::date;
  v_min_agora   int := extract(hour from v_agora)::int * 60 + extract(minute from v_agora)::int;
  v_periodo     text := p_periodo;
  v_inicio      text := p_inicio;
  v_fim         text := p_fim;
  v_inicio_min  int;
  v_ativas      int;
  v_reserva     public.reservas;
begin
  if p_data is null or p_data_fim is null or p_data_fim < p_data then
    raise exception 'Escolha a data no calendário.' using errcode = 'P0001';
  end if;
  if p_data < v_hoje then
    raise exception 'Não é possível reservar uma data que já passou.' using errcode = 'P0001';
  end if;
  if p_data_fim - p_data > 6 then
    raise exception 'É possível reservar no máximo 7 dias seguidos.' using errcode = 'P0001';
  end if;

  -- Datas em que a administração fechou o salão (tabela "bloqueios", criada mais abaixo).
  if to_regclass('public.bloqueios') is not null and exists (
    select 1 from public.bloqueios b where daterange(b.data, b.data_fim, '[]') && daterange(p_data, p_data_fim, '[]')
  ) then
    raise exception 'O salão estará fechado em parte dessas datas. Escolha outro dia.' using errcode = 'P0001';
  end if;

  -- Vários dias seguidos ocupam o dia todo.
  if p_data_fim > p_data then
    v_periodo := 'dia-todo';
    v_inicio  := '08:00';
    v_fim     := '23:00';
  end if;

  if v_inicio is null or v_fim is null
     or v_inicio !~ '^([01]\d|2[0-3]):[0-5]\d$' or v_fim !~ '^([01]\d|2[0-3]):[0-5]\d$' then
    raise exception 'Escolha um período.' using errcode = 'P0001';
  end if;

  v_inicio_min := substr(v_inicio, 1, 2)::int * 60 + substr(v_inicio, 4, 2)::int;
  if p_data = v_hoje and v_inicio_min <= v_min_agora then
    raise exception 'Esse horário de hoje já começou. Escolha um horário mais tarde ou outra data.' using errcode = 'P0001';
  end if;

  select count(*) into v_ativas
  from public.reservas
  where telefone = p_telefone
    and status in ('pendente', 'aprovada')
    and data_fim >= v_hoje;
  if v_ativas >= c_max_ativas then
    raise exception 'Este telefone já tem % reservas ativas. Fale com a administração para reservar mais datas.', c_max_ativas
      using errcode = 'P0001';
  end if;

  begin
    insert into public.reservas (nome, telefone, bloco, apartamento, data, data_fim, periodo, inicio, fim, observacoes)
    values (btrim(p_nome), p_telefone, btrim(p_bloco), btrim(p_apartamento), p_data, p_data_fim,
            v_periodo, v_inicio, v_fim, btrim(coalesce(p_observacoes, '')))
    returning * into v_reserva;
  exception
    when exclusion_violation then
      raise exception 'Esse horário já está ocupado. Escolha outro período ou outra data.' using errcode = 'P0001';
    when check_violation then
      raise exception 'Confira os dados informados e tente de novo.' using errcode = 'P0001';
  end;

  return jsonb_build_object('id', v_reserva.id, 'criada_em', v_reserva.criada_em, 'status', v_reserva.status);
end;
$$;


-- ---------- Permissões -----------------------------------------------
alter table public.reservas   enable row level security;
alter table public.atividades enable row level security;
alter table public.admins     enable row level security;

-- Ninguém acessa as tabelas direto, a não ser que uma regra abaixo permita.
revoke all on public.reservas, public.atividades, public.admins from anon, authenticated;

-- Administradores: ler, trocar APENAS o status e excluir.
grant select, delete   on public.reservas   to authenticated;
grant update (status)  on public.reservas   to authenticated;
grant select           on public.atividades to authenticated;

drop policy if exists admin_le_reservas      on public.reservas;
drop policy if exists admin_atualiza_reserva on public.reservas;
drop policy if exists admin_exclui_reserva   on public.reservas;
drop policy if exists admin_le_atividades    on public.atividades;

create policy admin_le_reservas      on public.reservas   for select to authenticated using (public.is_admin());
create policy admin_atualiza_reserva on public.reservas   for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_exclui_reserva   on public.reservas   for delete to authenticated using (public.is_admin());
create policy admin_le_atividades    on public.atividades for select to authenticated using (public.is_admin());

-- Funções: o Postgres libera para todos (PUBLIC) e o Supabase ainda concede acesso a anon e
-- authenticated automaticamente. Tiramos tudo e liberamos só para quem precisa.
revoke all on function public.disponibilidade()        from public, anon, authenticated;
revoke all on function public.is_admin()               from public, anon, authenticated;
revoke all on function public.registrar_atividade()    from public, anon, authenticated;
revoke all on function public.criar_reserva(text, text, text, text, date, date, text, text, text, text) from public, anon, authenticated;

grant execute on function public.disponibilidade() to anon, authenticated;
grant execute on function public.criar_reserva(text, text, text, text, date, date, text, text, text, text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;


-- =====================================================================
-- Lista de espera (v5.3): moradores pedem aviso quando um dia ocupado liberar.
-- Moradores só entram na fila (função abaixo). Só administradores leem e removem.
-- É seguro rodar mais de uma vez.
-- =====================================================================
create table if not exists public.lista_espera (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  telefone     text not null,
  bloco        text not null,
  apartamento  text not null,
  data         date not null,
  criada_em    timestamptz not null default now(),

  constraint espera_nome_ok     check (char_length(btrim(nome)) between 3 and 100),
  constraint espera_telefone_ok check (telefone ~ '^\(\d{2}\) \d{4,5}-\d{4}$'),
  constraint espera_bloco_ok    check (char_length(btrim(bloco)) between 1 and 40),
  constraint espera_apto_ok     check (apartamento ~ '^\d{1,4}$'),
  -- Cada telefone entra uma vez por dia.
  constraint espera_unica       unique (telefone, data)
);

create index if not exists lista_espera_data_idx on public.lista_espera (data);

create or replace function public.entrar_lista_espera(
  p_nome         text,
  p_telefone     text,
  p_bloco        text,
  p_apartamento  text,
  p_data         date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_max_por_telefone constant int := 3;   -- igual a MAX_ESPERAS_POR_TELEFONE em src/utils/espera.ts
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_total int;
  v_id uuid;
begin
  if p_data is null or p_data < v_hoje then
    raise exception 'Escolha uma data a partir de hoje.' using errcode = 'P0001';
  end if;
  if p_data > v_hoje + 366 then
    raise exception 'Escolha uma data dentro do próximo ano.' using errcode = 'P0001';
  end if;

  select count(*) into v_total from public.lista_espera where telefone = p_telefone and data >= v_hoje;
  if v_total >= c_max_por_telefone then
    raise exception 'Cada telefone pode esperar até % dias ao mesmo tempo.', c_max_por_telefone using errcode = 'P0001';
  end if;

  begin
    insert into public.lista_espera (nome, telefone, bloco, apartamento, data)
    values (btrim(p_nome), p_telefone, btrim(p_bloco), btrim(p_apartamento), p_data)
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'Você já está na lista de espera desse dia.' using errcode = 'P0001';
    when check_violation then
      raise exception 'Confira os dados informados e tente de novo.' using errcode = 'P0001';
  end;

  return jsonb_build_object('id', v_id);
end;
$$;

alter table public.lista_espera enable row level security;
revoke all on public.lista_espera from anon, authenticated;
grant select, delete on public.lista_espera to authenticated;

drop policy if exists admin_le_espera    on public.lista_espera;
drop policy if exists admin_remove_espera on public.lista_espera;
create policy admin_le_espera     on public.lista_espera for select to authenticated using (public.is_admin());
create policy admin_remove_espera on public.lista_espera for delete to authenticated using (public.is_admin());

revoke all on function public.entrar_lista_espera(text, text, text, text, date) from public, anon, authenticated;
grant execute on function public.entrar_lista_espera(text, text, text, text, date) to anon, authenticated;


-- =====================================================================
-- Datas bloqueadas (v5.4): a administração fecha o salão em certos dias.
-- Todos podem LER (o calendário precisa mostrar o salão fechado); só administradores alteram.
-- É seguro rodar mais de uma vez.
-- =====================================================================
create table if not exists public.bloqueios (
  id         uuid primary key default gen_random_uuid(),
  data       date not null,
  data_fim   date not null,
  motivo     text not null default '',
  criado_em  timestamptz not null default now(),
  constraint bloqueio_datas_ok  check (data_fim >= data and data_fim - data <= 366),
  constraint bloqueio_motivo_ok check (char_length(motivo) <= 80)
);

create index if not exists bloqueios_data_idx on public.bloqueios (data, data_fim);

alter table public.bloqueios enable row level security;
revoke all on public.bloqueios from anon, authenticated;
grant select on public.bloqueios to anon, authenticated;
grant insert, delete on public.bloqueios to authenticated;

drop policy if exists le_bloqueios         on public.bloqueios;
drop policy if exists admin_cria_bloqueio  on public.bloqueios;
drop policy if exists admin_remove_bloqueio on public.bloqueios;
create policy le_bloqueios          on public.bloqueios for select to anon, authenticated using (true);
create policy admin_cria_bloqueio   on public.bloqueios for insert to authenticated with check (public.is_admin());
create policy admin_remove_bloqueio on public.bloqueios for delete to authenticated using (public.is_admin());


-- =====================================================================
-- Cadastro de moradores (v6.1): cada apartamento (bloco + número) tem um
-- cadastro protegido por uma senha numérica de 4 a 6 dígitos.
-- Os dados servem para preencher as reservas sozinhos. Visitantes NÃO leem a
-- tabela: só chamam as funções abaixo, e a senha é guardada criptografada.
-- Depois de 5 senhas erradas, o apartamento fica bloqueado por 15 minutos.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.moradores (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  telefone       text not null,
  bloco          text not null,
  apartamento    text not null,
  pin_hash       text not null,
  tentativas     int  not null default 0,
  bloqueado_ate  timestamptz,
  criado_em      timestamptz not null default now(),

  constraint morador_nome_ok     check (char_length(btrim(nome)) between 3 and 100),
  constraint morador_telefone_ok check (telefone ~ '^\(\d{2}\) \d{4,5}-\d{4}$'),
  constraint morador_bloco_ok    check (char_length(btrim(bloco)) between 1 and 40),
  constraint morador_apto_ok     check (apartamento ~ '^\d{1,4}$'),
  constraint morador_unico       unique (bloco, apartamento)
);

-- Confere a senha e controla as tentativas. Uso interno: não é exposta pela API.
create or replace function public.verificar_morador(p_bloco text, p_apartamento text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c_max_tentativas constant int := 5;
  c_bloqueio       constant interval := interval '15 minutes';
  v public.moradores%rowtype;
begin
  select * into v from public.moradores
   where bloco = btrim(p_bloco) and apartamento = btrim(p_apartamento)
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'incorreto');
  end if;
  if v.bloqueado_ate is not null and v.bloqueado_ate > now() then
    return jsonb_build_object('ok', false, 'motivo', 'bloqueado');
  end if;
  if p_pin is not null and v.pin_hash = crypt(p_pin, v.pin_hash) then
    update public.moradores set tentativas = 0, bloqueado_ate = null where id = v.id;
    return jsonb_build_object('ok', true, 'id', v.id, 'nome', v.nome, 'telefone', v.telefone);
  end if;
  if v.tentativas + 1 >= c_max_tentativas then
    update public.moradores set tentativas = 0, bloqueado_ate = now() + c_bloqueio where id = v.id;
    return jsonb_build_object('ok', false, 'motivo', 'bloqueado');
  end if;
  update public.moradores set tentativas = v.tentativas + 1 where id = v.id;
  return jsonb_build_object('ok', false, 'motivo', 'incorreto');
end;
$$;

create or replace function public.cadastrar_morador(
  p_nome text, p_telefone text, p_bloco text, p_apartamento text, p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_pin is null or p_pin !~ '^\d{4,6}$' then
    raise exception 'A senha deve ter de 4 a 6 números.' using errcode = 'P0001';
  end if;
  begin
    insert into public.moradores (nome, telefone, bloco, apartamento, pin_hash)
    values (btrim(p_nome), p_telefone, btrim(p_bloco), btrim(p_apartamento), crypt(p_pin, gen_salt('bf')));
  exception
    when unique_violation then
      raise exception 'Este apartamento já tem cadastro. Entre com a sua senha.' using errcode = 'P0001';
    when check_violation then
      raise exception 'Confira os dados informados e tente de novo.' using errcode = 'P0001';
  end;
  return jsonb_build_object('ok', true, 'nome', btrim(p_nome), 'telefone', p_telefone);
end;
$$;

create or replace function public.entrar_morador(p_bloco text, p_apartamento text, p_pin text)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select case when (r->>'ok')::boolean
              then jsonb_build_object('ok', true, 'nome', r->>'nome', 'telefone', r->>'telefone')
              else r end
    from (select public.verificar_morador(p_bloco, p_apartamento, p_pin) as r) x;
$$;

create or replace function public.atualizar_morador(
  p_bloco text, p_apartamento text, p_pin text, p_nome text, p_telefone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r jsonb := public.verificar_morador(p_bloco, p_apartamento, p_pin);
begin
  if not (r->>'ok')::boolean then
    return r;
  end if;
  begin
    update public.moradores set nome = btrim(p_nome), telefone = p_telefone where id = (r->>'id')::uuid;
  exception
    when check_violation then
      raise exception 'Confira os dados informados e tente de novo.' using errcode = 'P0001';
  end;
  return jsonb_build_object('ok', true, 'nome', btrim(p_nome), 'telefone', p_telefone);
end;
$$;

alter table public.moradores enable row level security;
revoke all on public.moradores from anon, authenticated;
-- A administração enxerga os cadastros, mas nunca a senha (nem o controle de tentativas).
grant select (id, nome, telefone, bloco, apartamento, criado_em) on public.moradores to authenticated;
grant delete on public.moradores to authenticated;

drop policy if exists admin_le_moradores    on public.moradores;
drop policy if exists admin_remove_morador  on public.moradores;
create policy admin_le_moradores   on public.moradores for select to authenticated using (public.is_admin());
create policy admin_remove_morador on public.moradores for delete to authenticated using (public.is_admin());

revoke all on function public.verificar_morador(text, text, text) from public, anon, authenticated;
revoke all on function public.cadastrar_morador(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.entrar_morador(text, text, text) from public, anon, authenticated;
revoke all on function public.atualizar_morador(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.cadastrar_morador(text, text, text, text, text) to anon, authenticated;
grant execute on function public.entrar_morador(text, text, text) to anon, authenticated;
grant execute on function public.atualizar_morador(text, text, text, text, text) to anon, authenticated;
