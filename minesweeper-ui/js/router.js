const { Routes, Route, Navigate } = ReactRouterDOM;
import LoginPage from './pages/LoginPage.js';
import GamesListPage from './pages/GamesListPage.js';
import GamePage from './pages/GamePage.js';
import SettingsPage from './pages/SettingsPage.js';
import InfoPage from './pages/InfoPage.js';

export default function AppRouter({ authenticated, keycloak, login, soundsOn, toggleSounds, playerData, refreshPlayerData }) {
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
            keycloak={keycloak}
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
            <GamePage keycloak={keycloak} playerData={playerData} refreshPlayerData={refreshPlayerData} />
          </RequireAuth>
        }
      />
      <Route
        path="/info"
        element={
          <RequireAuth>
            <InfoPage keycloak={keycloak} playerData={playerData} refreshPlayerData={refreshPlayerData} />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
