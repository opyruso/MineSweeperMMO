const { Link } = ReactRouterDOM;
import { LangContext } from '../i18n.js';

export default function GamesListPage({ keycloak }) {
  const { t } = React.useContext(LangContext);
  const [games, setGames] = React.useState(null);

  const loadGames = React.useCallback(() => {
    fetch(`${window.CONFIG['minesweeper-api-url']}/games`, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then(setGames)
      .catch(() => setGames([]));
  }, [keycloak]);

  React.useEffect(() => {
    loadGames();
  }, [loadGames]);

  const isAdmin =
    (keycloak && keycloak.hasRealmRole && keycloak.hasRealmRole('admin')) ||
    (keycloak &&
      keycloak.hasResourceRole &&
      keycloak.hasResourceRole('admin', 'minesweeper-app'));

  const formatRemaining = React.useCallback(
    (date) => {
      const diff = new Date(date) - new Date();
      if (diff <= 1000) return t.finished;
      const s = Math.floor(diff / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      if (d >= 1) return `${d}${t.dayShort}`;
      if (h >= 1) return `${h}${t.hourShort}`;
      if (m >= 1) return `${m}${t.minuteShort}`;
      if (s >= 1) return `${s}${t.secondShort}`;
      return t.finished;
    },
    [t]
  );

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
          {isAdmin && (
            <CreateGameForm keycloak={keycloak} onGameCreated={loadGames} />
          )}
        </div>
      ) : (
        <div className="games-page">
          <div className="games-list-container">
            <ul className="games-list">
              {games.map((g) => (
                <li key={g.id}>
                  <Link to={`/games/${g.id}`} className="game-item">
                    <div className="game-title-line">
                      {g.title} (
                      <img
                        src="images/icons/actions/icon_calendar.png"
                        alt="end"
                        className="icon"
                      />{' '}
                      {formatRemaining(g.endDate)})
                    </div>
                    <div className="game-info-line">
                      <img
                        src="images/icons/actions/icon_bombs_found.png"
                        alt="bombs"
                        className="icon"
                      />{' '}
                      {g.foundMines}/{g.mineCount}, {' '}
                      <img
                        src="images/icons/actions/icon_map_size.png"
                        alt="size"
                        className="icon"
                      />{' '}
                      {g.width}L*{g.height}H
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {isAdmin && (
            <CreateGameForm keycloak={keycloak} onGameCreated={loadGames} />
          )}
        </div>
      )}
    </div>
  );
}

function CreateGameForm({ keycloak, onGameCreated }) {
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
    }).then((r) => {
      if (r.ok && onGameCreated) {
        onGameCreated();
      }
      close();
    });
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
