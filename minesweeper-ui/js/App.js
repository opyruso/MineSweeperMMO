import { LangProvider } from './i18n.js';
import { init as initKeycloak, login, logout } from './keycloak.js';
import LoginPage from './pages/LoginPage.js';
import GamesListPage from './pages/GamesListPage.js';
import GamePage from './pages/GamePage.js';
import SettingsPage from './pages/SettingsPage.js';
import InfoPage from './pages/InfoPage.js';
import LeaderboardPage from './pages/LeaderboardPage.js';
import BoostPage from './pages/BoostPage.js';
import RotateMobilePage from './pages/RotateMobilePage.js';

function formatEvent(e) {
  const login = e.login;
  const data = e.data || {};
  switch (e['event-type']) {
    case 'LOGIN':
      return `${login} vient de se connecter`;
    case 'LOADING_MAP':
      return `${login} est entré dans ${data.title}`;
    case 'SCAN_NOTHING':
      return `${login} a scanné en (${data.x},${data.y}) mais n'a rien trouvé`;
    case 'SCAN_MINEDETECTED':
      return `${login} vient de détécter des mines autour de (${data.x},${data.y})`;
    case 'DEFUSED':
      return `${login} vient de désamorcer la mine en (${data.x},${data.y})`;
    case 'EXPLOSION':
      return `${login} vient de se faire exploser sur la mine en (${data.x},${data.y})`;
    default:
      return '';
  }
}

function EventLog({ messages }) {
  return (
    <div className="event-log">
      {messages.map((m) => (
        <div key={m.id}>{m.text}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);
  const [soundsOn, setSoundsOn] = React.useState(true);
  const soundsOnRef = React.useRef(soundsOn);
  window.soundsOnRef = soundsOnRef;
  const [playerData, setPlayerData] = React.useState(null);
  const [view, setView] = React.useState('loading');
  const [currentGameId, setCurrentGameId] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [isLandscape, setIsLandscape] = React.useState(
    window.matchMedia('(orientation: landscape)').matches
  );

  React.useEffect(() => {
    initKeycloak().then((auth) => {
      setAuthenticated(auth);
      setInitialized(true);
    });
  }, []);

  React.useEffect(() => {
    if (!navigator.serviceWorker) return;
    const handler = (event) => {
      const msg = event.data;
      if (msg && msg.type === 'event') {
        const text = formatEvent(msg.data);
        if (text) {
          const id = Date.now() + Math.random();
          setEvents((prev) => [...prev, { id, text }].slice(-5));
          setTimeout(() => {
            setEvents((prev) => prev.filter((m) => m.id !== id));
          }, 5000);
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  React.useEffect(() => {
    if (!initialized) return;
    if (authenticated) {
      setView('games');
    } else {
      setView('login');
    }
  }, [initialized, authenticated]);

  React.useEffect(() => {
    if (!authenticated || !navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.active && reg.active.postMessage({
        type: 'init-global',
        apiUrl: window.CONFIG['minesweeper-api-url'],
      });
    });
  }, [authenticated]);

  React.useEffect(() => {
    const clickSounds = ['sound_click_1.mp3', 'sound_click_2.mp3'];
    const handleClick = () => {
      if (!soundsOnRef.current) return;
      const sound = clickSounds[Math.floor(Math.random() * clickSounds.length)];
      new Audio(`sounds/${sound}`).play();
    };
    window.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('click', handleClick, true);
    };
  }, []);

  React.useEffect(() => {
    soundsOnRef.current = soundsOn;
  }, [soundsOn]);

  React.useEffect(() => {
    const updateLandscape = () =>
      setIsLandscape(window.matchMedia('(orientation: landscape)').matches);
    window.addEventListener('orientationchange', updateLandscape);
    window.addEventListener('resize', updateLandscape);
    updateLandscape();
    return () => {
      window.removeEventListener('orientationchange', updateLandscape);
      window.removeEventListener('resize', updateLandscape);
    };
  }, []);

  React.useEffect(() => {
    const elem = document.documentElement;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;

    const handleFullscreen = () => {
      const landscape = window.matchMedia('(orientation: landscape)').matches;
      if (isStandalone || landscape) {
        if (!document.fullscreenElement && elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        }
      } else if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };

    window.addEventListener('orientationchange', handleFullscreen);
    window.addEventListener('resize', handleFullscreen);
    handleFullscreen();
    return () => {
      window.removeEventListener('orientationchange', handleFullscreen);
      window.removeEventListener('resize', handleFullscreen);
    };
  }, []);

  const toggleSounds = () => setSoundsOn((s) => !s);

  const fetchPlayerData = React.useCallback(() => {
    if (!authenticated) return;
    fetch(`${window.CONFIG['minesweeper-api-url']}/player-data/me`)
      .then((r) => r.json())
      .then(setPlayerData)
      .catch(() => {});
  }, [authenticated]);

  React.useEffect(() => {
    if (authenticated) {
      fetchPlayerData();
    }
  }, [authenticated, fetchPlayerData]);

  if (!initialized) {
    return null;
  }

  let page = null;
  if (view === 'login') {
    page = <LoginPage onLogin={() => login({ idpHint: 'google' })} />;
  } else if (view === 'settings') {
    page = (
      <SettingsPage
        authenticated={authenticated}
        onLogout={() => logout({ redirectUri: window.location.href })}
        soundsOn={soundsOn}
        toggleSounds={toggleSounds}
      />
    );
  } else if (view === 'games') {
    page = (
      <GamesListPage
        onSelectGame={(id) => {
          setCurrentGameId(id);
          setView('game');
        }}
      />
    );
  } else if (view === 'game') {
    page = (
      <GamePage
        id={currentGameId}
        playerData={playerData}
        refreshPlayerData={fetchPlayerData}
      />
    );
  } else if (view === 'info') {
    page = (
      <InfoPage
        playerData={playerData}
        refreshPlayerData={fetchPlayerData}
      />
    );
  } else if (view === 'leaderboard') {
    page = <LeaderboardPage />;
  } else if (view === 'boost') {
    page = <BoostPage refreshPlayerData={fetchPlayerData} />;
  }

  return (
    <LangProvider>
      {!isLandscape && <RotateMobilePage />}
      {authenticated && playerData && (
        <StatsBar data={playerData} setView={setView} />
      )}
      {authenticated && <SettingsButton view={view} setView={setView} />}
      {authenticated && <GamesListButton view={view} setView={setView} />}
      {authenticated && <LeaderboardButton view={view} setView={setView} />}
      {authenticated && <BoostButton view={view} setView={setView} />}
      {page}
      <EventLog messages={events} />
    </LangProvider>
  );
}

function SettingsButton({ view, setView }) {
  if (view === 'settings') {
    return (
      <button
        onClick={() => setView('games')}
        className="settings-button"
        aria-label="Back"
      >
        <img
          src="images/icons/actions/icon_arrow_back.png"
          alt="Back"
          className="icon"
        />
      </button>
    );
  }
  return (
    <button
      onClick={() => setView('settings')}
      className="settings-button"
      aria-label="Settings"
    >
      <img
        src="images/icons/actions/icon_wheel.png"
        alt="Settings"
        className="icon"
      />
    </button>
  );
}

function GamesListButton({ view, setView }) {
  const selected = view === 'games';
  return (
    <button
      onClick={() => setView('games')}
      className={`games-list-button${selected ? ' selected' : ''}`}
      aria-label="Games"
    >
      <img
        src="images/icons/actions/icon_contracts.png"
        alt="Games"
        className="icon"
      />
    </button>
  );
}

function LeaderboardButton({ view, setView }) {
  const selected = view === 'leaderboard';
  return (
    <button
      onClick={() => setView('leaderboard')}
      className={`leaderboard-button${selected ? ' selected' : ''}`}
      aria-label="Leaderboard"
    >
      <img
        src="images/icons/actions/icon_trophy_loser.png"
        alt="Leaderboard"
        className="icon"
      />
    </button>
  );
}

function BoostButton({ view, setView }) {
  const selected = view === 'boost';
  return (
    <button
      onClick={() => setView('boost')}
      className={`boost-button${selected ? ' selected' : ''}`}
      aria-label="Boost"
    >
      <img
        src="images/icons/actions/icon_boost.png"
        alt="Boost"
        className="icon"
      />
    </button>
  );
}

function StatsBar({ data, setView }) {
  return (
    <button onClick={() => setView('info')} className="stats-bar">
      <span>
        <img
          src="images/icons/actions/icon_portfolio.png"
          alt="Gold"
          className="icon"
        />{' '}
        {data.gold}
      </span>{' '}
      <span>
        <img
          src="images/icons/actions/icon_scanner_power.png"
          alt="Scan"
          className="icon"
        />{' '}
        {data.scanRangeMax}
      </span>{' '}
      <span>
        <img
          src="images/icons/actions/icon_medal.png"
          alt="Reputation"
          className="icon"
        />{' '}
        {data.reputation}
      </span>
    </button>
  );
}

