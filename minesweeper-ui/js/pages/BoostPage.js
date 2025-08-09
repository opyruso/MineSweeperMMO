import { getUserId } from '../keycloak.js';

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
  const [checking, setChecking] = React.useState(false);

  const checkPayment = (intervalId) => {
    return fetch(`${apiUrl}/checkpayment`)
      .then((res) =>
        res.ok ? res.json() : { 'valid-payment': 0, 'pending-payment': 0 }
      )
      .then((data) => {
        const count = data['valid-payment'] || 0;
        if (count > 0) {
          refreshPlayerData();
          if (intervalId) clearInterval(intervalId);
          setPopup(null);
          alert(
            count === 1
              ? 'Payment validé!'
              : `${count} Payments validés!`
          );
        }
        return data;
      })
      .catch(() => ({ 'valid-payment': 0, 'pending-payment': 0 }));
  };

  const buy = (item) => {
    setPopup({ message: 'Initialisation du payment...', cancelDisabled: true });
    checkPayment()
      .then((data) => {
        const pending = data['pending-payment'] || 0;
        if (pending > 0) {
          const userId = getUserId();
          const winUrl = `${item.url}?custom=${encodeURIComponent(userId)}`;
          window.open(winUrl, '_blank');
          const intervalId = setInterval(() => {
            checkPayment(intervalId);
          }, 10000);
          setPopup({
            message: 'En attente de validation...',
            intervalId,
            cancelDisabled: false,
          });
          return;
        }
        fetch(`${apiUrl}/initpayment/${item.amount}`)
          .then((res) => {
            if (res.status === 200 || res.status === 409) {
              const userId = getUserId();
              const winUrl = `${item.url}?custom=${encodeURIComponent(userId)}`;
              window.open(winUrl, '_blank');
              const intervalId = setInterval(() => {
                checkPayment(intervalId);
              }, 10000);
              setPopup({
                message: 'En attente de validation...',
                intervalId,
                cancelDisabled: false,
              });
            } else {
              setPopup({ message: 'Oops... désolé...', cancelDisabled: false });
            }
          })
          .catch(() =>
            setPopup({ message: 'Oops... désolé...', cancelDisabled: false })
          );
      })
      .catch(() =>
        setPopup({ message: 'Oops... désolé...', cancelDisabled: false })
      );
  };

  const cancel = () => {
    if (popup?.intervalId) clearInterval(popup.intervalId);
    setPopup(null);
  };

  const verifyOnce = () => {
    setChecking(true);
    fetch(`${apiUrl}/checkpayment`)
      .then((res) => (res.ok ? res.json() : { 'valid-payment': 0 }))
      .then((data) => {
        const count = data['valid-payment'] || 0;
        if (count === 0) {
          setPopup({ message: "Aucun payment n'a été trouvé", cancelDisabled: false });
        } else if (count === 1) {
          refreshPlayerData();
          alert('Payment validé!');
        } else {
          refreshPlayerData();
          alert(`${count} Payments validés!`);
        }
      })
      .finally(() => setChecking(false));
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
      <div
        className={`boost-verify${checking ? ' disabled' : ''}`}
        onClick={checking ? undefined : verifyOnce}
      >
        Vérifier maintenant
      </div>
      {popup && (
        <div className="payment-popup">
          <div className="popup-box">
            <div>{popup.message}</div>
            <button onClick={cancel} disabled={popup.cancelDisabled}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
