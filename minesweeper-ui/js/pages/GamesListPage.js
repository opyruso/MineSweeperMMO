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

  if (games === null) {
    return null;
  }

  return (
    <div>
      <Link to="/info" className="main-button">
        {t.info}
      </Link>
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
                    <span className="game-prefix">
                      {g.foundMines}/{g.mineCount}:
                    </span>
                    <span className="game-title">{g.title}</span>
                    <span className="game-suffix">
                      , {new Date(g.endDate).toLocaleString()} ({g.width}L*{g.height}H)
                    </span>
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
