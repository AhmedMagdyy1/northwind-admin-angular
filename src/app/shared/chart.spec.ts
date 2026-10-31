import { withAlpha } from './chart';

describe('withAlpha', () => {
  it('adds alpha to rgb() colors', () => {
    expect(withAlpha('rgb(0, 92, 187)', 0.2)).toBe('rgba(0, 92, 187, 0.2)');
  });

  it('replaces alpha on rgba() colors', () => {
    expect(withAlpha('rgba(10, 20, 30, 1)', 0.5)).toBe('rgba(10, 20, 30, 0.5)');
  });

  it('leaves other formats untouched', () => {
    expect(withAlpha('#336699', 0.5)).toBe('#336699');
  });
});
