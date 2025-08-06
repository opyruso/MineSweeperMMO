import { LangProvider } from './i18n.js';
import { init as initKeycloak, login, logout } from './keycloak.js';
import LoginPage from './pages/LoginPage.js';
import GamesListPage from './pages/GamesListPage.js';
import GamePage from './pages/GamePage.js';
import SettingsPage from './pages/SettingsPage.js';
import InfoPage from './pages/InfoPage.js';
import LeaderboardPage from './pages/LeaderboardPage.js';
import BoostPage from './pages/BoostPage.js';

export default function App() {
  const [authenticated, setAuthenticated] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);
  const [soundsOn, setSoundsOn] = React.useState(true);
  const soundsOnRef = React.useRef(soundsOn);
  window.soundsOnRef = soundsOnRef;
  const [playerData, setPlayerData] = React.useState(null);
  const [isPortrait, setIsPortrait] = React.useState(
    window.matchMedia('(orientation: portrait)').matches
  );
  const [view, setView] = React.useState('loading');
  const [currentGameId, setCurrentGameId] = React.useState(null);

  React.useEffect(() => {
    initKeycloak().then((auth) => {
      setAuthenticated(auth);
      setInitialized(true);
    });
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
    const mql = window.matchMedia('(orientation: portrait)');
    const handler = (e) => setIsPortrait(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      mql.addListener(handler);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, []);

  React.useEffect(() => {
    const lockLandscape = () => {
      const elem = document.documentElement;
      if (!document.fullscreenElement && elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    };

    window.addEventListener('orientationchange', lockLandscape);
    window.addEventListener('resize', lockLandscape);
    lockLandscape();
    return () => {
      window.removeEventListener('orientationchange', lockLandscape);
      window.removeEventListener('resize', lockLandscape);
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
      {authenticated && playerData && (
        <StatsBar data={playerData} setView={setView} />
      )}
      {authenticated && <SettingsButton view={view} setView={setView} />}
      {authenticated && <GamesListButton view={view} setView={setView} />}
      {authenticated && <LeaderboardButton view={view} setView={setView} />}
      {/** BoostButton hidden for now **/}
      {page}
      {isPortrait && <RotateMobileOverlay />}
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

function RotateMobileOverlay() {
  return (
    <div className="rotate-mobile-page">
      <i className="fa-solid fa-mobile-screen rotate-mobile-icon"></i>
    </div>
  );
}
