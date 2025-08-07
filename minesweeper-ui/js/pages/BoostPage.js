export default function BoostPage({ refreshPlayerData }) {
  const apiUrl = window.CONFIG['minesweeper-api-url'];
  const items = [
    {
      icon: 'icon_buy_small.png',
      gold: 1000,
      price: '1.99€',
      amount: '1.99',
      url: 'https://www.paypal.com/ncp/payment/KJACBRYGFXXUS',
    },
    {
      icon: 'icon_buy_medium.png',
      gold: 5000,
      price: '4.99€',
      amount: '4.99',
      url: 'https://www.paypal.com/ncp/payment/6ZWG8UA58SXGE',
    },
    {
      icon: 'icon_buy_large.png',
      gold: 10000,
      price: '9.99€',
      amount: '9.99',
      url: 'https://www.paypal.com/ncp/payment/45GB4WGBFMQXW',
    },
  ];

  const [popup, setPopup] = React.useState(null);

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
      <div className="boost-container">
        {items.map((it) => (
          <div key={it.gold} className="boost-item" onClick={() => buy(it)}>
            <img src={`images/icons/actions/${it.icon}`} alt="buy" className="icon" />
            <div>+{it.gold}po</div>
            <div>{it.price}</div>
          </div>
        ))}
      </div>
      <div className="boost-verify" onClick={verifyOnce}>
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
