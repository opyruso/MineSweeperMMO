import { LangContext } from '../i18n.js';
import StatsBar from '../StatsBar.js';

export default function SettingsPage({ authenticated, onLogout, soundsOn, toggleSounds, playerData }) {
  const { lang, changeLang, t } = React.useContext(LangContext);
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (!authenticated) return;
    fetch(`${window.CONFIG['minesweeper-api-url']}/players/me`)
      .then((r) => r.json())
      .then((p) => setName(p.name))
      .catch(() => {});
  }, [authenticated]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${window.CONFIG['minesweeper-api-url']}/players/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
  };

  return (
    <div className="settings-page">
      {authenticated && playerData && <StatsBar data={playerData} />}
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
          <form id="name-form" className="name-form" onSubmit={handleSubmit}>
            <label htmlFor="player-name-input" className="player-name-label">
              {t.playerName}
            </label>
            <input
              id="player-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </form>
          <div className="action-buttons">
            <button type="submit" form="name-form" className="main-button">
              {t.save}
            </button>
            <button onClick={onLogout} className="main-button">
              {t.logout}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
