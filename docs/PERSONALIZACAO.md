# Personalização

Quase tudo se ajusta em `src/config.ts`. Depois de alterar, gere um novo build e publique.

| Item | Constante | Observação |
| --- | --- | --- |
| Nome do condomínio, blocos | `CONDOMINIO` | Os blocos alimentam a lista do formulário. |
| WhatsApp da administração | `WHATSAPP_ADMINISTRACAO` | Só dígitos com país e DDD (`5547999999999`). Vazio esconde o botão de aviso. |
| Foto da página inicial | `FOTO_DESTAQUE` | Arquivo em `public/salao.jpg`. `null` mostra uma ilustração. |
| Crédito da foto | `FOTO_CREDITO` | Vazio quando a foto é própria. |
| Horário de funcionamento | `ABERTURA`, `FECHAMENTO` | Também existe no banco (veja abaixo). |
| Intervalo do horário personalizado | `PASSO_HORARIO_MIN` | Em minutos. |
| Máximo de dias seguidos | `MAX_DIAS_SEGUIDOS` | Também existe no banco. |
| Períodos prontos | `PERIODOS` | Manhã, Tarde, Noite e Dia todo. |
| Regras do salão | `REGRAS_SALAO` | Lista exibida na página inicial e aceita no formulário. **Edite com as regras reais.** |
| Frase fixa na mensagem de aprovação | `AVISO_EXTRA` | Ex.: horário de silêncio. |
| Endereço do site | `SITE_URL` | Entra nas mensagens da lista de espera. |
| Temas de datas comemorativas | `TEMA_APENAS_ARTE` | `true`: só a arte do desenho; `false`: arte, cores e faixa. |

## Ajustes que exigem mexer nos dois lados

Horário de funcionamento e limite de dias seguidos também são validados no banco. Para mudar no modo conectado, altere `src/config.ts` **e** as restrições correspondentes em `supabase/schema.sql` (`expediente_ok`, `datas_ok`, `varios_dias_ok`), rodando o arquivo de novo. Detalhes em [Banco de dados](BANCO_DE_DADOS.md).

## Temas de datas comemorativas

Os temas são automáticos pela data. Para ver um fora da época, abra o site com `?tema=natal` (ou `ano-novo`, `carnaval`, `pascoa`, `maes`, `junina`, `pais`, `independencia`, `criancas`, `halloween`). `?tema=nenhum` volta ao normal. Segunda versão da Páscoa: `?tema=pascoa2`. O alto contraste e a opção "Decorações" desligam os temas. A arte fica em `public/eventos/` e as posições em `src/temas/arte.ts` (campo `atras: true` faz a peça espiar por trás do texto e das datas); ela aparece a partir de 1184 px de tela; as datas em `src/temas/eventos.ts`.

## Aparência

As cores e o tema claro e escuro são variáveis CSS em `src/styles/base.css`. Os ícones são SVGs próprios em `src/components/Icon.tsx`. Os ícones do aplicativo instalado estão em `public/` e o nome e as cores do app em `public/manifest.webmanifest`.
