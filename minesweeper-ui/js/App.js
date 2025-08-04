const { HashRouter, Link, useLocation, useNavigate } = ReactRouterDOM;
import { LangProvider } from './i18n.js';
import AppRouter from './router.js';

export default function App() {
  const [keycloak, setKeycloak] = React.useState(null);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [soundsOn, setSoundsOn] = React.useState(true);
  const soundsOnRef = React.useRef(soundsOn);
  const [playerData, setPlayerData] = React.useState(null);

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
    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const elem = document.documentElement;
      if (isLandscape) {
        if (!document.fullscreenElement && elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        }
      } else if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    };

    window.addEventListener('resize', handleOrientationChange);
    handleOrientationChange();
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  if (!keycloak) {
    return null;
  }

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

  return (
    <LangProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {authenticated && playerData && <StatsBar data={playerData} />}
        <SettingsButton />
        <AppRouter
          authenticated={authenticated}
          keycloak={keycloak}
          login={login}
          soundsOn={soundsOn}
          toggleSounds={toggleSounds}
          playerData={playerData}
          refreshPlayerData={fetchPlayerData}
        />
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
        <i className="fa-solid fa-arrow-left"></i>
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
      <i className="fa-solid fa-gear"></i>
    </Link>
  );
}

function StatsBar({ data }) {
  return (
    <div className="stats-bar">
      {`Gold: ${data.gold} po    scan: ${data.scanRangeMax}    reputation: ${data.reputation}`}
    </div>
  );
}
