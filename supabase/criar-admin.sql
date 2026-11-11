-- =====================================================================
-- Torna um usuário administrador do Reservas Saint-Marc.
--
-- Antes: Supabase > Authentication > Users > Add user > Create new user
--        (informe e-mail e senha e marque "Auto Confirm User").
-- Depois: troque o e-mail abaixo pelo mesmo e-mail e rode no SQL Editor.
-- Para mais de um administrador, repita com o e-mail de cada um.
-- =====================================================================

insert into public.admins (user_id, email)
select id, email
from auth.users
where email = 'COLOQUE-O-EMAIL-DO-ADMIN-AQUI'
on conflict (user_id) do nothing;

-- Confira: deve aparecer uma linha com o e-mail do administrador.
select * from public.admins;
