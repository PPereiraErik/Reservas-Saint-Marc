# Plano de testes

Roteiro para conferir o sistema antes de entregar ou depois de uma alteração. O site começa **vazio**: os próprios testes criam os dados. No modo local, apague tudo ao final com **Reservas > Apagar dados deste navegador**.

Antes de começar: `npm run typecheck` e `npm run build` devem terminar sem erros.

## 1. Moradores

| # | Teste | Resultado esperado |
| --- | --- | --- |
| 1.1 | Abrir a página inicial | Foto do salão, botão "Reservar o salão", próximos dias livres e calendário; nenhuma reserva de exemplo |
| 1.2 | Reservar > escolher um dia > Manhã > Continuar | Formulário abre com o resumo da data e do período |
| 1.3 | Enviar o formulário vazio | Mensagens de erro nos campos; nada é enviado |
| 1.4 | Telefone sem DDD | Erro de telefone |
| 1.5 | Preencher tudo sem marcar o aceite das regras | Não envia e pede o aceite |
| 1.6 | Preencher tudo e aceitar | Tela "Solicitação enviada" com os botões de agenda |
| 1.7 | Voltar ao calendário | O dia aparece com ponto (parte reservada) e o período da manhã fica indisponível |
| 1.8 | Tentar reservar o mesmo período de novo | Recusado: horário ocupado |
| 1.9 | Personalizado 12:00 às 15:00 no mesmo dia da tarde reservada | Recusado: sobrepõe a Tarde |
| 1.10 | Selecionar o primeiro e o último de 3 dias livres | Reserva de vários dias, sempre dia todo |
| 1.11 | Selecionar um intervalo de mais de 7 dias | Não permitido |
| 1.12 | Tocar em um dia ocupado e usar "Avise-me se este dia liberar" | Entra na lista de espera |
| 1.13 | Botão "Voltar ao início" nas telas de reserva | Volta à página inicial |
| 1.14 | Baixar o arquivo da agenda | `.ics` abre no aplicativo de agenda |

## 2. Administração

| # | Teste | Resultado esperado |
| --- | --- | --- |
| 1.15 | Aba Cadastro: cadastrar nome, telefone, bloco, apartamento e senha de 4 a 6 números; tentar cadastrar o mesmo apartamento de novo | Primeiro cadastro salva e já entra na conta; o repetido é recusado |
| 1.16 | Abrir Reservar com cadastro ativo | Nome, telefone, bloco e apartamento já vêm preenchidos |
| 1.17 | Sair e entrar com senha errada | Mensagem genérica de erro; no modo conectado, 5 erros bloqueiam por 15 minutos |
| 2.0 | Abrir Administração no primeiro acesso (modo local) | A tela pede para criar a conta; senha curta ou diferente da confirmação é recusada |
| 2.1 | Criar a conta (e-mail e senha) | Entra no painel; com dados vazios mostra zeros e mensagens de lista vazia |
| 2.2 | Sair e entrar com senha errada, ou com outro e-mail | Mensagem de erro; continua no login. Só a conta criada entra |
| 2.3 | Reservas: localizar o pedido pendente | Aparece na lista, filtro "Pendentes" funciona |
| 2.4 | Aprovar | Status muda; mensagem pronta com WhatsApp e link do Google Agenda |
| 2.5 | Rejeitar outro pedido | Status muda; o horário volta a ficar livre |
| 2.6 | Aprovar de novo uma rejeitada com horário já ocupado | Recusado por conflito |
| 2.7 | Cancelar uma aprovada | Mensagem de cancelamento; quem estava na lista de espera aparece com "Avisar que liberou" |
| 2.8 | Excluir | Pede confirmação e remove |
| 2.9 | Bloquear um dia | Moradores veem "Salão fechado"; o dia sai dos próximos dias livres |
| 2.10 | Bloquear um dia que já tem reserva | O painel avisa sobre a reserva existente |
| 2.11 | Remover o bloqueio | O dia volta a ficar livre |
| 2.12 | Sair e acessar `#/admin/reservas` direto | Volta ao login |

## 3. Navegadores e dispositivos

| # | Teste | Resultado esperado |
| --- | --- | --- |
| 3.1 | Celular (Chrome Android, Safari iPhone) | Menu inferior, calendário de um mês, formulário em tela cheia |
| 3.2 | Computador (largura 1280) | Calendário com dois meses e painel lateral de períodos |
| 3.3 | Abrir o arquivo único salvo no aparelho | Funciona nos dois modos de navegação, sem internet |
| 3.4 | Abrir dentro de um visualizador de arquivos | Navegação e envio funcionam (sem erro de tela em branco) |
| 3.5 | Tema escuro e alto contraste | Textos legíveis; botões visíveis |
| 3.6 | Navegar só com Tab/Enter/Esc | Todos os controles acessíveis; Esc fecha janelas |
| 3.7 | Instalar como app (site publicado em https) | Ícone na tela inicial; abre sem barra do navegador |

## 4. Modo conectado (com Supabase)

| # | Teste | Resultado esperado |
| --- | --- | --- |
| 4.1 | Reservar em um aparelho e abrir o calendário em outro | O horário aparece ocupado no segundo, sem nome |
| 4.2 | Dois aparelhos enviando o mesmo horário ao mesmo tempo | Apenas um é aceito |
| 4.3 | Visitante sem login tenta ler reservas pela API | Resultado vazio ou negado |
| 4.4 | Login de administrador real | Entra; a sessão se renova |
| 4.5 | Conta que não está em `admins` | Não consegue ver reservas |
| 4.6 | Mais de 5 reservas ativas no mesmo telefone | A sexta é recusada |
| 4.7 | Aprovar em um aparelho e olhar a lista em outro | Atualiza em até 30 segundos |

## 5. Datas comemorativas

Abra `?tema=natal`, `?tema=pascoa`, `?tema=halloween` e as demais. A arte aparece nas posições do desenho em telas de 1184 px ou mais (o texto fica alinhado ao topo); enfeites que espiam ficam atrás das datas e nada cobre o texto. Em telas menores e no celular a página fica limpa, sem enfeites soltos. `?tema=nenhum` volta ao normal.

## Registro

Anote data, versão (`package.json`), aparelho/navegador e o resultado de cada item. Qualquer item que falhe deve virar uma correção antes da entrega.
