import { LangContext } from '../i18n.js';

export default function RotateMobilePage() {
  const { t } = React.useContext(LangContext);
  const [installPrompt, setInstallPrompt] = React.useState(null);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isIos, setIsIos] = React.useState(false);

  React.useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(ios);

    if (window.deferredPrompt) {
      setInstallPrompt(window.deferredPrompt);
    }
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      window.deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.finally(() => setInstallPrompt(null));
  };

  return (
    <div className="rotate-mobile-page">
      <div>{t.rotateDevice}</div>
      {!isStandalone && (
        <div className="install-banner">
          {isIos ? (
            <div className="install-instructions">{t.installInstructionsIos}</div>
          ) : (
            installPrompt && (
              <>
                <div className="install-card">
                  <img src="images/icons/icon-192.png" alt={t.gameName} />
                  <div className="install-name">{t.gameName}</div>
                </div>
                <button className="install-action" onClick={handleInstall}>
                  {t.install}
                </button>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
