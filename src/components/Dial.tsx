import { useCallback, useRef } from "react";
import { WEDGES, clusterHalfWidth } from "../game/scoring";
import { angleFromClient, dialPoint, dialSectorPath } from "../game/geometry";

const CX = 200;
const CY = 208;
const R = 168;
const R_INNER = 48;

type Props = {
  targetCenter: number;
  needleAngle: number;
  showWedges: boolean;
  /** Визуально открыта заслонка (дуга видна) */
  shutterOpen: boolean;
  needleInteractive: boolean;
  onNeedleChange?: (deg: number) => void;
};

export function Dial({
  targetCenter,
  needleAngle,
  showWedges,
  shutterOpen,
  needleInteractive,
  onNeedleChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const half = clusterHalfWidth();
  const t = targetCenter;
  const W = WEDGES;
  const bands: { a0: number; a1: number; fill: string; label?: string }[] =
    showWedges
      ? [
          {
            a0: t - half,
            a1: t - W.half4 - W.half3,
            fill: "#f0c94d",
            label: "2",
          },
          {
            a0: t - W.half4 - W.half3,
            a1: t - W.half4,
            fill: "#e88b3a",
            label: "3",
          },
          {
            a0: t - W.half4,
            a1: t + W.half4,
            fill: "#7ec8e3",
            label: "4",
          },
          {
            a0: t + W.half4,
            a1: t + W.half4 + W.half3,
            fill: "#e88b3a",
            label: "3",
          },
          {
            a0: t + W.half4 + W.half3,
            a1: t + half,
            fill: "#f0c94d",
            label: "2",
          },
        ]
      : [];

  const move = useCallback(
    (clientX: number, clientY: number) => {
      const el = svgRef.current;
      if (!el || !onNeedleChange) return;
      onNeedleChange(angleFromClient(CX, CY, clientX, clientY, el));
    },
    [onNeedleChange],
  );

  const tip = dialPoint(CX, CY, R - 4, needleAngle);

  return (
    <svg
      ref={svgRef}
      className="dial"
      viewBox="0 0 400 240"
      role="img"
      aria-label="Шкала Wavelength"
      onPointerDown={(e) => {
        if (!needleInteractive) return;
        (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!needleInteractive || !e.buttons) return;
        move(e.clientX, e.clientY);
      }}
    >
      <defs>
        <pattern
          id="starfield"
          patternUnits="userSpaceOnUse"
          width="12"
          height="12"
        >
          <rect width="12" height="12" fill="#152238" />
          <circle cx="2" cy="3" r="0.6" fill="white" opacity="0.35" />
          <circle cx="9" cy="7" r="0.45" fill="white" opacity="0.28" />
          <circle cx="6" cy="2" r="0.35" fill="white" opacity="0.22" />
        </pattern>
        <clipPath id="dialClip">
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY} L ${CX} ${CY} Z`}
          />
        </clipPath>
      </defs>

      {/* внешняя рамка */}
      <path
        d={`M ${CX - R - 10} ${CY} A ${R + 10} ${R + 10} 0 0 1 ${CX + R + 10} ${CY}`}
        fill="none"
        stroke="#1b2a44"
        strokeWidth="18"
        strokeLinecap="round"
      />

      <g clipPath="url(#dialClip)">
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY} L ${CX} ${CY} Z`}
          fill="#f7f4ee"
        />
        {bands.map((b, i) => (
          <path
            key={i}
            d={dialSectorPath(CX, CY, R - 2, b.a0, b.a1)}
            fill={b.fill}
            opacity={0.95}
          />
        ))}
        {showWedges &&
          bands.map((b, i) => {
            const mid = (b.a0 + b.a1) / 2;
            const p = dialPoint(CX, CY, R * 0.62, mid);
            return (
              <text
                key={`t-${i}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#1a1a1a"
                fontSize="18"
                fontWeight="700"
                style={{ userSelect: "none" }}
              >
                {b.label}
              </text>
            );
          })}
      </g>

      {/* внутренний «пустой» круг */}
      <circle cx={CX} cy={CY} r={R_INNER} fill="#f7f4ee" stroke="#c9c3b8" />

      {/* стрелка */}
      <g pointerEvents="none">
        <line
          x1={CX}
          y1={CY}
          x2={tip.x}
          y2={tip.y}
          stroke="#d62828"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="10" fill="#d62828" />
        <circle cx={CX} cy={CY} r="4" fill="#5c0a0a" opacity="0.35" />
      </g>

      {/* заслонка: закрыта — перекрывает дугу; открыта — уезжает вниз */}
      <g
        className="dial-shutter"
        style={{
          transform: shutterOpen ? "translateY(118px)" : "translateY(0)",
          transition: "transform 420ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <rect
          x={CX - R - 14}
          y={CY - R - 8}
          width={(R + 14) * 2}
          height={R + 36}
          fill="url(#starfield)"
          stroke="#0f172a"
          strokeWidth="2"
          rx="10"
        />
      </g>
    </svg>
  );
}
