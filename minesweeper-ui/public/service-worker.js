const CACHE_NAME = 'minesweeper-cache-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/config.js',
  '/css/main.css',
  '/js/App.js',
  '/js/i18n.js',
  '/js/index.js',
  '/js/keycloak.js',
  '/js/locales/en.js',
  '/js/locales/fr.js',
  '/js/pages/BoostPage.js',
  '/js/pages/GamePage.js',
  '/js/pages/GamesListPage.js',
  '/js/pages/InfoPage.js',
  '/js/pages/LeaderboardPage.js',
  '/js/pages/LoginPage.js',
  '/js/pages/RotateMobilePage.js',
  '/js/pages/SettingsPage.js',
  '/images/icons/icon-1024.png',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png',
  '/images/icons/actions/icon_alarm.png',
  '/images/icons/actions/icon_arrow_back.png',
  '/images/icons/actions/icon_bomb_defused.png',
  '/images/icons/actions/icon_bombs_found.png',
  '/images/icons/actions/icon_boost.png',
  '/images/icons/actions/icon_buy_large.png',
  '/images/icons/actions/icon_buy_medium.png',
  '/images/icons/actions/icon_buy_small.png',
  '/images/icons/actions/icon_calendar.png',
  '/images/icons/actions/icon_contracts.png',
  '/images/icons/actions/icon_defuse_process.png',
  '/images/icons/actions/icon_disconnect.png',
  '/images/icons/actions/icon_empty_hole.png',
  '/images/icons/actions/icon_explosion.png',
  '/images/icons/actions/icon_eyes_close.png',
  '/images/icons/actions/icon_eyes_open.png',
  '/images/icons/actions/icon_map_size.png',
  '/images/icons/actions/icon_medal.png',
  '/images/icons/actions/icon_people.png',
  '/images/icons/actions/icon_portfolio.png',
  '/images/icons/actions/icon_refresh.png',
  '/images/icons/actions/icon_scan_process.png',
  '/images/icons/actions/icon_scanner_power.png',
  '/images/icons/actions/icon_trophy_loser.png',
  '/images/icons/actions/icon_trophy_top1.png',
  '/images/icons/actions/icon_trophy_top2.png',
  '/images/icons/actions/icon_trophy_top3.png',
  '/images/icons/actions/icon_upgrade_income.png',
  '/images/icons/actions/icon_upgrade_scanner.png',
  '/images/icons/actions/icon_wheel.png',
  '/images/icons/actions/icon_x.png',
  '/images/icons/actions/icon_y.png',
  '/images/images_background_boost.png',
  '/images/images_background_game.png',
  '/images/images_background_gameinprogress.png',
  '/images/images_background_leaderboard.png',
  '/images/images_background_login.png',
  '/images/images_background_nogameinprogress.png',
  '/images/images_background_parameters.png',
  '/images/images_background_rotatemobile.png',
  '/images/images_background_upgrade.png',
  '/sounds/sound_background.mp3',
  '/sounds/sound_click_1.mp3',
  '/sounds/sound_click_2.mp3',
  '/sounds/sound_explosion.mp3',
  '/sounds/sound_nothing.mp3',
  '/sounds/sound_warning.mp3',
  '/vendor/react.development.js',
  '/vendor/react-dom.development.js',
  '/vendor/react-router.development.js',
  '/vendor/react-router-dom.development.js',
  '/vendor/router.umd.js',
  '/vendor/keycloak.js',
  '/vendor/babel.min.js',
  '/vendor/fontawesome/css/all.min.css',
  '/vendor/fontawesome/webfonts/fa-brands-400.woff2',
  '/vendor/fontawesome/webfonts/fa-regular-400.woff2',
  '/vendor/fontawesome/webfonts/fa-solid-900.woff2',
  '/vendor/fontawesome/webfonts/fa-v4compatibility.woff2',
  '/vendor/flag-icons/css/flag-icons.min.css',
  '/vendor/mouse-memoirs/index.css',
  '/vendor/mouse-memoirs/files/mouse-memoirs-latin-400-normal.woff2',
  '/vendor/mouse-memoirs/files/mouse-memoirs-latin-ext-400-normal.woff2'
];

function postToClients(message) {
  self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      let successCount = 0;
      postToClients({ type: 'CACHE_INIT', total: ASSETS.length });
      for (const [index, asset] of ASSETS.entries()) {
        postToClients({ type: 'CACHE_START', asset });
        try {
          await cache.add(asset);
          successCount++;
        } catch {
          console.warn(`Failed to cache ${asset}`);
        }
        postToClients({ type: 'CACHE_UPDATE', loaded: index + 1 });
      }
      postToClients({ type: 'CACHE_SUMMARY', success: successCount, total: ASSETS.length });
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll().then((clients) =>
          clients.forEach((client) => client.postMessage('CACHE_COMPLETE'))
        )
      )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (!response) {
        const path = new URL(event.request.url).pathname;
        if (ASSETS.includes(path)) {
          console.warn(`Cache miss for ${path}`);
        }
      }
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Mine Sweeper Crew';
  const options = {
    body: data.body || '',
    icon: '/images/icons/icon-192.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

let apiUrl = '';
let globalSocket = null;
let gameSocket = null;
let currentGameId = null;

function broadcast(message) {
  clients.matchAll().then((list) => {
    list.forEach((client) => client.postMessage({ type: 'event', data: JSON.parse(message) }));
  });
}

function connectGlobal() {
  if (!apiUrl || (globalSocket && globalSocket.readyState <= 1)) return;
  postToClients({ type: 'STATUS', text: 'démarrage des websocket' });
  globalSocket = new WebSocket(apiUrl.replace(/^http/, 'ws') + '/ws/global');
  globalSocket.onopen = () => {
    postToClients({ type: 'STATUS', text: 'websocket démarrés' });
    postToClients({ type: 'WS_OPEN' });
  };
  globalSocket.onmessage = (e) => broadcast(e.data);
  const reconnect = () => {
    globalSocket = null;
    setTimeout(connectGlobal, 1000);
  };
  globalSocket.onclose = reconnect;
  globalSocket.onerror = reconnect;
}

function connectGame(id) {
  if (!apiUrl || (gameSocket && gameSocket.readyState <= 1 && currentGameId === id)) return;
  if (gameSocket) {
    gameSocket.close();
  }
  currentGameId = id;
  postToClients({ type: 'STATUS', text: 'démarrage des websocket' });
  gameSocket = new WebSocket(apiUrl.replace(/^http/, 'ws') + `/ws/game/${id}`);
  gameSocket.onopen = () => {
    postToClients({ type: 'STATUS', text: 'websocket démarrés' });
    postToClients({ type: 'WS_OPEN' });
  };
  gameSocket.onmessage = (e) => broadcast(e.data);
  const reconnect = () => {
    gameSocket = null;
    if (currentGameId === id) {
      setTimeout(() => connectGame(id), 1000);
    }
  };
  gameSocket.onclose = reconnect;
  gameSocket.onerror = reconnect;
}

self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'init-global') {
    apiUrl = msg.apiUrl;
    connectGlobal();
  } else if (msg.type === 'join-game') {
    apiUrl = msg.apiUrl;
    connectGame(msg.gameId);
  } else if (msg.type === 'leave-game') {
    if (gameSocket) {
      gameSocket.close();
      gameSocket = null;
    }
    currentGameId = null;
  }
});
