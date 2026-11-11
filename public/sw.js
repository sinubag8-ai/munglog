// 🐾 멍로그 서비스 워커 (앱 뒤에서 도는 작은 도우미)
// 하는 일: 인터넷이 끊겼을 때 "연결을 확인해 주세요" 화면을 보여 줘요.
// 기록 데이터는 저장해 두지 않아요. (항상 Supabase에서 최신 기록을 읽어요)

const CACHE = "munglog-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // 화면(페이지)을 여는 요청만 도와줘요. 나머지는 평소대로 인터넷으로 가요.
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL, { ignoreSearch: true })),
  );
});
