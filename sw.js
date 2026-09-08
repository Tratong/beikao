// 一造备考工作台 · 离线缓存 Service Worker
// 首次联网访问后缓存全部应用资源；之后断网也能完整使用，数据存手机本地。
const CACHE = 'beikao-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  let path = '';
  try { path = new URL(e.request.url).pathname; } catch (err) { return; }
  const isDoc = path === '/' || path.endsWith('/') || path.endsWith('index.html');
  if (isDoc) {
    // 页面文档：网络优先（保证更新即时生效），离线回退缓存
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    // 静态资源：缓存优先
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(hit =>
        hit ||
        fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        })
      )
    );
  }
});
