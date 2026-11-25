import React from 'react';
import {AbsoluteFill, Img} from 'remotion';

/**
 * The episode board (`npm run still -- <ep> board`): pictures already rendered, laid out in a grid on white.
 * A composition of its own, so the studio needs nothing but Remotion to join them.
 */
export type BoardProps = {images: string[]; columns: number; cellWidth: number; cellHeight: number; padding: number};

export const BOARD_DEFAULTS: BoardProps = {images: [], columns: 1, cellWidth: 480, cellHeight: 270, padding: 6};

/** The size of the whole board: the cells with `padding` between them and around them. */
export const boardSize = ({images, columns, cellWidth, cellHeight, padding}: BoardProps) => {
  const cols = Math.max(1, Math.min(columns, images.length || 1));
  const rows = Math.max(1, Math.ceil(images.length / cols));
  return {width: cols * cellWidth + (cols + 1) * padding, height: rows * cellHeight + (rows + 1) * padding};
};

export const Board: React.FC<BoardProps> = ({images, columns, cellWidth, cellHeight, padding}) => (
  <AbsoluteFill style={{background: 'white'}}>
    {images.map((src, i) => (
      <Img
        key={i}
        src={src}
        style={{
          position: 'absolute',
          left: padding + (i % columns) * (cellWidth + padding),
          top: padding + Math.floor(i / columns) * (cellHeight + padding),
          width: cellWidth,
          height: cellHeight,
        }}
      />
    ))}
  </AbsoluteFill>
);
