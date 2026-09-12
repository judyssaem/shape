export type ShapeType = 'c' | 'r' | 't';

export interface BaseShape {
  t: ShapeType;
  co?: string;
  rot?: number;
}

export interface CircleShape extends BaseShape {
  t: 'c';
  cx: number;
  cy: number;
  r: number;
}

export interface RectShape extends BaseShape {
  t: 'r';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TriangleShape extends BaseShape {
  t: 't';
  cx: number;
  cy: number;
  s: number;
}

export type Shape = CircleShape | RectShape | TriangleShape;

export type HelpLevel = 'shadow' | 'full';

export interface PresetItem {
  name: string;
  shapes: Shape[];
}
