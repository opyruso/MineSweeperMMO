import { LangContext } from '../i18n.js';

export default function InfoPage({ keycloak, playerData, refreshPlayerData }) {
  const { t } = React.useContext(LangContext);
  const apiUrl = window.CONFIG['minesweeper-api-url'];

  if (!playerData) return null;

  const upgradeScan = () => {
    fetch(`${apiUrl}/player-data/me/upgrade-scan`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then(() => refreshPlayerData());
  };

  const upgradeIncome = () => {
    fetch(`${apiUrl}/player-data/me/upgrade-income`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then(() => refreshPlayerData());
  };

  const scanCost = Math.pow(2, playerData.scanRangeMax - 9);
  const incomeCost = Math.pow(2, (playerData.incomePerDay - 50) / 10);

  return (
    <div className="info-page">
      <p>
        {t.dailyIncome}: {playerData.incomePerDay} {t.gold}
      </p>
      <div className="upgrade-block">
        <button className="main-button" onClick={upgradeScan}>
          {t.upgradeScan}
        </button>
        <p>
          {t.cost}: {scanCost}
        </p>
      </div>
      <div className="upgrade-block">
        <button className="main-button" onClick={upgradeIncome}>
          {t.upgradeIncome}
        </button>
        <p>
          {t.cost}: {incomeCost}
        </p>
      </div>
    </div>
  );
}
