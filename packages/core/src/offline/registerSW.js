export async function registerServiceWorker(swPath = '/sw.js') {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.register(swPath);
    console.log('SW registered:', reg.scope);
    return true;
  } catch (err) {
    console.error('SW registration failed:', err);
    return false;
  }
}
