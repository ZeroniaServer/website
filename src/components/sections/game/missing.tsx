import "./missing.css";

export default function Missing({ type }: { type: string }) {
  return <p className="game-missing">{type} component not found</p>;
}
