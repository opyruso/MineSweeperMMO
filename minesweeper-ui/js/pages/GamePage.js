const { useParams } = ReactRouterDOM;
import { LangContext } from '../i18n.js';

export default function GamePage({ keycloak, playerData, refreshPlayerData }) {
  const { id } = useParams();
  const { t } = React.useContext(LangContext);
  const canvasRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const pointers = React.useRef(new Map());
  const pinchRef = React.useRef(null);
  const [game, setGame] = React.useState(null);
  const [scans, setScans] = React.useState([]);
  const [mines, setMines] = React.useState([]);
  const [zoom, setZoom] = React.useState(0);
  const [center, setCenter] = React.useState({ x: 0, y: 0 });
  const [selected, setSelected] = React.useState(null);
  const [scanRange, setScanRange] = React.useState(2);
  const [visibleScans, setVisibleScans] = React.useState(new Set());
  const [effect, setEffect] = React.useState(null);
  const zoomRef = React.useRef(zoom);
  const centerRef = React.useRef(center);

  const apiUrl = window.CONFIG['minesweeper-api-url'];

  React.useEffect(() => {
    if (!effect) return;
    if (!window.soundsOnRef || window.soundsOnRef.current) {
      new Audio(`sounds/${effect.sound}`).play();
    }
    const timer = setTimeout(() => setEffect(null), 5000);
    return () => clearTimeout(timer);
  }, [effect]);

  React.useEffect(() => {
    keycloak
      .updateToken(60)
      .then(() =>
        fetch(`${apiUrl}/games`, {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        })
          .then((r) => r.json())
          .then((list) => {
            const g = list.find((g) => g.id === id);
            if (g) {
              setGame(g);
            }
          })
      )
      .catch(() => {});
  }, [apiUrl, id, keycloak]);

  React.useEffect(() => {
    if (playerData && scanRange > playerData.scanRangeMax) {
      setScanRange(playerData.scanRangeMax);
    }
  }, [playerData, scanRange]);

  React.useEffect(() => {
    if (!game) return;
    const stored = localStorage.getItem(`gameState-${id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed.zoom === 'number') {
          setZoom(parsed.zoom);
          zoomRef.current = parsed.zoom;
        }
        if (parsed.center && typeof parsed.center.x === 'number' && typeof parsed.center.y === 'number') {
          setCenter(parsed.center);
          centerRef.current = parsed.center;
        } else {
          setCenter({ x: Math.floor(game.width / 2), y: Math.floor(game.height / 2) });
        }
        if (typeof parsed.scanRange === 'number') {
          setScanRange(Math.max(parsed.scanRange, 2));
        }
        if (Array.isArray(parsed.visibleScans)) {
          setVisibleScans(new Set(parsed.visibleScans));
        }
      } catch {
        setCenter({ x: Math.floor(game.width / 2), y: Math.floor(game.height / 2) });
      }
    } else {
      setCenter({ x: Math.floor(game.width / 2), y: Math.floor(game.height / 2) });
    }
  }, [game, id]);

  const refreshBoard = React.useCallback(() => {
    keycloak
      .updateToken(60)
      .then(() => {
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
      })
      .catch(() => {});
  }, [apiUrl, id, keycloak]);

  React.useEffect(() => {
    if (!game) return;
    refreshBoard();
  }, [apiUrl, id, keycloak, game, refreshBoard]);

  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  React.useEffect(() => {
    centerRef.current = center;
  }, [center]);

  React.useEffect(() => {
    if (!game) return;
    const data = {
      zoom,
      center,
      scanRange,
      visibleScans: Array.from(visibleScans),
    };
    localStorage.setItem(`gameState-${id}`, JSON.stringify(data));
  }, [id, game, zoom, center, scanRange, visibleScans]);

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !game) return;
    const ctx = canvas.getContext('2d');
    const cellSize = Math.pow(2, zoom);
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const left = center.x - width / (2 * cellSize);
    const top = center.y - height / (2 * cellSize);

    // draw map area
    const mapLeft = (0 - left) * cellSize;
    const mapTop = (0 - top) * cellSize;
    const mapWidth = game.width * cellSize;
    const mapHeight = game.height * cellSize;
    ctx.fillStyle = '#333';
    ctx.fillRect(mapLeft, mapTop, mapWidth, mapHeight);

    const drawScanCircle = (cx, cy, range, fillStyle) => {
      const px = (cx - left + 0.5) * cellSize;
      const py = (cy - top + 0.5) * cellSize;
      const radius = Math.floor(range) * cellSize;
      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = '#ff0000';
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawScanArea = (cx, cy, range, fillStyle) => {
      const r = Math.ceil(range);
      const cells = [];
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.hypot(dx, dy) < range) {
            const x = cx + dx;
            const y = cy + dy;
            const px = (x - left) * cellSize;
            const py = (y - top) * cellSize;
            cells.push({ x, y, px, py });
          }
        }
      }
      ctx.fillStyle = fillStyle;
      for (const c of cells) {
        ctx.fillRect(c.px, c.py, cellSize, cellSize);
      }
      ctx.strokeStyle = '#ff0000';
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      const cellSet = new Set(cells.map((c) => `${c.x},${c.y}`));
      for (const c of cells) {
        if (!cellSet.has(`${c.x - 1},${c.y}`)) {
          ctx.moveTo(c.px, c.py);
          ctx.lineTo(c.px, c.py + cellSize);
        }
        if (!cellSet.has(`${c.x + 1},${c.y}`)) {
          ctx.moveTo(c.px + cellSize, c.py);
          ctx.lineTo(c.px + cellSize, c.py + cellSize);
        }
        if (!cellSet.has(`${c.x},${c.y - 1}`)) {
          ctx.moveTo(c.px, c.py);
          ctx.lineTo(c.px + cellSize, c.py);
        }
        if (!cellSet.has(`${c.x},${c.y + 1}`)) {
          ctx.moveTo(c.px, c.py + cellSize);
          ctx.lineTo(c.px + cellSize, c.py + cellSize);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    for (const s of scans) {
      const px = (s.x - left) * cellSize;
      const py = (s.y - top) * cellSize;
      ctx.fillStyle = '#00008b';
      ctx.fillRect(px, py, cellSize, cellSize);
      if (visibleScans.has(`${s.x},${s.y}`)) {
        const hasMines = (s.mineCount ?? 0) > 0;
        const fillStyle = hasMines
          ? 'rgba(255, 165, 0, 0.2)'
          : 'rgba(0, 0, 255, 0.2)';
        if (zoom >= 4) {
          drawScanArea(s.x, s.y, s.scanRange, fillStyle);
        } else {
          drawScanCircle(s.x, s.y, s.scanRange, fillStyle);
        }
      }
    }

    for (const m of mines) {
      const px = (m.x - left) * cellSize;
      const py = (m.y - top) * cellSize;
      ctx.fillStyle = m.status === 'cleared' ? '#008000' : '#ff0000';
      ctx.fillRect(px, py, cellSize, cellSize);
    }

    if (selected && !selected.mine) {
      if (zoom >= 4) {
        drawScanArea(selected.x, selected.y, scanRange, 'rgba(0, 0, 255, 0.2)');
      } else {
        drawScanCircle(selected.x, selected.y, scanRange, 'rgba(0, 0, 255, 0.2)');
      }
    }

    if (selected) {
      const px = (selected.x - left) * cellSize;
      const py = (selected.y - top) * cellSize;
      if (!selected.scan && !selected.mine) {
        ctx.fillStyle = '#d3d3d3';
        ctx.fillRect(px, py, cellSize, cellSize);
      }
      ctx.strokeStyle = '#ff0000';
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(px, py, cellSize, cellSize);
      ctx.setLineDash([]);
    }
  }, [game, scans, mines, zoom, center, selected, scanRange, visibleScans]);

  React.useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  const handlePointerMove = (e) => {
    if (pinchRef.current) {
      e.preventDefault();
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = Array.from(pointers.current.values());
      if (pts.length === 2) {
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const delta = Math.log2(dist / pinchRef.current.startDist);
        const nextZoom = Math.max(
          -3,
          Math.min(6, Math.round(pinchRef.current.startZoom + delta))
        );
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const cellSize = Math.pow(2, zoomRef.current);
          const left = centerRef.current.x - rect.width / (2 * cellSize);
          const top = centerRef.current.y - rect.height / (2 * cellSize);
          const worldX = left + (midX - rect.left) / cellSize;
          const worldY = top + (midY - rect.top) / cellSize;
          const nextCellSize = Math.pow(2, nextZoom);
          const newLeft = worldX - (midX - rect.left) / nextCellSize;
          const newTop = worldY - (midY - rect.top) / nextCellSize;
          const newCenter = {
            x: newLeft + rect.width / (2 * nextCellSize),
            y: newTop + rect.height / (2 * nextCellSize),
          };
          setCenter(newCenter);
          centerRef.current = newCenter;
        }
        setZoom(nextZoom);
        zoomRef.current = nextZoom;
      }
      return;
    }
    if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;
    e.preventDefault();
    const cellSize = Math.pow(2, zoom);
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setCenter({
      x: dragRef.current.startCenter.x - dx / cellSize,
      y: dragRef.current.startCenter.y - dy / cellSize,
    });
  };

  const endDrag = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      for (const id of pointers.current.keys()) {
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      }
    }
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
    dragRef.current = null;
    pinchRef.current = null;
    pointers.current.clear();
  };

  const handlePointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pinchRef.current) {
      if (pointers.current.size < 2) {
        pinchRef.current = null;
      }
      if (pointers.current.size === 0) {
        endDrag();
      }
      return;
    }
    if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) {
      if (pointers.current.size === 0) endDrag();
      return;
    }
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
      const mine = mines.find((m) => m.x === x && m.y === y);
      if (scan) {
        setVisibleScans((prev) => {
          const key = `${scan.x},${scan.y}`;
          const next = new Set(prev);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }
          return next;
        });
        setScanRange(Math.max(scan.scanRange, 2));
      }
      setSelected({ x, y, scan, mine });
    }
    endDrag();
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      pinchRef.current = {
        startDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        startZoom: zoomRef.current,
      };
      dragRef.current = null;
    } else if (pointers.current.size === 1) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startCenter: { ...centerRef.current },
        pointerId: e.pointerId,
      };
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }
  };

  const handleWheel = React.useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dir = -Math.sign(e.deltaY);
    const currentZoom = zoomRef.current;
    const nextZoom = Math.max(-3, Math.min(6, currentZoom + dir));
    if (nextZoom === currentZoom) return;
    const cellSize = Math.pow(2, currentZoom);
    const left = centerRef.current.x - rect.width / (2 * cellSize);
    const top = centerRef.current.y - rect.height / (2 * cellSize);
    const worldX = left + px / cellSize;
    const worldY = top + py / cellSize;
    const nextCellSize = Math.pow(2, nextZoom);
    const newLeft = worldX - px / nextCellSize;
    const newTop = worldY - py / nextCellSize;
    const newCenter = {
      x: newLeft + rect.width / (2 * nextCellSize),
      y: newTop + rect.height / (2 * nextCellSize),
    };
    setCenter(newCenter);
    centerRef.current = newCenter;
    setZoom(nextZoom);
    zoomRef.current = nextZoom;
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel, game]);

  const getEffectPosition = React.useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return { left: 0, top: 0 };
    const rect = canvas.getBoundingClientRect();
    const cellSize = Math.pow(2, zoomRef.current);
    const left = centerRef.current.x - rect.width / (2 * cellSize);
    const top = centerRef.current.y - rect.height / (2 * cellSize);
    return {
      left: rect.left + (x - left + 0.5) * cellSize,
      top: rect.top + (y - top + 0.5) * cellSize,
    };
  }, []);

  const handleScan = () => {
    const range = scanRange;
    keycloak
      .updateToken(60)
      .then(() =>
        fetch(`${apiUrl}/scans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${keycloak.token}`,
          },
          body: JSON.stringify({
            gameId: id,
            playerId: keycloak.tokenParsed.sub,
            x: selected.x,
            y: selected.y,
            scanRange: range,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            const pos = getEffectPosition(res.x, res.y);
            if (res.exploded) {
              const mine = { id: res.id, x: res.x, y: res.y, status: 'explosed' };
              setScans((prev) => prev.filter((s) => !(s.x === res.x && s.y === res.y)));
              setVisibleScans((prev) => {
                const next = new Set(prev);
                next.delete(`${res.x},${res.y}`);
                return next;
              });
              setMines((prev) => [...prev, mine]);
              setSelected({ x: res.x, y: res.y, scan: null, mine });
              setEffect({ icon: 'icon_explosion.png', sound: 'sound_explosion.mp3', ...pos });
            } else {
              setScans((prev) => [
                ...prev.filter((s) => !(s.x === res.x && s.y === res.y)),
                res,
              ]);
              setVisibleScans((prev) => {
                const next = new Set(prev);
                next.add(`${res.x},${res.y}`);
                return next;
              });
              setSelected((prev) => ({
                x: res.x,
                y: res.y,
                scan: res,
                mine: prev.mine,
              }));
              setScanRange(Math.max(res.scanRange ?? 2, 2));
              if ((res.mineCount ?? 0) > 0) {
                setEffect({ icon: 'icon_alarm.png', sound: 'sound_warning.mp3', ...pos });
              } else {
                setEffect({ icon: 'icon_empty_hole.png', sound: 'sound_nothing.mp3', ...pos });
              }
            }
            requestAnimationFrame(draw);
            refreshPlayerData && refreshPlayerData();
          })
      )
      .catch(() => {});
  };

  const handleDemine = () => {
    keycloak
      .updateToken(60)
      .then(() =>
        fetch(`${apiUrl}/mines/clear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${keycloak.token}`,
          },
          body: JSON.stringify({
            gameId: id,
            playerId: keycloak.tokenParsed.sub,
            x: selected.x,
            y: selected.y,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.status === 'wrong') {
              const scan = {
                id: null,
                playerId: keycloak.tokenParsed.sub,
                x: res.x,
                y: res.y,
                scanDate: new Date().toISOString(),
                scanRange: 0,
                mineCount: 0,
              };
              setScans((prev) => [
                ...prev.filter((s) => !(s.x === res.x && s.y === res.y)),
                scan,
              ]);
              setVisibleScans((prev) => {
                const next = new Set(prev);
                next.add(`${scan.x},${scan.y}`);
                return next;
              });
              setSelected({ x: res.x, y: res.y, scan, mine: null });
              setScanRange(2);
              requestAnimationFrame(draw);
            } else {
              setScans((prev) =>
                prev.filter((s) => !(s.x === res.x && s.y === res.y))
              );
              setVisibleScans((prev) => {
                const next = new Set(prev);
                next.delete(`${res.x},${res.y}`);
                return next;
              });
              setMines((prev) => [...prev, res]);
              setSelected({ x: res.x, y: res.y, scan: null, mine: res });
              const pos = getEffectPosition(res.x, res.y);
              setEffect({
                icon: 'icon_bomb_defused.png',
                sound: 'sound_click_1.mp3',
                ...pos,
              });
              requestAnimationFrame(draw);
            }
            refreshPlayerData && refreshPlayerData();
          })
      )
      .catch(() => {});
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
      ></canvas>
      <button
        type="button"
        className="show-zones-button"
        onClick={() => setVisibleScans(new Set(scans.map((s) => `${s.x},${s.y}`)))}
      >
        <img src="images/icons/actions/icon_eyes_open.png" alt="show" className="icon" />
      </button>
      <button
        type="button"
        className="hide-zones-button"
        onClick={() => setVisibleScans(new Set())}
      >
        <img src="images/icons/actions/icon_eyes_close.png" alt="hide" className="icon" />
      </button>
      <button type="button" className="refresh-button" onClick={refreshBoard}>
        <img src="images/icons/actions/icon_refresh.png" alt="refresh" className="icon" />
      </button>
      {selected && (
        <div className="info-panel">
          <span>({selected.x}, {selected.y})</span>
          {selected.mine ? (
            <span>{t.status}: {selected.mine.status}</span>
          ) : (
            <>
              <span>
                {t.power} ({scanRange}):
              </span>
              <input
                type="range"
                min="2"
                max={playerData?.scanRangeMax ?? 10}
                value={scanRange ?? 2}
                onChange={(e) => setScanRange(Number(e.target.value))}
              />
              <button
                type="button"
                className="main-button"
                onClick={handleScan}
                disabled={playerData?.gold <= 0}
              >
                <img
                  src="images/icons/actions/icon_scan_process.png"
                  alt={selected.scan ? t.rescan : t.scan}
                  className="icon"
                />
              </button>
              {!selected.scan && (
                <button
                  type="button"
                  className="main-button"
                  onClick={handleDemine}
                >
                  <img
                    src="images/icons/actions/icon_defuse_process.png"
                    alt={t.demine}
                    className="icon"
                  />
                </button>
              )}
            </>
          )}
        </div>
      )}
      {effect && (
        <div
          className="ephemeral-icon"
          style={{ top: effect.top, left: effect.left }}
        >
          <img src={`images/icons/actions/${effect.icon}`} alt="effect" />
        </div>
      )}
    </div>
  );
}

