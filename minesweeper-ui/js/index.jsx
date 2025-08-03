const { HashRouter, Routes, Route, Navigate, Link, useLocation } = ReactRouterDOM;

import { LangProvider, LangContext } from '/js/i18n.js';

function App() {
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

  if (!keycloak) {
    return null;
  }

  const toggleSounds = () => setSoundsOn((s) => !s);

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
                soundsOn={soundsOn}
                toggleSounds={toggleSounds}
              />
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home keycloak={keycloak} />
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

function Home({ keycloak }) {
  const { t } = React.useContext(LangContext);
  const [games, setGames] = React.useState(null);

  React.useEffect(() => {
    fetch(`${window.CONFIG['minesweeper-api-url']}/games`, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then(setGames)
      .catch(() => setGames([]));
  }, [keycloak]);

  const isAdmin =
    (keycloak && keycloak.hasRealmRole && keycloak.hasRealmRole('admin')) ||
    (keycloak && keycloak.hasResourceRole && keycloak.hasResourceRole('admin', 'minesweeper-app'));

  if (games === null) {
    return null;
  }

  return (
    <div>
      {games.length === 0 ? (
        <div className="no-games">
          <div className="no-games-message">
            <p>{t.noGame}</p>
          </div>
          {isAdmin && <CreateGameForm keycloak={keycloak} />}
        </div>
      ) : (
        <>
          {isAdmin && <CreateGameForm keycloak={keycloak} />}
          <ul>
            {games.map((g) => (
              <li key={g.id}>{g.name || g.id}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function CreateGameForm({ keycloak }) {
  const { t } = React.useContext(LangContext);
  const [show, setShow] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '',
    width: '',
    height: '',
    mineCount: '',
    endDate: '',
  });

  const open = () => setShow(true);
  const close = () => setShow(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${window.CONFIG['minesweeper-api-url']}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keycloak.token}`,
      },
      body: JSON.stringify({
        title: form.title,
        width: Number(form.width),
        height: Number(form.height),
        mineCount: Number(form.mineCount),
        end_date: form.endDate,
      }),
    }).then(close);
  };

  return (
    <div className="create-game-form">
      <button className="main-button" onClick={open}>
        {t.createGame}
      </button>
      {show && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={handleSubmit}>
            <label>
              {t.gameTitleLabel}
              <input name="title" value={form.title} onChange={handleChange} />
            </label>
            <label>
              {t.width}
              <input name="width" value={form.width} onChange={handleChange} />
            </label>
            <label>
              {t.height}
              <input name="height" value={form.height} onChange={handleChange} />
            </label>
            <label>
              {t.mineCount}
              <input name="mineCount" value={form.mineCount} onChange={handleChange} />
            </label>
            <label>
              {t.endDate}
              <input
                name="endDate"
                type="datetime-local"
                value={form.endDate}
                onChange={handleChange}
              />
            </label>
            <div className="modal-actions">
              <button type="submit" className="main-button">
                {t.create}
              </button>
              <button type="button" className="main-button" onClick={close}>
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}
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

function SettingsPage({ authenticated, onLogout, soundsOn, toggleSounds }) {
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
      <div className="sound-toggle-container">
        <button className="sound-toggle" onClick={toggleSounds} aria-label="Toggle sound">
          <i className={`fa-solid ${soundsOn ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
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

