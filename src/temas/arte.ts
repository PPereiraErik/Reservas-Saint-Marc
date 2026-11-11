/** Decorações desenhadas no Canva, posicionadas sobre o topo da página (gerado a partir dos PDFs).
    x/y em px a partir do canto superior esquerdo do bloco: texto (esq) ou foto (dir). */
export interface PecaArte { src: string; lado: "esq" | "dir"; x: number; y: number; w: number; h: number;
  /** Fica atrás do texto e dos botões (peças que "espiam" por trás deles). */
  atras?: boolean;
  /** Elemento ao qual a peça fica presa; x/y passam a ser medidos a partir do canto dele. Sem isto, a partir do bloco de texto. */
  ancora?: "titulo" | "botao" | "datas" }

export const ARTE: Record<string, PecaArte[]> = {
  carnaval: [
    { src: "./eventos/carnaval/p1.webp", lado: "dir", x: 461.4, y: -47.4, w: 64.4, h: 65.5 },
    { src: "./eventos/carnaval/p2.webp", lado: "esq", ancora: "botao", x: -34.7, y: 0, w: 82.5, h: 47.5 },
    { src: "./eventos/carnaval/p3.webp", lado: "esq", x: 445.5, y: 295.0, w: 166.1, h: 159.3 },
  ],
  pascoa: [
    { src: "./eventos/pascoa/p1.webp", lado: "esq", ancora: "titulo", x: -4, y: -24, w: 41.8, h: 33.9 },
    { src: "./eventos/pascoa/p2.webp", lado: "dir", x: 2.6, y: 3.5, w: 319.8, h: 368.4 },
    { src: "./eventos/pascoa/p3.webp", lado: "esq", ancora: "datas", x: 272.6, y: -113.4, w: 143.5, h: 116.4, atras: true },
  ],
  pascoa2: [
    { src: "./eventos/pascoa2/p1.webp", lado: "dir", x: 437.6, y: 17.0, w: 92.7, h: 206.8 },
    { src: "./eventos/pascoa2/p2.webp", lado: "esq", ancora: "datas", x: 277.2, y: -111, w: 140.1, h: 114.1, atras: true },
    { src: "./eventos/pascoa2/p3.webp", lado: "dir", x: -34.7, y: 206.9, w: 91.5, h: 205.6 },
  ],
  maes: [
    { src: "./eventos/maes/p1.webp", lado: "dir", x: -30.2, y: -24.8, w: 132.2, h: 120.9 },
    { src: "./eventos/maes/p2.webp", lado: "esq", ancora: "botao", x: 280.5, y: 17.1, w: 98.3, h: 97.2, atras: true },
    { src: "./eventos/maes/p3.webp", lado: "esq", ancora: "botao", x: 7.1, y: 46.5, w: 270.1, h: 18.1 },
  ],
  pais: [
    { src: "./eventos/pais/p1.webp", lado: "esq", ancora: "titulo", x: 401.4, y: -30.4, w: 113.0, h: 107.3, atras: true },
    { src: "./eventos/pais/p2.webp", lado: "esq", ancora: "titulo", x: -6, y: -31, w: 46.3, h: 40.7 },
    { src: "./eventos/pais/p3.webp", lado: "dir", x: 0.3, y: 0.1, w: 127.7, h: 111.9 },
    { src: "./eventos/pais/p4.webp", lado: "esq", ancora: "datas", x: 287.3, y: 62, w: 113.0, h: 107.3 },
  ],
  criancas: [
    { src: "./eventos/criancas/p1.webp", lado: "esq", ancora: "titulo", x: 412.7, y: -53, w: 128.8, h: 128.8, atras: true },
    { src: "./eventos/criancas/p2.webp", lado: "esq", ancora: "botao", x: 287.3, y: -47.3, w: 270.1, h: 136.7, atras: true },
    { src: "./eventos/criancas/p3.webp", lado: "esq", ancora: "botao", x: 417.3, y: 60.1, w: 129.9, h: 93.8, atras: true },
  ],
  junina: [
    { src: "./eventos/junina/p1.webp", lado: "dir", x: 1.5, y: 2.3, w: 177.4, h: 65.5 },
    { src: "./eventos/junina/p2.webp", lado: "dir", x: 315.6, y: 2.3, w: 162.7, h: 72.3 },
    { src: "./eventos/junina/p3.webp", lado: "esq", ancora: "titulo", x: -10, y: -27, w: 46.3, h: 37.3 },
    { src: "./eventos/junina/p4.webp", lado: "esq", ancora: "botao", x: 10.5, y: 12.6, w: 47.5, h: 49.7 },
    { src: "./eventos/junina/p5.webp", lado: "esq", ancora: "botao", x: 222.9, y: 12.6, w: 48.6, h: 49.7 },
  ],
  independencia: [
    { src: "./eventos/independencia/p1.webp", lado: "dir", x: 0.3, y: -76.8, w: 111.9, h: 177.4 },
    { src: "./eventos/independencia/p2.webp", lado: "dir", x: 439.9, y: -45.1, w: 76.8, h: 64.4 },
    { src: "./eventos/independencia/p3.webp", lado: "esq", ancora: "datas", x: 328, y: -110, w: 94.9, h: 113.0, atras: true },
    { src: "./eventos/independencia/p4.webp", lado: "esq", x: 529.1, y: 344.7, w: 64.4, h: 78.0 },
  ],
  halloween: [
    { src: "./eventos/halloween/p1.webp", lado: "esq", ancora: "titulo", x: -69.7, y: -81.3, w: 297.2, h: 341.2, atras: true },
    { src: "./eventos/halloween/p2.webp", lado: "esq", ancora: "titulo", x: 461.3, y: -31.6, w: 100.6, h: 176.3 },
    { src: "./eventos/halloween/p3.webp", lado: "esq", ancora: "botao", x: 204.8, y: 12.6, w: 78.0, h: 49.7 },
    { src: "./eventos/halloween/p4.webp", lado: "esq", ancora: "datas", x: 295.2, y: -45, w: 101.7, h: 48.6, atras: true },
  ],
  natal: [
    { src: "./eventos/natal/p1.webp", lado: "dir", x: -65.2, y: -55.3, w: 179.7, h: 197.7 },
    { src: "./eventos/natal/p2.webp", lado: "esq", ancora: "titulo", x: -8, y: -26, w: 41.8, h: 36.2 },
    { src: "./eventos/natal/p3.webp", lado: "esq", ancora: "botao", x: 50, y: 45.4, w: 175.1, h: 42.9, atras: true },
    { src: "./eventos/natal/p4.webp", lado: "dir", x: 25.2, y: 379.7, w: 175.1, h: 104.0 },
  ],
};
