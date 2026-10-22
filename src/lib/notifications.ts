export async function showReminderNotification(title: string, body: string, id?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const options = { body, tag: id, icon: "/favicon.png" };
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register("/reminder-worker.js");
      await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch {
    // In-app alert remains available if the browser blocks system notifications.
  }
}