const { useState, useEffect } = React;
import { LangContext } from '../i18n.js';

export default function LeaderboardPage() {
  const { t } = React.useContext(LangContext);
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState([]);
  const apiUrl = window.CONFIG['minesweeper-api-url'];

  const load = React.useCallback(() => {
    fetch(`${apiUrl}/leaderboard/${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, [apiUrl, period]);

  useEffect(() => {
    load();
  }, [load]);

  const renderIcon = (index) => {
    if (index === 0) return 'icon_trophy_top1.png';
    if (index === 1) return 'icon_trophy_top2.png';
    if (index === 2) return 'icon_trophy_top3.png';
    return null;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-tabs">
        {['daily', 'weekly', 'monthly'].map((p) => (
          <button
            key={p}
            className={period === p ? 'active' : ''}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <ul className="leaderboard-list">
        {data.map((row, i) => (
          <li key={row.playerName}>
            {renderIcon(i) && (
              <img
                src={`images/icons/actions/${renderIcon(i)}`}
                alt="rank"
                className="icon"
              />
            )}
            {row.playerName}: {row.points}
          </li>
        ))}
      </ul>
    </div>
  );
}
