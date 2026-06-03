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

  const isCall = isCallNotification(data);
  const notificationOptions = {
    body: data.body,
    actions: Array.isArray(data.actions) ? data.actions : [],
    data: {
      href: data.href,
      ...(data.data || {}),
    },
    icon: "/doshab-icon-512.png",
    badge: "/doshab-icon-192.png",
    requireInteraction: Boolean(data.requireInteraction || isCall),
    renotify: isCall,
    silent: false,
    tag: data.tag,
    timestamp: Date.now(),
    vibrate: isCall ? [250, 100, 250, 100, 450, 150, 450] : [90],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, notificationOptions),
      setAppBadge(isCall ? 1 : undefined),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const href = event.notification.data?.href || "/dashboard";
  const callId = event.notification.data?.callId;

  if (event.action === "decline-call" && callId) {
    event.waitUntil(
      Promise.all([
        fetch(`/api/friend-calls/${callId}/decline`, {
          credentials: "same-origin",
          method: "POST",
        }).catch(() => null),
        clearAppBadge(),
      ]),
    );
    return;
  }

  if (event.action === "answer-call" && callId) {
    event.waitUntil(
      Promise.all([
        openOrFocusWindow(`/dashboard/calls/${callId}`),
        clearAppBadge(),
      ]),
    );
    return;
  }

  event.waitUntil(
    Promise.all([
      openOrFocusWindow(href),
      clearAppBadge(),
    ]),
  );
});

self.addEventListener("notificationclose", (event) => {
  event.waitUntil(clearAppBadge());
});

function openOrFocusWindow(href) {
  const targetUrl = new URL(href, self.location.origin);

  return self.clients
      .matchAll({
        includeUncontrolled: true,
        type: "window",
      })
      .then((clients) => {
        const matchingClient = clients.find((client) => {
          try {
            return new URL(client.url).pathname === targetUrl.pathname;
          } catch {
            return client.url.endsWith(href);
          }
        });
        const sameOriginClient = clients.find((client) => {
          try {
            return new URL(client.url).origin === targetUrl.origin;
          } catch {
            return false;
          }
        });

        if (matchingClient) {
          if (matchingClient.navigate) {
            return matchingClient
              .navigate(targetUrl.href)
              .then((client) => client?.focus?.() || matchingClient.focus());
          }

          return matchingClient.focus();
        }

        if (sameOriginClient) {
          if (sameOriginClient.navigate) {
            return sameOriginClient
              .navigate(targetUrl.href)
              .then((client) => client?.focus?.() || sameOriginClient.focus());
          }

          return sameOriginClient.focus();
        }

        return self.clients.openWindow(targetUrl.href);
      });
}

function isCallNotification(data) {
  return (
    data?.data?.type === "call" ||
    data?.data?.notificationType === "INCOMING_CALL" ||
    data?.data?.notificationType === "MISSED_CALL"
  );
}

function setAppBadge(value) {
  if (!self.navigator?.setAppBadge) {
    return Promise.resolve();
  }

  return value ? self.navigator.setAppBadge(value) : self.navigator.setAppBadge();
}

function clearAppBadge() {
  if (!self.navigator?.clearAppBadge) {
    return Promise.resolve();
  }

  return self.navigator.clearAppBadge();
}
