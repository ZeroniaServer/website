import {
  useEffect,
  useRef,
  useState,
  type CanvasHTMLAttributes,
  type ImgHTMLAttributes,
} from "react";
import { gameAssetMetadata } from "../lib/games";
import "./mcmeta-img.css";

interface McmetaFrame {
  index: number;
  time?: number;
}

interface McmetaAnimation {
  frametime?: number;
  frames?: (number | McmetaFrame)[];
}

interface Mcmeta {
  animation?: McmetaAnimation;
}

function parseMetadata(raw: string | undefined): McmetaAnimation | null {
  if (!raw) return null;
  try {
    const animation = (JSON.parse(raw) as Mcmeta).animation;
    return animation && typeof animation === "object" ? animation : null;
  } catch {
    return null;
  }
}

export default function McmetaImg({
  src,
  alt = "",
  className,
  tile,
  rotate,
  reverse,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { tile?: "x" | "y"; rotate?: 90 | 180 | 270; reverse?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animation, setAnimation] = useState<McmetaAnimation | null>(null);

  useEffect(() => {
    setAnimation(parseMetadata(typeof src === "string" ? gameAssetMetadata(src) : undefined));
  }, [src]);

  useEffect(() => {
    if (!animation || typeof src !== "string") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    let frame = 0;
    let timeout = 0;
    let stopped = false;

    const frames = animation.frames?.length
      ? animation.frames.map((entry) =>
          typeof entry === "number" ? { index: entry } : entry,
        )
      : undefined;
    const defaultTime = Math.max(1, animation.frametime ?? 1);

    const draw = () => {
      if (stopped || !image.naturalWidth) return;
      const size = image.naturalWidth;
      const width = tile ? Math.max(1, canvas.clientWidth) : size;
      const height = tile ? Math.max(1, canvas.clientHeight) : size;
      const frameCount = frames?.length ?? Math.max(1, Math.floor(image.naturalHeight / size));
      const frameInfo = frames?.[(reverse ? frameCount - 1 - frame : frame) % frameCount];
      const index = frameInfo?.index ?? frame;
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      const tileSize = tile === "x" ? height : tile === "y" ? width : size;
      const columns = tile === "x" ? Math.ceil(width / tileSize) : 1;
      const rows = tile === "y" ? Math.ceil(height / tileSize) : 1;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const x = column * tileSize;
          const y = row * tileSize;
          if (!rotate) {
            context.drawImage(image, 0, index * size, size, size, x, y, tileSize, tileSize);
            continue;
          }
          context.save();
          context.translate(x + tileSize / 2, y + tileSize / 2);
          context.rotate((rotate * Math.PI) / 180);
          context.drawImage(image, 0, index * size, size, size, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
          context.restore();
        }
      }
      const ticks = Math.max(1, frameInfo?.time ?? defaultTime);
      frame = (frame + 1) % frameCount;
      timeout = window.setTimeout(draw, (ticks * 1000) / 20);
    };

    image.onload = draw;
    image.src = src;
    return () => {
      stopped = true;
      window.clearTimeout(timeout);
    };
  }, [animation, src]);

  const combinedClassName = ["mcmeta-img", className].filter(Boolean).join(" ");
  if (!animation) return <img {...props} className={combinedClassName} src={src} alt={alt} />;
  const { loading: _loading, decoding: _decoding, ...canvasProps } = props;
  return (
    <canvas
      {...(canvasProps as CanvasHTMLAttributes<HTMLCanvasElement>)}
      ref={canvasRef}
      className={combinedClassName}
      role="img"
      aria-label={alt}
    />
  );
}
