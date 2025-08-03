const { useParams } = ReactRouterDOM;
import { LangContext } from '../i18n.js';

export default function GamePage({ keycloak }) {
  const { id } = useParams();
  const { t } = React.useContext(LangContext);
  const canvasRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [game, setGame] = React.useState(null);
  const [scans, setScans] = React.useState([]);
  const [mines, setMines] = React.useState([]);
  const [zoom, setZoom] = React.useState(0);
  const [center, setCenter] = React.useState({ x: 0, y: 0 });
  const [selected, setSelected] = React.useState(null);
  const [scanRange, setScanRange] = React.useState(1);

  const apiUrl = window.CONFIG['minesweeper-api-url'];

  React.useEffect(() => {
    fetch(`${apiUrl}/games`, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then((list) => {
        const g = list.find((g) => g.id === id);
        if (g) {
          setGame(g);
          setCenter({ x: Math.floor(g.width / 2), y: Math.floor(g.height / 2) });
        }
      });
  }, [apiUrl, id, keycloak]);

  React.useEffect(() => {
    if (!game) return;
    fetch(`${apiUrl}/scans/${id}`, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then(setScans)
      .catch(() => setScans([]));
    fetch(`${apiUrl}/mines/cleared?gameId=${id}`, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
    })
      .then((r) => r.json())
      .then(setMines)
      .catch(() => setMines([]));
  }, [apiUrl, id, keycloak, game]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cellSize = Math.pow(2, zoom);
    const width = canvas.width;
    const height = canvas.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    const left = center.x - width / (2 * cellSize);
    const top = center.y - height / (2 * cellSize);

    for (const s of scans) {
      const px = (s.x - left) * cellSize;
      const py = (s.y - top) * cellSize;
      ctx.fillStyle = '#00008b';
      ctx.fillRect(px, py, cellSize, cellSize);
    }

    for (const m of mines) {
      const px = (m.x - left) * cellSize;
      const py = (m.y - top) * cellSize;
      ctx.fillStyle = m.status === 'cleared' ? '#008000' : '#ff0000';
      ctx.fillRect(px, py, cellSize, cellSize);
    }

    if (selected && selected.scan) {
      const s = selected.scan;
      const px = (s.x - left + 0.5) * cellSize;
      const py = (s.y - top + 0.5) * cellSize;
      const radius = Math.floor(s.scanRange) * cellSize;
      ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }, [scans, mines, zoom, center, selected]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  const handlePointerDown = (e) => {
    canvasRef.current.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCenter: { ...center },
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const cellSize = Math.pow(2, zoom);
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setCenter({
      x: dragRef.current.startCenter.x - dx / cellSize,
      y: dragRef.current.startCenter.y - dy / cellSize,
    });
  };

  const handlePointerUp = (e) => {
    canvasRef.current.releasePointerCapture(e.pointerId);
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const cellSize = Math.pow(2, zoom);
        const left = center.x - rect.width / (2 * cellSize);
        const top = center.y - rect.height / (2 * cellSize);
        const x = Math.floor(left + (e.clientX - rect.left) / cellSize);
        const y = Math.floor(top + (e.clientY - rect.top) / cellSize);
        const scan = scans.find((s) => s.x === x && s.y === y);
        setSelected({ x, y, scan });
        setScanRange(scan ? scan.scanRange : 1);
      }
      dragRef.current = null;
    }
  };

  const handleScan = () => {
    const range = selected.scan ? selected.scan.scanRange : scanRange;
    fetch(`${apiUrl}/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keycloak.token}`,
      },
      body: JSON.stringify({
        gameId: id,
        x: selected.x,
        y: selected.y,
        scanRange: range,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        setScans((prev) => [
          ...prev.filter((s) => !(s.x === res.x && s.y === res.y)),
          res,
        ]);
        setSelected({ x: res.x, y: res.y, scan: res });
      });
  };

  const handleDemine = () => {
    fetch(`${apiUrl}/mines/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keycloak.token}`,
      },
      body: JSON.stringify({
        gameId: id,
        x: selected.x,
        y: selected.y,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        setMines((prev) => [...prev, res]);
      });
  };

  if (!game) {
    return null;
  }

  return (
    <div className="game-page">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      ></canvas>
      <input
        className="zoom-slider"
        type="range"
        min="-3"
        max="6"
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        orient="vertical"
      />
      {selected && (
        <div className="info-panel">
          <p>{t.x}: {selected.x}</p>
          <p>{t.y}: {selected.y}</p>
          {selected.scan ? (
            <p>{t.scanRange}: {selected.scan.scanRange}</p>
          ) : (
            <label>
              {t.scanRange}: {' '}
              <input
                type="range"
                min="1"
                max="99"
                value={scanRange}
                onChange={(e) => setScanRange(Number(e.target.value))}
              />
            </label>
          )}
          {selected.scan && (
            <p>{t.scanResult}: {selected.scan.mineCount}</p>
          )}
          <button className="main-button" onClick={handleScan}>
            {selected.scan ? t.rescan : t.scan}
          </button>
          {!selected.scan && (
            <button className="main-button" onClick={handleDemine}>
              {t.demine}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

