self.addEventListener("push", (event) => {
  let data = {
    actions: [],
    body: "You have a new message.",
    data: {},
    href: "/dashboard",
    requireInteraction: false,
    tag: "doshab-message",
    title: "Doshab",
  };

  if (event.data) {
    try {
      data = {
        ...data,
        ...event.data.json(),
      };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      actions: Array.isArray(data.actions) ? data.actions : [],
      data: {
        href: data.href,
        ...(data.data || {}),
      },
      icon: "/doshab-icon-512.png",
      badge: "/doshab-icon-192.png",
      requireInteraction: Boolean(data.requireInteraction),
      renotify: data.data?.type === "call",
      tag: data.tag,
      timestamp: Date.now(),
      vibrate: data.data?.type === "call" ? [200, 90, 200, 90, 200] : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const href = event.notification.data?.href || "/dashboard";
  const callId = event.notification.data?.callId;

  if (event.action === "decline-call" && callId) {
    event.waitUntil(
      fetch(`/api/friend-calls/${callId}/decline`, {
        credentials: "same-origin",
        method: "POST",
      }).catch(() => null),
    );
    return;
  }

  if (event.action === "answer-call" && callId) {
    event.waitUntil(openOrFocusWindow(`/dashboard/calls/${callId}`));
    return;
  }

  event.waitUntil(openOrFocusWindow(href));
});

function openOrFocusWindow(href) {
  return self.clients
      .matchAll({
        includeUncontrolled: true,
        type: "window",
      })
      .then((clients) => {
        const matchingClient = clients.find((client) =>
          client.url.endsWith(href),
        );

        if (matchingClient) {
          return matchingClient.focus();
        }

        return self.clients.openWindow(href);
      });
}
