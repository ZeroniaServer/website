import { useEffect, useRef, useState } from "react";
import { gameAsset } from "../../../lib/games";
import { frameStyle } from "../frame";
import arrowUrl from "../../../assets/sprites/arrow_down.png";
import {
  ALL_MUSEUM_MAP_ASSETS,
  MAP_NATIVE_HEIGHT,
  MAP_NATIVE_WIDTH,
  MUSEUM_MAP_FLOORS,
  type MapRoom,
} from "./museum-map-data";
import "./dynamic-map.css";

// smallest box wins, some rooms nest inside others
const roomAt = (rooms: MapRoom[], x: number, y: number): MapRoom | null => {
  let best: MapRoom | null = null;
  let bestArea = Infinity;
  for (const r of rooms) {
    const [x0, y0, x1, y1] = r.bbox;
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    const area = (x1 - x0) * (y1 - y0);
    if (area < bestArea) {
      best = r;
      bestArea = area;
    }
  }
  return best;
};

export default function DynamicMap({ slug }: { slug: string }) {
  const [floorIndex, setFloorIndex] = useState(0);
  const [hovered, setHovered] = useState<MapRoom | null>(null);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const mapRef = useRef<HTMLDivElement>(null);

  const floor = MUSEUM_MAP_FLOORS[floorIndex];
  const asset = (relPath: string) => gameAsset(slug, relPath);

  // preload everything up front so hover is instant
  useEffect(() => {
    let cancelled = false;
    for (const relPath of ALL_MUSEUM_MAP_ASSETS) {
      const url = asset(relPath);
      if (!url) continue;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setLoaded((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
      };
      img.src = url;
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const changeFloor = (delta: number) => {
    setFloorIndex((i) => (i + delta + MUSEUM_MAP_FLOORS.length) % MUSEUM_MAP_FLOORS.length);
    setHovered(null);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * MAP_NATIVE_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * MAP_NATIVE_HEIGHT;
    setHovered(roomAt(floor.rooms, x, y));
  };

  const mapSrc = asset(`museum_map/${hovered ? hovered.file : floor.file}`);

  const previewRoom = hovered ?? floor.rooms[0];
  const previewSrc = asset(`images/${previewRoom.image}`);
  const previewSharp = loaded.has(previewSrc);

  return (
    <div className="dmap">
      <div className="dmap__panel dmap__panel--map">
        <div className="dmap__arrows">
          <button
            className="dmap__arrow"
            aria-label="Previous floor"
            onClick={() => changeFloor(-1)}
          >
            <img src={arrowUrl} alt="" />
          </button>
          <span className="dmap__floor-label">{floor.label}</span>
          <button className="dmap__arrow" aria-label="Next floor" onClick={() => changeFloor(1)}>
            <img src={arrowUrl} alt="" />
          </button>
        </div>
        <div
          className="dmap__frame"
          ref={mapRef}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHovered(null)}
        >
          <img className="dmap__crop" src={mapSrc} alt={hovered?.name ?? floor.label} />
        </div>
      </div>
      <div className="dmap__panel dmap__panel--photo">
        <span className="dmap__floor-label">{previewRoom.name}</span>
        <div className="dmap__frame dmap__frame--photo pixel-frame" style={frameStyle()}>
          <img
            className={`dmap__photo${previewSharp ? "" : " dmap__photo--loading"}`}
            src={previewSrc}
            alt={previewRoom.name}
          />
        </div>
      </div>
    </div>
  );
}
