import { LangContext } from '../i18n.js';

export default function SettingsPage({ authenticated, keycloak, onLogout, soundsOn, toggleSounds }) {
  const { lang, changeLang, t } = React.useContext(LangContext);
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (!authenticated) return;
    fetch(`${window.CONFIG['minesweeper-api-url']}/players/me`, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then((p) => setName(p.name))
      .catch(() => {});
  }, [authenticated, keycloak]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${window.CONFIG['minesweeper-api-url']}/players/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keycloak.token}`,
      },
      body: JSON.stringify({ name }),
    });
  };

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
        <>
          <form className="name-form" onSubmit={handleSubmit}>
            <label>
              {t.playerName}
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <button type="submit" className="main-button">
              {t.save}
            </button>
          </form>
          <div className="logout-container">
            <button onClick={onLogout}>{t.logout}</button>
          </div>
        </>
      )}
    </div>
  );
}
