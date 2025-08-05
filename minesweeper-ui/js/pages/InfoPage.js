import { LangContext } from '../i18n.js';
import { PlayerDataContext } from '../playerData.js';

export default function InfoPage() {
  const { playerData, refreshPlayerData } = React.useContext(PlayerDataContext);
  const { t } = React.useContext(LangContext);
  const apiUrl = window.CONFIG['minesweeper-api-url'];

  if (!playerData) return null;

  const upgradeScan = () => {
    fetch(`${apiUrl}/player-data/me/upgrade-scan`, {
      method: 'POST',
    })
      .then((r) => r.json())
      .then(() => refreshPlayerData());
  };

  const upgradeIncome = () => {
    fetch(`${apiUrl}/player-data/me/upgrade-income`, {
      method: 'POST',
    })
      .then((r) => r.json())
      .then(() => refreshPlayerData());
  };

  const scanCost = Math.pow(2, playerData.scanRangeMax - 9);
  const incomeCost = Math.pow(2, (playerData.incomePerDay - 50) / 10);

  return (
    <div className="info-page">
      <div className="income-line">
        {t.dailyIncome}: {playerData.incomePerDay} {t.gold}
      </div>
      <div className="upgrade-row">
        <div className="upgrade-block">
          <button className="main-button upgrade-button" onClick={upgradeScan}>
            <img
              src="images/icons/actions/icon_upgrade_scanner.png"
              alt={t.upgradeScan}
            />
          </button>
          <div className="upgrade-cost">
            {t.cost}: {scanCost}
          </div>
        </div>
        <div className="upgrade-block">
          <button className="main-button upgrade-button" onClick={upgradeIncome}>
            <img
              src="images/icons/actions/icon_upgrade_income.png"
              alt={t.upgradeIncome}
            />
          </button>
          <div className="upgrade-cost">
            {t.cost}: {incomeCost}
          </div>
        </div>
      </div>
    </div>
  );
}
