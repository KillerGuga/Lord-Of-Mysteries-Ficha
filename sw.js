const CACHE = 'lom-ficha-v2.2'; // <-- Mude esta versão sempre que alterar o código
const PREFIXO = 'lom-ficha-';   // Este app só mexe nos próprios caches (a outra ficha usa outro prefixo)
const ESSENCIAIS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instala e guarda os arquivos no cache.
// Cada arquivo é salvo separadamente: se um deles falhar (ex.: 404), os outros continuam sendo salvos.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ESSENCIAIS.map(url =>
        c.add(url).catch(err => console.warn('SW: não foi possível cachear', url, err))
      )))
      .then(() => self.skipWaiting())
  );
});

// Remove só as versões antigas DESTE app. Os caches da outra ficha não são tocados.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k.startsWith(PREFIXO) && k !== CACHE)
        .map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache primeiro, rede como reserva. Funciona offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(c =>
      // ignoreSearch: true ajuda a achar o index mesmo com ?parametros na URL
      c.match(e.request, { ignoreSearch: true }).then(r =>
        r || fetch(e.request).then(resp => {
          // Só guarda respostas válidas (evita guardar 404 no cache)
          if (resp.ok || resp.type === 'opaque') c.put(e.request, resp.clone()).catch(() => {});
          return resp;
        }).catch(() =>
          // Sem rede e fora do cache: abre o index só para navegação de página
          e.request.mode === 'navigate' ? c.match('./index.html') : Response.error()
        )
      )
    )
  );
});
