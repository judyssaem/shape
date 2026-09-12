import React from 'react';
import { HelpLevel, Shape } from '../types';
import { COLOR_MAP } from '../presets';

interface ShapeCanvasProps {
  shapes: Shape[];
  title: string;
  level: HelpLevel;
  isLoading: boolean;
  loadingMessage: string;
  highlightedType?: string | null;
  onSelectShape?: (shape: Shape, index: number) => void;
  selectedShapeIndex?: number | null;
}

export const ShapeCanvas: React.FC<ShapeCanvasProps> = ({
  shapes,
  title,
  level,
  isLoading,
  loadingMessage,
  highlightedType,
  onSelectShape,
  selectedShapeIndex
}) => {
  const getFill = (s: Shape) => {
    if (level === 'shadow') {
      return 'var(--shadow)';
    }
    // 완성 그림은 교육용 모양 색(동그라미 노랑 · 네모 파랑 · 세모 주황)을 기본으로 보여 줍니다
    return COLOR_MAP[s.t] || '#6FA83C';
  };

  const getStroke = (s: Shape, idx: number) => {
    if (selectedShapeIndex === idx) {
      return '#3C3A32';
    }
    if (level === 'shadow') {
      return '#C7BFAB';
    }
    if (s.t === 'c') return '#D99B14';
    if (s.t === 'r') return '#2D75B5';
    return '#D35B35';
  };

  const getOpacity = (s: Shape) => {
    if (highlightedType && s.t !== highlightedType) {
      return 0.25;
    }
    return 1;
  };

  return (
    <div
      id="canvas-card"
      className="canvas-card relative bg-[#FFFFFF] border-3 border-[#E4DCC4] rounded-[26px] p-3.5 shadow-[0_4px_0_#E4DCC4] transition-all"
    >
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#FFFEFA] border border-[#F2EDE0]">
        <svg
          id="board"
          viewBox="0 0 100 100"
          className="w-full h-full block touch-manipulation select-none"
          role="img"
          aria-label={title ? `${title} 모양 그림` : '도형 그림 칠판'}
        >
          {/* Subtle grid dots background like school drawing paper */}
          <defs>
            <pattern id="dot-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="0.6" fill="#EDE7D6" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#dot-grid)" />

          {shapes.length === 0 ? (
            <text
              x="50"
              y="52"
              textAnchor="middle"
              fontSize="6"
              fill="#C8C2AE"
              className="font-jua"
            >
              만들고 싶은 것을 골라 보세요 🌱
            </text>
          ) : (
            shapes.map((s, idx) => {
              const fill = getFill(s);
              const stroke = getStroke(s, idx);
              const strokeWidth = selectedShapeIndex === idx ? 1.2 : 0.6;
              const opacity = getOpacity(s);

              if (s.t === 'c') {
                return (
                  <circle
                    key={`shape-${idx}`}
                    cx={s.cx}
                    cy={s.cy}
                    r={s.r}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    onClick={() => onSelectShape?.(s, idx)}
                    className="cursor-pointer transition-all duration-200 hover:brightness-95"
                  />
                );
              }

              if (s.t === 'r') {
                const rot = s.rot
                  ? `rotate(${s.rot} ${s.x + s.w / 2} ${s.y + s.h / 2})`
                  : undefined;
                return (
                  <rect
                    key={`shape-${idx}`}
                    x={s.x}
                    y={s.y}
                    width={s.w}
                    height={s.h}
                    rx={1}
                    fill={fill}
                    transform={rot}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    onClick={() => onSelectShape?.(s, idx)}
                    className="cursor-pointer transition-all duration-200 hover:brightness-95"
                  />
                );
              }

              // Triangle
              const h = s.s * 0.87;
              const pts = `${s.cx},${s.cy - h / 2} ${s.cx + s.s / 2},${s.cy + h / 2} ${
                s.cx - s.s / 2
              },${s.cy + h / 2}`;
              const rot = s.rot ? `rotate(${s.rot} ${s.cx} ${s.cy})` : undefined;

              return (
                <polygon
                  key={`shape-${idx}`}
                  points={pts}
                  fill={fill}
                  transform={rot}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  onClick={() => onSelectShape?.(s, idx)}
                  className="cursor-pointer transition-all duration-200 hover:brightness-95"
                />
              );
            })
          )}
        </svg>

        {/* Loading / Notice Overlay */}
        {isLoading && (
          <div
            id="overlay"
            className="absolute inset-0 rounded-2xl bg-[rgba(255,253,245,0.94)] flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in"
          >
            <div className="w-12 h-12 mb-3 border-5 border-[#E4DCC4] border-t-[#6FA83C] rounded-full animate-spin-custom"></div>
            <span
              id="overlayText"
              className="font-jua text-xl text-[#456F22] leading-relaxed max-w-xs"
            >
              {loadingMessage || '모양을 찾고 있어요…'}
            </span>
          </div>
        )}
      </div>

      {/* Caption */}
      <div
        id="caption"
        className="caption flex items-center justify-center gap-2 font-jua text-xl sm:text-2xl text-[#456F22] min-h-[38px] mt-2.5 text-center"
      >
        {shapes.length > 0 && (
          <>
            <span>{title}</span>
            <span className="text-[#B08968] text-base">·</span>
            <span className="text-[#3C3A32] text-lg sm:text-xl font-normal">
              {level === 'shadow' ? '그림자를 보고 놓아 보세요 🔍' : '완성 그림 🎨'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
