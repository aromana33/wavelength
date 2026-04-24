import { useCallback, useId, useMemo, useRef } from "react";
import { WEDGES, clusterHalfWidth } from "../game/scoring";
import { angleFromClient, dialPoint, dialSectorPath } from "../game/geometry";

const CX = 200;
const CY = 214;
const R = 158;
const R_INNER = 52;
const R_OUTER_RIM = R + 11;

type Props = {
  targetCenter: number;
  needleAngle: number;
  showWedges: boolean;
  shutterOpen: boolean;
  needleInteractive: boolean;
  onNeedleChange?: (deg: number) => void;
};

/** Внешняя «волнистая» кромка как на настольном поле */
function scallopedArcPath(
  cx: number,
  cy: number,
  baseR: number,
  bumps: number,
  depth: number,
): string {
  const n = bumps * 2;
  const parts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const deg = t * 180;
    const outward = i % 2 === 0 ? depth : 0;
    const rr = baseR + outward;
    const p = dialPoint(cx, cy, rr, deg);
    parts.push(i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`);
  }
  return parts.join(" ");
}

export function Dial({
  targetCenter,
  needleAngle,
  showWedges,
  shutterOpen,
  needleInteractive,
  onNeedleChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const uid = useId().replace(/:/g, "");
  const clipId = `dialClip-${uid}`;
  const patternId = `starfield-${uid}`;
  const gradId = `coverGrad-${uid}`;

  const half = clusterHalfWidth();
  const t = targetCenter;
  const bands = useMemo(() => {
    if (!showWedges) return [];
    const Wl = WEDGES;
    return [
      {
        a0: t - half,
        a1: t - Wl.half4 - Wl.half3,
        fill: "#f2d65a",
        label: "2",
      },
      {
        a0: t - Wl.half4 - Wl.half3,
        a1: t - Wl.half4,
        fill: "#e7893a",
        label: "3",
      },
      {
        a0: t - Wl.half4,
        a1: t + Wl.half4,
        fill: "#9fd4e5",
        label: "4",
      },
      {
        a0: t + Wl.half4,
        a1: t + Wl.half4 + Wl.half3,
        fill: "#e7893a",
        label: "3",
      },
      {
        a0: t + Wl.half4 + Wl.half3,
        a1: t + half,
        fill: "#f2d65a",
        label: "2",
      },
    ] as const;
  }, [showWedges, t, half]);

  const move = useCallback(
    (clientX: number, clientY: number) => {
      const el = svgRef.current;
      if (!el || !onNeedleChange) return;
      onNeedleChange(angleFromClient(CX, CY, clientX, clientY, el));
    },
    [onNeedleChange],
  );

  const tip = dialPoint(CX, CY, R - 6, needleAngle);
  const scallop = scallopedArcPath(CX, CY, R_OUTER_RIM, 26, 3.2);

  return (
    <svg
      ref={svgRef}
      className="dial"
      viewBox="0 0 400 268"
      role="img"
      aria-label="Поле Wavelength"
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
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="55%" stopColor="#132a45" />
          <stop offset="100%" stopColor="#0d1b2d" />
        </linearGradient>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width="10"
          height="10"
        >
          <rect width="10" height="10" fill="#142238" />
          <circle cx="1.5" cy="2" r="0.55" fill="#fff" opacity="0.32" />
          <circle cx="7" cy="6" r="0.4" fill="#fff" opacity="0.22" />
          <circle cx="5" cy="1.2" r="0.3" fill="#fff" opacity="0.18" />
        </pattern>
        <clipPath id={clipId}>
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY} L ${CX} ${CY} Z`}
          />
        </clipPath>
      </defs>

      {/* ложемент коробки */}
      <rect
        x="28"
        y={CY - 8}
        width="344"
        height="58"
        rx="14"
        fill="#2f5496"
        opacity="0.92"
      />
      <rect
        x="36"
        y={CY + 2}
        width="328"
        height="38"
        rx="10"
        fill="#1c3d78"
        opacity="0.55"
      />

      {/* синяя «кювета» под диском */}
      <ellipse cx={CX} cy={CY + 6} rx={R + 24} ry={36} fill="#3b6fb8" />
      <ellipse cx={CX} cy={CY + 4} rx={R + 18} ry={30} fill="#2d5aa3" />

      {/* внешняя волнистая кромка (белый пластик) */}
      <path
        d={`${scallop} L ${CX + R} ${CY} L ${CX} ${CY} Z`}
        fill="#f3f1ea"
        stroke="#c9c4b8"
        strokeWidth="1.2"
      />
      <path
        d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
        fill="none"
        stroke="#dfe6d8"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <g clipPath={`url(#${clipId})`}>
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY} L ${CX} ${CY} Z`}
          fill="#f7f5ef"
        />
        {bands.map((b, i) => (
          <path
            key={i}
            d={dialSectorPath(CX, CY, R - 3, b.a0, b.a1)}
            fill={b.fill}
            stroke="#b8a88a"
            strokeWidth="0.6"
            opacity={0.98}
          />
        ))}
        {showWedges &&
          bands.map((b, i) => {
            const mid = (b.a0 + b.a1) / 2;
            const p = dialPoint(CX, CY, R * 0.58, mid);
            return (
              <text
                key={`t-${i}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#1a1a1a"
                fontSize="17"
                fontWeight="800"
                style={{ userSelect: "none" }}
              >
                {b.label}
              </text>
            );
          })}
      </g>

      {/* заслонка: под стрелкой; закрыто — голубое «ночное небо» скрывает сектор */}
      <g
        className="dial-shutter"
        style={{
          transform: shutterOpen ? "translate(0, 128px)" : "translate(0, 0)",
          transition: "transform 480ms cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        <path
          d={`M ${CX - R - 18} ${CY - 4} 
             A ${R + 22} ${R + 22} 0 0 1 ${CX + R + 18} ${CY - 4}
             L ${CX + R + 26} ${CY + R * 0.55}
             L ${CX - R - 26} ${CY + R * 0.55} Z`}
          fill={`url(#${patternId})`}
          stroke="#0a1628"
          strokeWidth="1.5"
        />
        <path
          d={`M ${CX - R - 18} ${CY - 4} 
             A ${R + 22} ${R + 22} 0 0 1 ${CX + R + 18} ${CY - 4}
             L ${CX + R + 26} ${CY + R * 0.55}
             L ${CX - R - 26} ${CY + R * 0.55} Z`}
          fill={`url(#${gradId})`}
          opacity="0.42"
        />
        <rect
          x={CX + R - 8}
          y={CY - R * 0.35}
          width="36"
          height="14"
          rx="5"
          fill="#7ec8e3"
          stroke="#4a90a8"
          strokeWidth="1"
          transform={`rotate(-8 ${CX + R} ${CY - R * 0.28})`}
        />
      </g>

      {/* центральный хаб и стрелка — всегда поверх заслонки */}
      <circle cx={CX} cy={CY} r={R_INNER} fill="#f7f5ef" stroke="#c9c3b8" />
      <g pointerEvents="none">
        <line
          x1={CX}
          y1={CY}
          x2={tip.x}
          y2={tip.y}
          stroke="#d92323"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="18" fill="#c41e1e" />
        <circle cx={CX} cy={CY} r="11" fill="#e02828" />
        <circle cx={CX} cy={CY} r="5" fill="#3a0606" opacity="0.35" />
      </g>
    </svg>
  );
}
