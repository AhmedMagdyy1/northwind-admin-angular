import { Component, ElementRef, OnDestroy, effect, inject, input, viewChild } from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  ChartType,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { ThemeService } from '../core/theme.service';

// Register only what we use so the bundle stays small.
Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
);

export interface ChartColors {
  primary: string;
  tertiary: string;
  text: string;
  grid: string;
  surface: string;
}

/** Builds the chart config from theme colors so charts restyle in dark mode. */
export type ChartFactory = (colors: ChartColors) => ChartConfiguration<ChartType>;

@Component({
  selector: 'app-chart',
  template: `<canvas #canvas [attr.aria-label]="label()" role="img"></canvas>`,
  styles: `
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
    }
  `,
})
export class ChartComponent implements OnDestroy {
  readonly config = input.required<ChartFactory>();
  readonly label = input('Chart');

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly theme = inject(ThemeService);
  private chart?: Chart;

  constructor() {
    effect(() => {
      this.theme.theme(); // re-render when the theme changes
      const factory = this.config();
      const el = this.canvas().nativeElement;
      // Wait a frame so the html.dark class (set in another effect) has applied.
      requestAnimationFrame(() => {
        this.chart?.destroy();
        this.chart = new Chart(el, factory(readColors(el)));
      });
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}

/**
 * Material 3 tokens are often `light-dark(...)` expressions, which canvas can't
 * parse. Resolving them through a probe element gives plain rgb() values.
 */
function readColors(el: HTMLElement): ChartColors {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  el.parentElement?.appendChild(probe);
  const resolve = (token: string, fallback: string) => {
    probe.style.color = fallback;
    probe.style.color = `var(${token}, ${fallback})`;
    return getComputedStyle(probe).color || fallback;
  };
  const colors = {
    primary: resolve('--mat-sys-primary', '#005cbb'),
    tertiary: resolve('--mat-sys-tertiary', '#7d00fa'),
    text: resolve('--mat-sys-on-surface-variant', '#44474e'),
    grid: resolve('--mat-sys-outline-variant', '#c4c6d0'),
    surface: resolve('--mat-sys-surface', '#ffffff'),
  };
  probe.remove();
  return colors;
}

/** Adds transparency to an rgb()/rgba() color string. */
export function withAlpha(color: string, alpha: number): string {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color;
  const [r, g, b] = m[1].split(/[\s,/]+/).filter(Boolean);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
