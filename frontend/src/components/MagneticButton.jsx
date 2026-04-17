import { useRef, useState } from "react";

export default function MagneticButton({
  children,
  className,
  onClick,
  style,
  strength = 0.25,
  ...rest
}) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    setOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...rest}
      style={{
        ...style,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        willChange: "transform",
      }}
    >
      {children}
    </button>
  );
}
