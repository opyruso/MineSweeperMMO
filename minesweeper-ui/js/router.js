const { Routes, Route, Navigate } = ReactRouterDOM;
import LoginPage from '/js/pages/LoginPage.js';
import GamesListPage from '/js/pages/GamesListPage.js';
import GamePage from '/js/pages/GamePage.js';
import SettingsPage from '/js/pages/SettingsPage.js';

export default function AppRouter({ authenticated, keycloak, login, soundsOn, toggleSounds }) {
  const RequireAuth = ({ children }) =>
    authenticated ? children : <Navigate to="/login" />;

  const RequireUnauth = ({ children }) =>
    authenticated ? <Navigate to="/" /> : children;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireUnauth>
            <LoginPage onLogin={login} />
          </RequireUnauth>
        }
      />
      <Route
        path="/settings"
        element={
          <SettingsPage
            authenticated={authenticated}
            onLogout={() =>
              keycloak.logout({
                redirectUri: window.location.href.split('#')[0] + '#/login',
              })
            }
            soundsOn={soundsOn}
            toggleSounds={toggleSounds}
          />
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <GamesListPage keycloak={keycloak} />
          </RequireAuth>
        }
      />
      <Route
        path="/games/:id"
        element={
          <RequireAuth>
            <GamePage keycloak={keycloak} />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
