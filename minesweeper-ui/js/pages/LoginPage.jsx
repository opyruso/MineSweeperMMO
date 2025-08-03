import { LangContext } from '/js/i18n.js';

export default function LoginPage({ onLogin }) {
  const { t } = React.useContext(LangContext);
  return (
    <div className="login-page">
      <button onClick={onLogin}>{t.login}</button>
    </div>
  );
}
