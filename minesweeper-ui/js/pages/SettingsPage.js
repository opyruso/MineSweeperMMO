import { LangContext } from '/js/i18n.js';

export default function SettingsPage({ authenticated, onLogout, soundsOn, toggleSounds }) {
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
