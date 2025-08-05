const { HashRouter, Link, useLocation, useNavigate } = ReactRouterDOM;
import { LangProvider } from './i18n.js';
import AppRouter from './router.js';

export default function App() {
  const [keycloak, setKeycloak] = React.useState(null);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [soundsOn, setSoundsOn] = React.useState(true);
  const soundsOnRef = React.useRef(soundsOn);
  window.soundsOnRef = soundsOnRef;
  const [playerData, setPlayerData] = React.useState(null);
  const [isPortrait, setIsPortrait] = React.useState(
    window.matchMedia('(orientation: portrait)').matches
  );

  React.useEffect(() => {
    const kc = new Keycloak({
      url: window.CONFIG['auth-url'],
      realm: window.CONFIG['auth-realm'],
      clientId: window.CONFIG['auth-client-id'],
    });
    kc.init({ onLoad: 'check-sso', checkLoginIframe: false })
      .then((auth) => {
        setAuthenticated(auth);
        setKeycloak(kc);
      })
      .catch(() => {
        setKeycloak(kc);
      });
  }, []);

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
  const login = () => keycloak.login({ idpHint: 'google' });

  const fetchPlayerData = React.useCallback(() => {
    if (!keycloak) return;
    fetch(`${window.CONFIG['minesweeper-api-url']}/player-data/me`, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then(setPlayerData)
      .catch(() => {});
  }, [keycloak]);

  React.useEffect(() => {
    if (authenticated) {
      fetchPlayerData();
    }
  }, [authenticated, fetchPlayerData]);

  React.useEffect(() => {
    if (!keycloak || !authenticated) return;
    const id = setInterval(() => {
      keycloak.updateToken(60).catch(() => {
        setAuthenticated(false);
      });
    }, 10000);
    return () => clearInterval(id);
  }, [keycloak, authenticated]);

  if (!keycloak) {
    return null;
  }

  return (
    <LangProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {authenticated && playerData && <StatsBar data={playerData} />}
        <SettingsButton />
        <GamesListButton />
        <LeaderboardButton />
        <BoostButton />
        <AppRouter
          authenticated={authenticated}
          keycloak={keycloak}
          login={login}
          soundsOn={soundsOn}
          toggleSounds={toggleSounds}
          playerData={playerData}
          refreshPlayerData={fetchPlayerData}
        />
        {isPortrait && <RotateMobileOverlay />}
      </HashRouter>
    </LangProvider>
  );
}

function SettingsButton() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === '/settings') {
    return (
      <button
        onClick={() => navigate(location.state?.from || '/')}
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
    <Link
      to="/settings"
      state={{ from: location.pathname }}
      className="settings-button"
      aria-label="Settings"
    >
      <img
        src="images/icons/actions/icon_wheel.png"
        alt="Settings"
        className="icon"
      />
    </Link>
  );
}

function GamesListButton() {
  const location = useLocation();
  const selected = location.pathname === '/';
  return (
    <Link
      to="/"
      className={`games-list-button${selected ? ' selected' : ''}`}
      aria-label="Games"
    >
      <img
        src="images/icons/actions/icon_contracts.png"
        alt="Games"
        className="icon"
      />
    </Link>
  );
}

function LeaderboardButton() {
  const location = useLocation();
  const selected = location.pathname === '/leaderboard';
  return (
    <Link
      to="/leaderboard"
      className={`leaderboard-button${selected ? ' selected' : ''}`}
      aria-label="Leaderboard"
    >
      <img
        src="images/icons/actions/icon_trophy_loser.png"
        alt="Leaderboard"
        className="icon"
      />
    </Link>
  );
}

function BoostButton() {
  const location = useLocation();
  const selected = location.pathname === '/boost';
  return (
    <Link
      to="/boost"
      className={`boost-button${selected ? ' selected' : ''}`}
      aria-label="Boost"
    >
      <img
        src="images/icons/actions/icon_boost.png"
        alt="Boost"
        className="icon"
      />
    </Link>
  );
}

function StatsBar({ data }) {
  return (
    <Link to="/info" className="stats-bar">
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
    </Link>
  );
}

function RotateMobileOverlay() {
  return (
    <div className="rotate-mobile-page">
      <i className="fa-solid fa-mobile-screen rotate-mobile-icon"></i>
    </div>
  );
}
