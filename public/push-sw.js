const incomingCallType = "INCOMING_CALL";
const missedCallType = "MISSED_CALL";

self.addEventListener("push", (event) => {
  let payload = {
    actions: [],
    body: "You have a new message.",
    data: {},
    href: "/dashboard",
    requireInteraction: false,
    tag: "doshab-message",
    title: "VAL",
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      };
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationType = getNotificationType(payload);
  const isIncomingCall = notificationType === incomingCallType;
  const isCall = isIncomingCall || notificationType === missedCallType || payload.data?.type === "call";
  const callId = payload.data?.callId;
  const callUrl = getCallUrl(payload, isIncomingCall);
  const callerLabel = getCallerLabel(payload);
  const title = isIncomingCall && callerLabel
    ? `Incoming call from ${callerLabel}`
    : payload.title;
  const body = isIncomingCall && callerLabel
    ? `${callerLabel} is calling you on VAL`
    : payload.body;

  const notificationOptions = {
    body,
    actions: isIncomingCall ? getIncomingCallActions(payload.actions) : safeActions(payload.actions),
    badge: "/val-icon-192.png",
    data: {
      ...(payload.data || {}),
      callId,
      href: callUrl,
      type: isIncomingCall ? incomingCallType : payload.data?.type,
      url: callUrl,
    },
    icon: "/val-icon-512.png",
    requireInteraction: Boolean(payload.requireInteraction || isIncomingCall),
    renotify: isIncomingCall,
    silent: false,
    tag: isIncomingCall && callId ? `friend-call-${callId}` : payload.tag,
    timestamp: Date.now(),
    vibrate: isIncomingCall ? [250, 100, 250, 100, 450, 150, 450] : [90],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, notificationOptions),
      setAppBadge(isCall ? 1 : undefined),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const callId = data.callId;
  const isIncomingCall = data.type === incomingCallType || data.notificationType === incomingCallType;
  const expired = hasExpired(data.expiresAt);
  const baseCallUrl = data.url || data.href || (callId ? `/dashboard/calls/${callId}` : "/dashboard");

  if ((event.action === "decline" || event.action === "decline-call") && callId) {
    event.waitUntil(
      Promise.all([
        expired ? Promise.resolve() : declineCall(callId),
        clearAppBadge(),
      ]),
    );
    return;
  }

  if ((event.action === "answer" || event.action === "answer-call") && callId) {
    const answerUrl = addCallQuery(baseCallUrl, {
      autoJoin: expired ? undefined : "1",
      callExpired: expired ? "1" : undefined,
      callId,
    });

    event.waitUntil(
      Promise.all([
        openOrFocusWindow(answerUrl),
        clearAppBadge(),
      ]),
    );
    return;
  }

  const openUrl = isIncomingCall && callId
    ? addCallQuery(baseCallUrl, {
        callExpired: expired ? "1" : undefined,
        callId,
        incoming: expired ? undefined : "1",
      })
    : baseCallUrl;

  event.waitUntil(
    Promise.all([
      openOrFocusWindow(openUrl),
      clearAppBadge(),
    ]),
  );
});

self.addEventListener("notificationclose", (event) => {
  event.waitUntil(clearAppBadge());
});

function getNotificationType(payload) {
  return payload?.data?.notificationType || payload?.data?.type || "";
}

function getCallerLabel(payload) {
  const title = typeof payload.title === "string" ? payload.title : "";
  const body = typeof payload.body === "string" ? payload.body : "";
  const fromTitle = title.match(/^Incoming call from (.+)$/i)?.[1]?.trim();
  const fromBody = body.match(/^(.+?) is calling/i)?.[1]?.trim();

  return fromTitle || fromBody || "";
}

function getCallUrl(payload, incoming) {
  const callId = payload.data?.callId;
  const url = payload.data?.url || payload.href;

  if (url) {
    return url;
  }

  if (incoming && callId) {
    return `/dashboard/calls/${callId}`;
  }

  return "/dashboard";
}

function getIncomingCallActions(actions) {
  const provided = safeActions(actions);

  if (provided.length) {
    return provided.map((action) => {
      if (action.action === "answer-call") {
        return { ...action, action: "answer" };
      }

      if (action.action === "decline-call") {
        return { ...action, action: "decline" };
      }

      return action;
    });
  }

  return [
    {
      action: "answer",
      title: "Answer",
    },
    {
      action: "decline",
      title: "Decline",
    },
  ];
}

function safeActions(actions) {
  return Array.isArray(actions)
    ? actions.filter((action) => action?.action && action?.title)
    : [];
}

function hasExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }

  const expiresAtMs = Date.parse(expiresAt);

  return Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();
}

function addCallQuery(href, values) {
  const targetUrl = new URL(href, self.location.origin);

  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      targetUrl.searchParams.set(key, value);
    }
  });

  return targetUrl.href;
}

function declineCall(callId) {
  const declineUrl = new URL(`/api/friend-calls/${callId}/decline`, self.location.origin);

  return fetch(declineUrl.href, {
    credentials: "same-origin",
    method: "POST",
  }).catch(() => null);
}

function openOrFocusWindow(href) {
  const targetUrl = new URL(href, self.location.origin);

  return self.clients
    .matchAll({
      includeUncontrolled: true,
      type: "window",
    })
    .then((clients) => {
      const matchingClient = clients.find((client) => isSamePath(client.url, targetUrl));
      const sameOriginClient = clients.find((client) => {
        try {
          return new URL(client.url).origin === targetUrl.origin;
        } catch {
          return false;
        }
      });
      const clientToUse = matchingClient || sameOriginClient;

      if (clientToUse) {
        if (clientToUse.navigate) {
          return clientToUse
            .navigate(targetUrl.href)
            .then((client) => client?.focus?.() || clientToUse.focus());
        }

        return clientToUse.focus();
      }

      return self.clients.openWindow(targetUrl.href);
    });
}

function isSamePath(clientUrl, targetUrl) {
  try {
    const url = new URL(clientUrl);

    return url.origin === targetUrl.origin && url.pathname === targetUrl.pathname;
  } catch {
    return false;
  }
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
