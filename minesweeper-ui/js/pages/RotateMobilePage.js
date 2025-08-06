import { LangContext } from '../i18n.js';

export default function RotateMobilePage() {
  const { t } = React.useContext(LangContext);
  return <div className="rotate-mobile-page">{t.rotateDevice}</div>;
}
