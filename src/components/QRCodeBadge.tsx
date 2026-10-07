import React from 'react';

interface QRCodeBadgeProps {
  value: string;
  size?: number;
}

export const QRCodeBadge: React.FC<QRCodeBadgeProps> = ({ value, size = 100 }) => {
  // Generate deterministic grid pattern based on string hash for a crisp QR aesthetic
  const hash = value.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
  const gridSize = 17; // 17x17 matrix
  const cells: boolean[][] = [];

  for (let r = 0; r < gridSize; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < gridSize; c++) {
      // Corner detection patterns (3 corners of QR)
      const isTopLeft = r < 5 && c < 5;
      const isTopRight = r < 5 && c >= gridSize - 5;
      const isBottomLeft = r >= gridSize - 5 && c < 5;

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Render finder squares
        const localR = isBottomLeft ? r - (gridSize - 5) : r;
        const localC = isTopRight ? c - (gridSize - 5) : c;
        if (localR === 0 || localR === 4 || localC === 0 || localC === 4) {
          row.push(true);
        } else if (localR === 2 && localC === 2) {
          row.push(true);
        } else {
          row.push(false);
        }
      } else {
        // Data pattern seeded by value
        const bit = ((hash * (r + 1) * (c + 7)) ^ (r * 13 + c * 31)) % 7;
        row.push(bit % 2 === 0);
      }
    }
    cells.push(row);
  }

  const cellSize = size / gridSize;

  return (
    <div 
      className="bg-white p-1.5 rounded-lg border border-slate-300 shadow-xs inline-block"
      style={{ width: size + 12, height: size + 12 }}
      title={`Kode Verifikasi Digital: ${value}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        {cells.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
