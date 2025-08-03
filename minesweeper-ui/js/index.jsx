const { HashRouter, Routes, Route, Navigate, Link } = ReactRouterDOM;

import { LangProvider, LangContext } from '/js/i18n.js';

function App() {
  const [keycloak, setKeycloak] = React.useState(null);
  const [authenticated, setAuthenticated] = React.useState(false);

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

  if (!keycloak) {
    return null;
  }

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
          <Route path="/settings" element={<SettingsPage />} />
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
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <button onClick={onLogin}>{t.login}</button>
      <div style={{ marginTop: '1rem' }}>
        <Link to="/settings">{t.settings}</Link>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { lang, changeLang, t } = React.useContext(LangContext);
  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>{t.settings}</h2>
      <div>
        <button onClick={() => changeLang('en')} disabled={lang === 'en'}>
          <span className="fi fi-gb"></span> {t.english}
        </button>
        <button onClick={() => changeLang('fr')} disabled={lang === 'fr'}>
          <span className="fi fi-fr"></span> {t.french}
        </button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

