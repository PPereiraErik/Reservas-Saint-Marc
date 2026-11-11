/*
 * Service worker do Reservas Saint-Marc.
 * - Páginas: tenta a internet primeiro (para sempre pegar a versão nova) e usa a cópia guardada se estiver sem sinal.
 * - Arquivos do site (JS, CSS, imagens): usa a cópia guardada e atualiza em segundo plano.
 * - Nunca guarda chamadas ao banco de dados (Supabase) nem outros endereços: só o próprio site.
 * Troque VERSAO para forçar a limpeza das cópias antigas.
 */
const VERSAO = "saint-marc-v5";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(VERSAO).then((c) => c.put("./", copia));
          return res;
        })
        .catch(() => caches.match("./").then((r) => r || Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.open(VERSAO).then(async (cache) => {
      const guardada = await cache.match(req);
      const rede = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => guardada);
      return guardada || rede;
    }),
  );
});
