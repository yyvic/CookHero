/* CookHero 移动端 Service Worker
 * 策略：
 *  - 导航请求：网络优先，断网回退缓存的首页（离线仍可打开 App 外壳与看过的菜谱）
 *  - 静态资源（/m/assets/、图标）：缓存优先
 *  - /api/v1/recipes*：网络优先，失败回退缓存（离线看菜谱）
 *  - 其它：直接走网络
 */
const VERSION = 'cookhero-mobile-v1';
const SHELL = '/m/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.add(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isAsset(url) {
  return url.pathname.startsWith('/m/assets/') || url.pathname.startsWith('/m/icons/');
}

function isRecipeApi(url) {
  return url.pathname.startsWith('/api/v1/recipes');
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(VERSION);
        return (await cache.match(SHELL)) || (await cache.match('/m/index.html')) || Response.error();
      })
    );
    return;
  }

  if (isAsset(url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  if (isRecipeApi(url)) {
    event.respondWith(networkFirst(req));
  }
});
