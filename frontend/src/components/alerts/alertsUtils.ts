export async function ensureBrowserNotifications() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendBrowserNotification(message: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Granite Alert', { body: message });
  }
}
