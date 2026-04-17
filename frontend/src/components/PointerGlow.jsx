import { useState, useEffect } from "react";

export default function PointerGlow() {
  const [pos, setPos] = useState({ x: -400, y: -400 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const onLeave = () => setVisible(false);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x - 250,
        top: pos.y - 250,
        width: 500,
        height: 500,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 9998,
        opacity: visible ? 1 : 0,
        transition: "left 0.08s linear, top 0.08s linear, opacity 0.3s ease",
      }}
    />
  );
}
