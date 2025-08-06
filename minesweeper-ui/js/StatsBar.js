const { Link } = ReactRouterDOM;

export default function StatsBar({ data }) {
  return (
    <Link to="/info" className="stats-bar">
      <span>
        <img
          src="images/icons/actions/icon_portfolio.png"
          alt="Gold"
          className="icon"
        />{' '}
        {data.gold}
      </span>{' '}
      <span>
        <img
          src="images/icons/actions/icon_scanner_power.png"
          alt="Scan"
          className="icon"
        />{' '}
        {data.scanRangeMax}
      </span>{' '}
      <span>
        <img
          src="images/icons/actions/icon_medal.png"
          alt="Reputation"
          className="icon"
        />{' '}
        {data.reputation}
      </span>
    </Link>
  );
}
