const { HashRouter, Routes, Route, Navigate, Link, useLocation } = ReactRouterDOM;

import { LangProvider, LangContext } from '/js/i18n.js';

function App() {
  const [keycloak, setKeycloak] = React.useState(null);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [musicOn, setMusicOn] = React.useState(true);
  const musicRef = React.useRef(null);
  const musicOnRef = React.useRef(musicOn);

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
    musicRef.current = window.backgroundMusic || new Audio('sounds/sound_background.mp3');
    musicRef.current.loop = true;
    musicRef.current.volume = 0.01;
    if (musicOnRef.current) {
      musicRef.current.play().catch(() => {});
    }
    const clickSounds = ['sound_click_1.mp3', 'sound_click_2.mp3'];
    const handleClick = () => {
      const sound = clickSounds[Math.floor(Math.random() * clickSounds.length)];
      new Audio(`sounds/${sound}`).play();
      if (musicOnRef.current && musicRef.current.paused) {
        musicRef.current.play();
      }
    };
    window.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('click', handleClick, true);
    };
  }, []);

  React.useEffect(() => {
    musicOnRef.current = musicOn;
    if (!musicRef.current) return;
    if (musicOn) {
      musicRef.current.play().catch(() => {});
    } else {
      musicRef.current.pause();
    }
  }, [musicOn]);

  if (!keycloak) {
    return null;
  }

  const toggleMusic = () => setMusicOn((m) => !m);

  const login = () => keycloak.login({ idpHint: 'google' });

  const RequireAuth = ({ children }) =>
    authenticated ? children : <Navigate to="/login" />;

  const RequireUnauth = ({ children }) =>
    authenticated ? <Navigate to="/" /> : children;

  return (
    <LangProvider>
      <HashRouter>
        <SettingsButton />
        <Routes>
          <Route
            path="/login"
            element={
              <RequireUnauth>
                <LoginPage onLogin={login} />
              </RequireUnauth>
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                authenticated={authenticated}
                onLogout={() => keycloak.logout()}
                musicOn={musicOn}
                toggleMusic={toggleMusic}
              />
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
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
  if (location.pathname === '/login') {
    return null;
  }
  return (
    <Link to="/settings" className="settings-button" aria-label="Settings">
      <i className="fa-solid fa-gear"></i>
    </Link>
  );
}

function Home() {
  const { t } = React.useContext(LangContext);
  return (
    <div>
      <h1>{t.title}</h1>
      <nav>
        <Link to="/settings">{t.settings}</Link>
      </nav>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const { t } = React.useContext(LangContext);
  return (
    <div className="login-page">
      <button onClick={onLogin}>{t.login}</button>
    </div>
  );
}

function SettingsPage({ authenticated, onLogout, musicOn, toggleMusic }) {
  const { lang, changeLang, t } = React.useContext(LangContext);
  return (
    <div className="settings-page">
      <div className="language-selection">
        <button
          className={`flag-button ${lang === 'en' ? 'active' : ''}`}
          onClick={() => changeLang('en')}
        >
          <span className="fi fi-gb"></span>
        </button>
        <button
          className={`flag-button ${lang === 'fr' ? 'active' : ''}`}
          onClick={() => changeLang('fr')}
        >
          <span className="fi fi-fr"></span>
        </button>
      </div>
      <div className="music-toggle-container">
        <button className="music-toggle" onClick={toggleMusic} aria-label="Toggle music">
          <i className={`fa-solid ${musicOn ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
        </button>
      </div>
      {authenticated && (
        <div className="logout-container">
          <button onClick={onLogout}>{t.logout}</button>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

