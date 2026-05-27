self.addEventListener("push", (event) => {
  let data = {
    body: "You have a new message.",
    href: "/dashboard",
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
      data: {
        href: data.href,
      },
      icon: "/Doshab_png.png",
      badge: "/Doshab_png.png",
      tag: data.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const href = event.notification.data?.href || "/dashboard";

  event.waitUntil(
    self.clients
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
      }),
  );
});
