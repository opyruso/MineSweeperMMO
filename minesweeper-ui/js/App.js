const { HashRouter, Link, useLocation } = ReactRouterDOM;
import { LangProvider } from './i18n.js';
import AppRouter from './router.js';

export default function App() {
  const [keycloak, setKeycloak] = React.useState(null);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [soundsOn, setSoundsOn] = React.useState(true);
  const soundsOnRef = React.useRef(soundsOn);

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

  return (
    <LangProvider>
      <HashRouter>
        <SettingsButton />
        <AppRouter
          authenticated={authenticated}
          keycloak={keycloak}
          login={login}
          soundsOn={soundsOn}
          toggleSounds={toggleSounds}
        />
      </HashRouter>
    </LangProvider>
  );
}

function SettingsButton() {
  const location = useLocation();
  if (location.pathname === '/settings') {
    return (
      <Link to="/" className="settings-button" aria-label="Back">
        <i className="fa-solid fa-arrow-left"></i>
      </Link>
    );
  }
  return (
    <Link to="/settings" className="settings-button" aria-label="Settings">
      <i className="fa-solid fa-gear"></i>
    </Link>
  );
}
