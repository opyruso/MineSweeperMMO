const { Routes, Route, Navigate } = ReactRouterDOM;
import LoginPage from './pages/LoginPage.js';
import GamesListPage from './pages/GamesListPage.js';
import GamePage from './pages/GamePage.js';
import SettingsPage from './pages/SettingsPage.js';
import InfoPage from './pages/InfoPage.js';
import LeaderboardPage from './pages/LeaderboardPage.js';
import BoostPage from './pages/BoostPage.js';

export default function AppRouter({ authenticated, login, logout, soundsOn, toggleSounds, playerData, refreshPlayerData }) {
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
              logout({
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
            <GamesListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/games/:id"
        element={
          <RequireAuth>
            <GamePage playerData={playerData} refreshPlayerData={refreshPlayerData} />
          </RequireAuth>
        }
      />
      <Route
        path="/info"
        element={
          <RequireAuth>
            <InfoPage playerData={playerData} refreshPlayerData={refreshPlayerData} />
          </RequireAuth>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <RequireAuth>
            <LeaderboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/boost"
        element={
          <RequireAuth>
            <BoostPage refreshPlayerData={refreshPlayerData} />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
