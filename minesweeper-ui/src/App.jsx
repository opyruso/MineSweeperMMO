import { Link, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Game from './pages/Game';
import Settings from './pages/Settings';

function App() {
  return (
    <>
      <nav>
        <Link to="/login">Login</Link> |{' '}
        <Link to="/game">Game</Link> |{' '}
        <Link to="/settings">Settings</Link>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/game" element={<Game />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}

export default App;
