import { manifest, version } from "@parcel/service-worker";

async function install() {
  const cache = await caches.open(version);
  await cache.addAll(manifest);
}
addEventListener("install", (e) => e.waitUntil(install()));

async function activate() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => key !== version && caches.delete(key)));
}
addEventListener("activate", (e) => e.waitUntil(activate()));

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(version).then((cache) => {
      return cache.match(event.request).then((response) => {
        event.request.importance = "low"; //low priority
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (manifest.includes(new URL(event.request.url).pathname)) {
              //if the file is in the cache list
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((e) => (console.log(e), response));

        // Prioritize live API first
        return new URL(event.request.url).pathname.includes("/api/")
          ? fetchPromise || response
          : response || fetchPromise;
      });
    })
  );
});
