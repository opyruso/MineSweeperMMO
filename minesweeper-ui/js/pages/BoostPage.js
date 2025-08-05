export default function BoostPage({ refreshPlayerData }) {
  const apiUrl = window.CONFIG['minesweeper-api-url'];
  const buy = (amount) => {
    fetch(`${apiUrl}/player-data/me/add-gold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    }).then(() => refreshPlayerData());
  };
  const items = [
    { icon: 'icon_buy_small.png', gold: 1000, price: '1.99€' },
    { icon: 'icon_buy_medium.png', gold: 5000, price: '4.99€' },
    { icon: 'icon_buy_large.png', gold: 10000, price: '9.99€' },
  ];
  return (
    <div className="boost-page">
      <div className="boost-container">
        {items.map((it) => (
          <div key={it.gold} className="boost-item" onClick={() => buy(it.gold)}>
            <img src={`images/icons/actions/${it.icon}`} alt="buy" className="icon" />
            <div>+{it.gold}po</div>
            <div>{it.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
