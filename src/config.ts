/**
 * Configurações do condomínio.
 * Para adaptar o sistema a outro prédio, normalmente só este arquivo muda.
 */

export const CONDOMINIO = {
  nome: "Saint-Marc",
  /** Nome do sistema, usado no cabeçalho, na aba do navegador e no rodapé. */
  sistema: "Reservas Saint-Marc",
  blocos: ["Bloco 1", "Bloco 2"],
};

/**
 * Banco de dados compartilhado (Supabase).
 * Definidos em variáveis de ambiente (arquivo .env.local; veja .env.example).
 * Sem as duas variáveis, o sistema roda em MODO LOCAL: sem dados de exemplo,
 * dados salvos só no navegador e login de teste.
 */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
export const MODO_DEMO = !SUPABASE_URL || !SUPABASE_KEY;

/**
 * WhatsApp da administração, só dígitos com código do país e DDD (ex.: "5547999999999").
 * Quando preenchido, o morador vê um botão para avisar a administração depois de reservar.
 * Deixe vazio ("") para não mostrar o botão.
 */
export const WHATSAPP_ADMINISTRACAO = "";

/**
 * Foto do banner da página inicial.
 * Coloque a imagem na pasta `public/` (ex.: public/salao.jpg) e troque o valor
 * abaixo para "./salao.jpg". Enquanto for null, aparece uma ilustração.
 */
export const FOTO_DESTAQUE: string | null = "./salao.jpg";

/**
 * Crédito exibido sobre a foto. A foto atual é do próprio salão; deixe como "".
 */
export const FOTO_CREDITO = "";

/** Horário de funcionamento do salão (também limita o horário personalizado). */
export const ABERTURA = "08:00";
export const FECHAMENTO = "23:00";

/** Intervalo entre as opções de horário personalizado, em minutos. */
export const PASSO_HORARIO_MIN = 30;

/** Quantos dias seguidos podem ser reservados de uma vez. */
export const MAX_DIAS_SEGUIDOS = 7;

export type PeriodoFixo = "manha" | "tarde" | "noite" | "dia-todo";
export type Periodo = PeriodoFixo | "personalizado";

export interface PeriodoInfo {
  id: PeriodoFixo;
  nome: string;
  inicio: string;
  fim: string;
}

/** Períodos prontos oferecidos na reserva de um dia. */
export const PERIODOS: PeriodoInfo[] = [
  { id: "manha", nome: "Manhã", inicio: "08:00", fim: "12:00" },
  { id: "tarde", nome: "Tarde", inicio: "13:00", fim: "18:00" },
  { id: "noite", nome: "Noite", inicio: "18:00", fim: "23:00" },
  { id: "dia-todo", nome: "Dia todo", inicio: ABERTURA, fim: FECHAMENTO },
];

/**
 * true: nas datas comemorativas que têm arte do Canva, a tela fica igual ao desenho
 * (só a arte, sem trocar as cores nem mostrar a faixa). false: arte + cores + faixa.
 */
export const TEMA_APENAS_ARTE = true;

/**
 * Frase opcional no fim da mensagem de reserva aprovada (regras do salão, horário de silêncio...).
 * Exemplo: "Lembre-se de respeitar o horário de silêncio e deixar o salão limpo."
 */
export const AVISO_EXTRA = "";

/**
 * Regras do salão, mostradas na página inicial e no formulário de reserva
 * (o morador precisa aceitar antes de enviar). EDITE com as regras reais do condomínio.
 */
export const REGRAS_SALAO: string[] = [
  "Respeitar o horário de silêncio e o limite de som definidos pelo condomínio.",
  "Entregar o salão limpo e organizado no fim do evento.",
  "O responsável pela reserva responde por danos ao salão, móveis e equipamentos.",
  "Respeitar a capacidade máxima de pessoas do salão.",
  "Encerrar o evento e liberar o salão dentro do horário reservado.",
];

/** Endereço do site publicado (ex.: https://reservas-saint-marc.vercel.app). Vai nas mensagens da lista de espera. */
export const SITE_URL = "";
