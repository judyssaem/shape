import { Shape } from './types';

export const PRESETS: Record<string, Shape[]> = {
  "기차": [
    { t: 'r', x: 58, y: 46, w: 30, h: 18, co: '#8FBF6A' },
    { t: 'r', x: 12, y: 44, w: 42, h: 20, co: '#D9584B' },
    { t: 'r', x: 16, y: 28, w: 20, h: 16, co: '#D9584B' },
    { t: 'r', x: 42, y: 30, w: 8, h: 14, co: '#5A5750' },
    { t: 't', cx: 26, cy: 20, s: 18, co: '#F5B92E' },
    { t: 'c', cx: 20, cy: 70, r: 7, co: '#4A4740' },
    { t: 'c', cx: 44, cy: 70, r: 7, co: '#4A4740' },
    { t: 'c', cx: 66, cy: 69, r: 6, co: '#4A4740' },
    { t: 'c', cx: 82, cy: 69, r: 6, co: '#4A4740' },
    { t: 'c', cx: 46, cy: 20, r: 5, co: '#CFCFC7' }
  ],
  "집": [
    { t: 'r', x: 60, y: 16, w: 8, h: 18, co: '#B0705A' },
    { t: 'r', x: 26, y: 46, w: 48, h: 36, co: '#F2D28B' },
    { t: 't', cx: 50, cy: 30, s: 56, co: '#D9584B' },
    { t: 'r', x: 44, y: 62, w: 14, h: 20, co: '#B0705A' },
    { t: 'c', cx: 34, cy: 56, r: 6, co: '#7EC0E8' },
    { t: 'c', cx: 66, cy: 56, r: 6, co: '#7EC0E8' }
  ],
  "나무": [
    { t: 'r', x: 45, y: 64, w: 10, h: 24, co: '#A9744F' },
    { t: 't', cx: 50, cy: 46, s: 50, co: '#4F8A34' },
    { t: 't', cx: 50, cy: 35.5, s: 38, co: '#6FA83C' },
    { t: 't', cx: 50, cy: 24.5, s: 26, co: '#86BE52' },
    { t: 't', cx: 50, cy: 11, s: 9, co: '#F5B92E' },
    { t: 'c', cx: 38, cy: 61, r: 4, co: '#E4574B' },
    { t: 'c', cx: 62, cy: 61, r: 4, co: '#E4574B' },
    { t: 'c', cx: 50, cy: 44, r: 4, co: '#E4574B' }
  ],
  "자동차": [
    { t: 'r', x: 14, y: 48, w: 64, h: 20, co: '#4E96D6' },
    { t: 'r', x: 30, y: 32, w: 28, h: 16, co: '#7EC0E8' },
    { t: 't', cx: 66, cy: 41, s: 14, co: '#7EC0E8' },
    { t: 'c', cx: 28, cy: 72, r: 8, co: '#4A4740' },
    { t: 'c', cx: 64, cy: 72, r: 8, co: '#4A4740' },
    { t: 'c', cx: 74, cy: 58, r: 4, co: '#F5B92E' }
  ],
  "로봇": [
    { t: 'r', x: 32, y: 42, w: 36, h: 32, co: '#9AA7B0' },
    { t: 'r', x: 38, y: 16, w: 24, h: 22, co: '#C3CDD4' },
    { t: 'r', x: 18, y: 44, w: 12, h: 24, co: '#9AA7B0' },
    { t: 'r', x: 70, y: 44, w: 12, h: 24, co: '#9AA7B0' },
    { t: 'r', x: 36, y: 76, w: 10, h: 14, co: '#6E7A82' },
    { t: 'r', x: 54, y: 76, w: 10, h: 14, co: '#6E7A82' },
    { t: 't', cx: 50, cy: 10, s: 12, co: '#EE7A55' },
    { t: 'c', cx: 45, cy: 26, r: 4, co: '#4E96D6' },
    { t: 'c', cx: 55, cy: 26, r: 4, co: '#4E96D6' },
    { t: 'c', cx: 50, cy: 56, r: 5, co: '#F5B92E' }
  ],
  "고양이": [
    { t: 'c', cx: 50, cy: 66, r: 22, co: '#E8B77A' },
    { t: 'r', x: 70, y: 70, w: 22, h: 7, co: '#E8B77A' },
    { t: 't', cx: 36, cy: 27, s: 16, co: '#D9A468' },
    { t: 't', cx: 64, cy: 27, s: 16, co: '#D9A468' },
    { t: 'c', cx: 50, cy: 38, r: 20, co: '#E8B77A' },
    { t: 'c', cx: 43, cy: 36, r: 3.5, co: '#4A4740' },
    { t: 'c', cx: 57, cy: 36, r: 3.5, co: '#4A4740' },
    { t: 't', cx: 50, cy: 46, s: 7, rot: 180, co: '#E4574B' }
  ],
  "오리": [
    { t: 'r', x: 12, y: 72, w: 76, h: 7, co: '#4E96D6' },
    { t: 'r', x: 24, y: 81, w: 52, h: 5, co: '#7EC0E8' },
    { t: 't', cx: 20, cy: 47, s: 18, rot: -75, co: '#F5B92E' },
    { t: 'c', cx: 42, cy: 55, r: 20, co: '#F5B92E' },
    { t: 't', cx: 40, cy: 56, s: 18, rot: 180, co: '#EE7A55' },
    { t: 'c', cx: 62, cy: 36, r: 13, co: '#F5B92E' },
    { t: 't', cx: 77, cy: 37, s: 13, rot: 90, co: '#EE7A55' },
    { t: 'c', cx: 66, cy: 33, r: 2.5, co: '#4A4740' },
    { t: 'c', cx: 84, cy: 68, r: 3.5, co: '#7EC0E8' }
  ],
  "꽃": [
    { t: 'r', x: 47, y: 52, w: 6, h: 36, co: '#6FA83C' },
    { t: 't', cx: 34, cy: 66, s: 20, rot: -100, co: '#6FA83C' },
    { t: 'c', cx: 50, cy: 26, r: 12, co: '#E8748C' },
    { t: 'c', cx: 31, cy: 38, r: 12, co: '#E8748C' },
    { t: 'c', cx: 69, cy: 38, r: 12, co: '#E8748C' },
    { t: 'c', cx: 50, cy: 44, r: 11, co: '#F5B92E' }
  ],
  "배": [
    { t: 'r', x: 24, y: 58, w: 52, h: 14, co: '#D9584B' },
    { t: 't', cx: 18, cy: 65, s: 14, rot: -90, co: '#B0463B' },
    { t: 't', cx: 82, cy: 65, s: 14, rot: 90, co: '#B0463B' },
    { t: 'c', cx: 36, cy: 65, r: 4, co: '#FFFEFA' },
    { t: 'c', cx: 50, cy: 65, r: 4, co: '#FFFEFA' },
    { t: 'c', cx: 64, cy: 65, r: 4, co: '#FFFEFA' },
    { t: 'r', x: 48.5, y: 14, w: 3, h: 44, co: '#A9744F' },
    { t: 't', cx: 35, cy: 45, s: 26, co: '#F2D28B' },
    { t: 't', cx: 65, cy: 45, s: 26, co: '#7EC0E8' },
    { t: 't', cx: 55.5, cy: 17, s: 9, rot: 90, co: '#F5B92E' }
  ],
  "나비": [
    { t: 't', cx: 31, cy: 38, s: 34, rot: -50, co: '#EE7A55' },
    { t: 't', cx: 69, cy: 38, s: 34, rot: 50, co: '#EE7A55' },
    { t: 't', cx: 35, cy: 62, s: 24, rot: -130, co: '#F5B92E' },
    { t: 't', cx: 65, cy: 62, s: 24, rot: 130, co: '#F5B92E' },
    { t: 'r', x: 48, y: 30, w: 4, h: 42, co: '#5A5750' },
    { t: 'c', cx: 50, cy: 26, r: 4.5, co: '#5A5750' },
    { t: 't', cx: 45, cy: 18, s: 8, rot: -30, co: '#5A5750' },
    { t: 't', cx: 55, cy: 18, s: 8, rot: 30, co: '#5A5750' }
  ],
  "눈사람": [
    { t: 'c', cx: 50, cy: 68, r: 24, co: '#E4F1FE' },
    { t: 'c', cx: 50, cy: 36, r: 17, co: '#E4F1FE' },
    { t: 'r', x: 40, y: 14, w: 20, h: 12, co: '#D9584B' },
    { t: 'r', x: 34, y: 24, w: 32, h: 4, co: '#D9584B' },
    { t: 't', cx: 50, cy: 38, s: 8, rot: 90, co: '#EE7A55' },
    { t: 'c', cx: 44, cy: 32, r: 2.5, co: '#4A4740' },
    { t: 'c', cx: 56, cy: 32, r: 2.5, co: '#4A4740' },
    { t: 'c', cx: 50, cy: 56, r: 3, co: '#4E96D6' },
    { t: 'c', cx: 50, cy: 66, r: 3, co: '#4E96D6' },
    { t: 'c', cx: 50, cy: 76, r: 3, co: '#4E96D6' }
  ],
  "물고기": [
    { t: 'c', cx: 46, cy: 50, r: 26, co: '#4E96D6' },
    { t: 't', cx: 78, cy: 50, s: 28, rot: -90, co: '#EE7A55' },
    { t: 't', cx: 44, cy: 24, s: 16, rot: 0, co: '#F5B92E' },
    { t: 't', cx: 44, cy: 76, s: 16, rot: 180, co: '#F5B92E' },
    { t: 'c', cx: 32, cy: 44, r: 4, co: '#FFFFFF' },
    { t: 'c', cx: 31, cy: 44, r: 2, co: '#4A4740' }
  ],
  "로켓": [
    { t: 'r', x: 40, y: 32, w: 20, h: 42, co: '#E4F1FE' },
    { t: 't', cx: 50, cy: 18, s: 24, rot: 0, co: '#D9584B' },
    { t: 't', cx: 30, cy: 66, s: 18, rot: -45, co: '#4E96D6' },
    { t: 't', cx: 70, cy: 66, s: 18, rot: 45, co: '#4E96D6' },
    { t: 'c', cx: 50, cy: 44, r: 6, co: '#7EC0E8' },
    { t: 't', cx: 50, cy: 84, s: 14, rot: 180, co: '#EE7A55' }
  ]
};

export const COLOR_MAP = {
  c: 'var(--c-circle)',
  r: 'var(--c-rect)',
  t: 'var(--c-tri)',
  shadow: 'var(--shadow)'
};

export const SHAPE_NAMES = {
  c: '동그라미',
  r: '네모',
  t: '세모'
};
