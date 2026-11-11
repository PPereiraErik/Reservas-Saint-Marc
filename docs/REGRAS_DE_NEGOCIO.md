# Regras de negócio

As regras ficam em funções puras em `src/utils/rules.ts` (e equivalentes em `bloqueios.ts` e `espera.ts`). No modo conectado o banco repete as regras essenciais, então elas valem mesmo que alguém tente burlar a interface.

## Funcionamento do salão

- Horário de funcionamento: **08:00 às 23:00** (`ABERTURA` e `FECHAMENTO`).
- Não é possível reservar datas passadas nem horários de hoje que já começaram.

## Períodos

| Período | Horário |
| --- | --- |
| Manhã | 08:00 às 12:00 |
| Tarde | 13:00 às 18:00 |
| Noite | 18:00 às 23:00 |
| Dia todo | 08:00 às 23:00 |
| Personalizado | Escolhido pelo morador, em passos de 30 minutos, dentro do funcionamento |

## Conflitos

- Dois eventos **não podem ocupar o mesmo horário**. Um personalizado das 12:00 às 15:00 bloqueia a Tarde, e vice-versa.
- Só reservas **pendentes** e **aprovadas** ocupam o horário. Reservas **rejeitadas** e **canceladas** liberam o dia.
- Aprovar de novo uma reserva rejeitada confere o conflito de novo.
- No modo conectado quem garante isso é o banco (restrição de exclusão), mesmo com dois moradores enviando no mesmo instante.

## Vários dias seguidos

- Até **7 dias** (`MAX_DIAS_SEGUIDOS`).
- O salão fica reservado o **dia todo** em todas as datas.
- Todos os dias precisam estar totalmente livres; o intervalo não pode atravessar um dia ocupado ou fechado.

## Datas bloqueadas

- A administração pode fechar um dia ou período. Nenhuma reserva é aceita nele.
- Bloqueios aparecem como "Salão fechado" para os moradores e nunca podem ser criados por visitantes.

## Dados do morador

| Campo | Regra |
| --- | --- |
| Nome | 3 a 100 caracteres |
| Telefone | Com DDD, formato `(47) 99999-9999` ou `(47) 3333-4444` |
| Bloco | Um dos blocos configurados |
| Apartamento | 1 a 4 dígitos |
| Observações | Opcional, até 500 caracteres |
| Regras do salão | Aceite obrigatório antes de enviar |

## Cadastro de moradores

- Um cadastro por apartamento (bloco + número). Tentar cadastrar um apartamento que já tem cadastro é recusado.
- Senha numérica de 4 a 6 dígitos, guardada criptografada (no modo conectado, `bcrypt` no banco; no modo local, hash com sal no navegador).
- Modo conectado: após 5 senhas erradas, o apartamento fica bloqueado por 15 minutos.
- O cadastro só preenche o formulário: não é obrigatório para reservar.
- A administração vê nome, telefone e unidade, nunca a senha, e pode remover cadastros.

## Conta do administrador

- Modo local: criada no primeiro acesso (e-mail válido e senha de pelo menos 8 caracteres); depois disso só ela entra. Não existe conta padrão.
- Modo conectado: conta do Supabase Auth cadastrada na tabela `admins`.

## Limites por telefone

- Até **5 reservas ativas e futuras** (modo conectado).
- Lista de espera: até **3 dias ao mesmo tempo**, uma vez por dia.

## Status

```
pendente ──► aprovada ──► cancelada
   │            ▲
   └─► rejeitada ┘   (uma reserva rejeitada pode ser aprovada depois)
```

Todo pedido novo nasce **pendente**. Só a administração muda o status.

## Privacidade

- O calendário público mostra apenas que um horário está ocupado, nunca nome, telefone ou unidade.
- No modo conectado, visitantes nem recebem esses dados do servidor: a consulta pública devolve só datas e horários.
- Nome, telefone e observações são visíveis apenas para a administração autenticada.
