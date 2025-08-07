import { hasRealmRole, hasResourceRole } from '../keycloak.js';

export default function BoostPage({ refreshPlayerData }) {
  const apiUrl = window.CONFIG['minesweeper-api-url'];
  const items = [
    {
      icon: 'icon_buy_small.png',
      gold: 1000,
      price: '1.99€',
      amount: '1.99',
      url: 'https://www.paypal.com/paypalme/opyruso/1.99',
    },
    {
      icon: 'icon_buy_medium.png',
      gold: 5000,
      price: '4.99€',
      amount: '4.99',
      url: 'https://www.paypal.com/paypalme/opyruso/4.99',
    },
    {
      icon: 'icon_buy_large.png',
      gold: 10000,
      price: '9.99€',
      amount: '9.99',
      url: 'https://www.paypal.com/paypalme/opyruso/9.99',
    },
  ];

  const [popup, setPopup] = React.useState(null);
  const isAdmin =
    hasRealmRole('admin') || hasResourceRole('admin', 'minesweeper-app');

  const checkPayment = (amount, intervalId) => {
    return fetch(`${apiUrl}/checkpayment/${amount}`).then((res) => {
      if (res.status === 200) {
        refreshPlayerData();
        if (intervalId) clearInterval(intervalId);
        setPopup(null);
        alert('Paiement confirmé');
        return true;
      }
      return false;
    });
  };

  const buy = (item) => {
    window.open(item.url, '_blank');
    const intervalId = setInterval(() => {
      checkPayment(item.amount, intervalId);
    }, 5000);
    setPopup({ intervalId });
  };

  const cancel = () => {
    if (popup?.intervalId) clearInterval(popup.intervalId);
    setPopup(null);
  };

  const verifyOnce = () => {
    const amount = window.prompt('Montant à vérifier ? (1.99, 4.99, 9.99)');
    if (!amount) return;
    fetch(`${apiUrl}/checkpayment/${amount}`).then((res) => {
      if (res.status === 200) {
        refreshPlayerData();
        alert('Paiement confirmé');
      } else {
        alert('Paiement non trouvé');
      }
    });
  };

  return (
    <div className="boost-page">
      <div className="watermark">Under construction</div>
      <div className="boost-container">
        {items.map((it) => (
          <div
            key={it.gold}
            className={`boost-item${!isAdmin ? ' disabled' : ''}`}
            onClick={isAdmin ? () => buy(it) : undefined}
          >
            <img src={`images/icons/actions/${it.icon}`} alt="buy" className="icon" />
            <div>+{it.gold}po</div>
            <div>{it.price}</div>
          </div>
        ))}
      </div>
      <div
        className={`boost-verify${!isAdmin ? ' disabled' : ''}`}
        onClick={isAdmin ? verifyOnce : undefined}
      >
        Vérifier mon paiement
      </div>
      {popup && (
        <div className="payment-popup">
          <div className="popup-box">
            <div>Paiement en cours...</div>
            <button onClick={cancel}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
