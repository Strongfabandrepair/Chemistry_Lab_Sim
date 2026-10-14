import type { Element } from './supabase';
import type { ReactionResult } from './chemistryEngine';

interface Point {
  x: number;
  y: number;
  z: number;
}
interface SceneAtom extends Point {
  symbol: string;
  color: string;
  radius: number;
  group: number;
}
interface SceneBond {
  a: number;
  b: number;
}
export const atomColors: Record<string, string> = {
  H: '#e5eced',
  O: '#eb6c63',
  C: '#71838c',
  N: '#7299e4',
  Na: '#b79ae5',
  Cl: '#83c994',
  S: '#e2c575',
  Cu: '#cc8b66',
  Fe: '#d8946c',
  Mg: '#9fbaa9',
  Al: '#a8b8c8',
};

/** Lightweight projected 3D renderer. Geometry is illustrative, not molecular dynamics. */
export class VisualizationEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private atoms: SceneAtom[] = [];
  private bonds: SceneBond[] = [];
  private width = 800;
  private height = 360;
  private animation: number | null = null;
  private lastTime = 0;
  private time = 0;
  private yaw = -0.2;
  private pitch = 0.15;
  private zoom = 1;
  private paused = false;
  private labels = true;
  private mode: 'ball-stick' | 'space-fill' = 'ball-stick';
  private reducedMotion = false;

  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !!this.ctx;
  }
  resize(width: number, height: number) {
    if (!this.canvas || !this.ctx || width <= 0) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.render();
  }
  setScene(components: Array<{ element: Element; moles: number }>, result: ReactionResult | null) {
    this.atoms = [];
    this.bonds = [];
    const species =
      result?.status === 'reacted'
        ? [...result.products, ...result.remaining].map((p) => ({
            formula: p.formula,
            amount: p.moles,
          }))
        : components.map((c) => ({
            formula: ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'].includes(c.element.symbol)
              ? c.element.symbol + '2'
              : c.element.symbol,
            amount: c.moles,
          }));
    if (!species.length) {
      this.render();
      return;
    }
    // A fixed representative scene prevents unbounded allocation at high masses.
    const centers = [
      [-110, -15, 70],
      [110, 38, 0],
      [16, -82, -80],
      [-216, 65, -60],
      [218, -68, -50],
      [0, 100, 25],
      [-143, -112, -140],
      [145, 114, -140],
      [270, 42, -160],
      [-280, -42, -180],
    ];
    centers.forEach(([x, y, z], group) => {
      const entry = species[group % species.length];
      const symbols = [...entry.formula.matchAll(/([A-Z][a-z]?)(\d*)/g)]
        .flatMap((match) =>
          Array.from({ length: Math.min(6, Number(match[2]) || 1) }, () => match[1]),
        )
        .slice(0, 8);
      let positions: number[][];
      if (entry.formula === 'H2O') {
        // H–O–H = 104.5 degrees, oxygen at the origin.
        symbols.splice(0, symbols.length, 'O', 'H', 'H');
        positions = [
          [0, 0, 0],
          [-30, 23.2, 0],
          [30, 23.2, 0],
        ];
      } else if (entry.formula === 'CO2') {
        symbols.splice(0, symbols.length, 'C', 'O', 'O');
        positions = [
          [0, 0, 0],
          [-43, 0, 0],
          [43, 0, 0],
        ];
      } else if (symbols.length === 2)
        positions = [
          [-20, 0, 0],
          [20, 0, 0],
        ];
      else
        positions = symbols.map((_, i) =>
          i === 0 ? [0, 0, 0] : [Math.cos(i * 2.4) * 37, Math.sin(i * 2.4) * 37, (i % 2) * 20],
        );
      const start = this.atoms.length;
      const tilt = group * 1.7;
      symbols.forEach((symbol, i) => {
        const [px, py, pz] = positions[i];
        this.atoms.push({
          x: x + px * Math.cos(tilt) - py * Math.sin(tilt),
          y: y + px * Math.sin(tilt) + py * Math.cos(tilt),
          z: z + pz,
          symbol,
          color: atomColors[symbol] ?? '#92b4c0',
          radius: symbol === 'H' ? 12 : symbol === 'O' ? 19 : 20,
          group,
        });
        if (i > 0) this.bonds.push({ a: start, b: start + i });
      });
    });
    this.render();
  }
  setOptions(options: { paused?: boolean; labels?: boolean; mode?: 'ball-stick' | 'space-fill' }) {
    if (options.paused !== undefined) this.paused = options.paused;
    if (options.labels !== undefined) this.labels = options.labels;
    if (options.mode) this.mode = options.mode;
    this.render();
  }
  rotate(dx: number, dy: number) {
    this.yaw += dx * 0.006;
    this.pitch = Math.max(-1, Math.min(1, this.pitch + dy * 0.006));
    this.render();
  }
  changeZoom(delta: number) {
    this.zoom = Math.max(0.6, Math.min(1.65, this.zoom + delta));
    this.render();
  }
  resetView() {
    this.yaw = -0.2;
    this.pitch = 0.15;
    this.zoom = 1;
    this.render();
  }
  getAtomCount() {
    return this.atoms.length;
  }
  private project(point: Point, group = 0) {
    const drift = this.reducedMotion ? 0 : Math.sin(this.time * 0.45 + group) * 5;
    const x = point.x * Math.cos(this.yaw) - point.z * Math.sin(this.yaw);
    const z = point.x * Math.sin(this.yaw) + point.z * Math.cos(this.yaw);
    const y = (point.y + drift) * Math.cos(this.pitch) - z * Math.sin(this.pitch);
    const depth = (point.y + drift) * Math.sin(this.pitch) + z * Math.cos(this.pitch);
    const scale = (670 / (670 - depth)) * Math.min(this.width / 750, 1.15) * this.zoom;
    return { x: this.width / 2 + x * scale, y: this.height / 2 + y * scale - 5, z: depth, scale };
  }
  render() {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.width,
      h = this.height;
    ctx.clearRect(0, 0, w, h);
    const background = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.5, w * 0.75);
    background.addColorStop(0, '#152927');
    background.addColorStop(0.6, '#101b1c');
    background.addColorStop(1, '#101719');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    // A perspective workplane gives the scene depth without hiding the molecules.
    ctx.strokeStyle = '#72938b12';
    ctx.lineWidth = 1;
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 17, h * 0.48);
      ctx.lineTo(w / 2 + i * 96, h);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const y = h * 0.48 + Math.pow(i / 7, 2) * h * 0.52;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const projected = this.atoms.map((atom) => ({ atom, ...this.project(atom, atom.group) }));
    if (this.mode === 'ball-stick') {
      this.bonds.forEach((bond) => {
        const a = projected[bond.a],
          b = projected[bond.b];
        const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, '#adbfc18a');
        gradient.addColorStop(0.5, '#6d8c8cb0');
        gradient.addColorStop(1, '#becaccad');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = (7 * (a.scale + b.scale)) / 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    }
    projected
      .sort((a, b) => a.z - b.z)
      .forEach(({ atom, x, y, scale }) => {
        const r = atom.radius * scale * (this.mode === 'space-fill' ? 1.5 : 1);
        if (r <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0.45, Math.min(1, 0.82 + scale * 0.12));
        ctx.shadowColor = '#00000055';
        ctx.shadowBlur = 14 * scale;
        ctx.shadowOffsetY = 8 * scale;
        const gradient = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.03, x, y, r);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.22, atom.color);
        gradient.addColorStop(0.7, atom.color);
        gradient.addColorStop(1, '#293c40');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#ffffff21';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Specular reflection on the upper left of each sphere.
        ctx.fillStyle = '#ffffff30';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.3, y - r * 0.43, r * 0.27, r * 0.12, -0.65, 0, Math.PI * 2);
        ctx.fill();
        if (this.labels && scale > 0.55) {
          ctx.fillStyle = atom.symbol === 'H' ? '#344345' : '#182b2b';
          ctx.font = `600 ${Math.max(9, 11 * scale)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(atom.symbol, x + r * 0.04, y + r * 0.12);
        }
        ctx.restore();
      });
  }
  startAnimation() {
    if (this.animation !== null) return;
    this.lastTime = 0;
    const frame = (now: number) => {
      const dt = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.05) : 0;
      this.lastTime = now;
      if (!document.hidden && !this.paused && !this.reducedMotion) {
        this.time += dt;
        this.yaw += dt * 0.025;
        this.render();
      }
      this.animation = requestAnimationFrame(frame);
    };
    this.animation = requestAnimationFrame(frame);
  }
  stopAnimation() {
    if (this.animation !== null) cancelAnimationFrame(this.animation);
    this.animation = null;
  }
}
