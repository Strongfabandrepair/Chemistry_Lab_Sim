import { VisualEffect } from './chemistryEngine';

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  type: 'atom' | 'molecule' | 'gas' | 'liquid' | 'solid';
  element?: string;
  trail: Array<{ x: number; y: number; z: number }>;
}

export interface Bond {
  particle1: number;
  particle2: number;
  strength: number;
}

export interface VisualizationState {
  particles: Particle[];
  bonds: Bond[];
  effects: ActiveEffect[];
  temperature: number;
  phase: 'solid' | 'liquid' | 'gas' | 'mixed';
}

interface ActiveEffect extends VisualEffect {
  startTime: number;
}

interface AgitationRipple {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export class VisualizationEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private state: VisualizationState;
  private animationId: number | null = null;
  private rotation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private zoom: number = 1.0;
  private agitationRipples: AgitationRipple[] = [];

  constructor() {
    this.state = {
      particles: [],
      bonds: [],
      effects: [],
      temperature: 298.15,
      phase: 'solid'
    };
  }

  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false
    });

    if (!this.ctx) {
      console.error('Canvas 2D not supported');
      return false;
    }

    return true;
  }

  createParticles(
    components: Array<{
      element?: { symbol: string; color: string; atomic_mass: number };
      mass: number;
      moles: number;
    }>,
    volume: number,
    temperature: number
  ): Particle[] {
    const particles: Particle[] = [];
    const particlesPerMole = Math.min(150, Math.max(20, 1500 / components.length));

    const containerSize = Math.cbrt(volume) * 15;

    for (const component of components) {
      if (!component.element) continue;

      const numParticles = Math.floor(component.moles * particlesPerMole);

      for (let i = 0; i < numParticles; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * containerSize * 0.4;

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        const thermalVelocity = Math.sqrt((3 * 8.314 * temperature) / (component.element.atomic_mass / 1000));
        const velocityScale = thermalVelocity / 500;

        particles.push({
          x,
          y,
          z,
          vx: (Math.random() - 0.5) * velocityScale,
          vy: (Math.random() - 0.5) * velocityScale,
          vz: (Math.random() - 0.5) * velocityScale,
          color: this.mapColorToRGB(component.element.color),
          size: Math.cbrt(component.element.atomic_mass) * 0.5,
          type: this.determineParticleType(temperature),
          element: component.element.symbol,
          trail: []
        });
      }
    }

    return particles;
  }

  private mapColorToRGB(colorName: string): string {
    const colorMap: Record<string, string> = {
      'colorless': '#B8C5E8',
      'silvery-white': '#E8E8E8',
      'silvery': '#C0C0D0',
      'white': '#F5F5F5',
      'gray': '#888888',
      'black': '#404040',
      'red': '#FF3333',
      'blue': '#3388FF',
      'green': '#33FF66',
      'yellow': '#FFFF33',
      'yellow-green': '#A0FF40',
      'pale yellow': '#FFFFAA',
      'reddish-brown': '#C05030',
      'bluish-white': '#D8D8FF',
      'reddish': '#FF6666',
      'lustrous gray': '#A0A0A0',
      'lustrous silvery': '#C8C8D8',
      'lustrous white': '#F8F8FF',
      'dark gray': '#505050',
      'steel gray': '#707070',
      'grayish-white': '#D0D0D0',
      'metallic gray': '#909090',
      'silvery-gold': '#FFD700',
      'violet-black': '#6020A0',
      'metallic yellow': '#FFD700',
      'rust-red': '#C04020',
      'gold': '#FFD700',
      'white-gray': '#D8D8D8'
    };

    return colorMap[colorName] || '#AAAAFF';
  }

  private determineParticleType(temperature: number): 'atom' | 'molecule' | 'gas' | 'liquid' | 'solid' {
    if (temperature > 1000) return 'gas';
    if (temperature > 373) return 'liquid';
    return 'solid';
  }

  private project3D(point: Point3D): { x: number; y: number; z: number } {
    if (!this.canvas) return { x: 0, y: 0, z: 0 };

    const cosX = Math.cos(this.rotation.x);
    const sinX = Math.sin(this.rotation.x);
    const cosY = Math.cos(this.rotation.y);
    const sinY = Math.sin(this.rotation.y);
    const cosZ = Math.cos(this.rotation.z);
    const sinZ = Math.sin(this.rotation.z);

    let x = point.x;
    let y = point.y;
    let z = point.z;

    let tempY = y * cosX - z * sinX;
    let tempZ = y * sinX + z * cosX;
    y = tempY;
    z = tempZ;

    let tempX = x * cosY + z * sinY;
    tempZ = -x * sinY + z * cosY;
    x = tempX;
    z = tempZ;

    tempX = x * cosZ - y * sinZ;
    tempY = x * sinZ + y * cosZ;
    x = tempX;
    y = tempY;

    const perspective = 300 / (300 + z * this.zoom);
    const screenX = this.canvas.width / 2 + x * perspective * 3 * this.zoom;
    const screenY = this.canvas.height / 2 + y * perspective * 3 * this.zoom;

    return { x: screenX, y: screenY, z: z };
  }

  updateParticles(dt: number, volume: number, temperature: number) {
    const containerSize = Math.cbrt(volume) * 8;
    const damping = temperature < 300 ? 0.95 : 0.98;

    for (const particle of this.state.particles) {
      particle.trail.push({ x: particle.x, y: particle.y, z: particle.z });
      if (particle.trail.length > 8) {
        particle.trail.shift();
      }

      particle.x += particle.vx * dt * 10;
      particle.y += particle.vy * dt * 10;
      particle.z += particle.vz * dt * 10;

      if (Math.abs(particle.x) > containerSize) {
        particle.vx *= -0.7;
        particle.x = Math.sign(particle.x) * containerSize;
      }
      if (Math.abs(particle.y) > containerSize) {
        particle.vy *= -0.7;
        particle.y = Math.sign(particle.y) * containerSize;
      }
      if (Math.abs(particle.z) > containerSize) {
        particle.vz *= -0.7;
        particle.z = Math.sign(particle.z) * containerSize;
      }

      particle.vx *= damping;
      particle.vy *= damping;
      particle.vz *= damping;

      const thermalVelocity = Math.sqrt(temperature / 300);
      particle.vx += (Math.random() - 0.5) * 0.03 * thermalVelocity;
      particle.vy += (Math.random() - 0.5) * 0.03 * thermalVelocity;
      particle.vz += (Math.random() - 0.5) * 0.03 * thermalVelocity;
    }

    this.detectBonds();
  }

  private detectBonds() {
    this.state.bonds = [];
    const maxBondDistance = 15;

    for (let i = 0; i < this.state.particles.length; i++) {
      for (let j = i + 1; j < this.state.particles.length; j++) {
        const p1 = this.state.particles[i];
        const p2 = this.state.particles[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < maxBondDistance) {
          const strength = 1 - (distance / maxBondDistance);
          this.state.bonds.push({
            particle1: i,
            particle2: j,
            strength
          });
        }
      }
    }
  }

  render(time: number) {
    if (!this.ctx || !this.canvas) return;

    this.ctx.fillStyle = '#050510';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width / 2
    );
    gradient.addColorStop(0, '#0a0a20');
    gradient.addColorStop(1, '#05050a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.rotation.y += 0.003;
    this.rotation.x = Math.sin(time * 0.0002) * 0.2;

    this.renderEffects(this.ctx, time);
    this.renderAgitationRipples(this.ctx);

    this.renderBonds();

    const projectedParticles = this.state.particles.map((particle, index) => ({
      particle,
      index,
      projected: this.project3D(particle)
    }));

    projectedParticles.sort((a, b) => a.projected.z - b.projected.z);

    for (const { particle, projected } of projectedParticles) {
      this.renderParticle(particle, projected);
    }

    this.renderContainer();
  }

  private renderBonds() {
    if (!this.ctx) return;

    for (const bond of this.state.bonds) {
      const p1 = this.state.particles[bond.particle1];
      const p2 = this.state.particles[bond.particle2];

      const proj1 = this.project3D(p1);
      const proj2 = this.project3D(p2);

      const alpha = bond.strength * 0.3;

      this.ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`;
      this.ctx.lineWidth = 1 * bond.strength;
      this.ctx.beginPath();
      this.ctx.moveTo(proj1.x, proj1.y);
      this.ctx.lineTo(proj2.x, proj2.y);
      this.ctx.stroke();
    }
  }

  private renderParticle(particle: Particle, projected: { x: number; y: number; z: number }) {
    if (!this.ctx) return;

    const depth = 1 / (1 + Math.abs(projected.z) * 0.002);
    const radius = particle.size * 4 * depth;

    if (particle.trail.length > 1) {
      this.ctx.strokeStyle = particle.color + '30';
      this.ctx.lineWidth = radius * 0.3;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();

      for (let i = 0; i < particle.trail.length; i++) {
        const trailPoint = this.project3D(particle.trail[i]);
        if (i === 0) {
          this.ctx.moveTo(trailPoint.x, trailPoint.y);
        } else {
          this.ctx.lineTo(trailPoint.x, trailPoint.y);
        }
      }
      this.ctx.stroke();
    }

    const glowGradient = this.ctx.createRadialGradient(
      projected.x, projected.y, 0,
      projected.x, projected.y, radius * 2
    );
    glowGradient.addColorStop(0, particle.color + 'AA');
    glowGradient.addColorStop(0.5, particle.color + '44');
    glowGradient.addColorStop(1, particle.color + '00');

    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(projected.x, projected.y, radius * 2, 0, Math.PI * 2);
    this.ctx.fill();

    const sphereGradient = this.ctx.createRadialGradient(
      projected.x - radius * 0.3,
      projected.y - radius * 0.3,
      radius * 0.1,
      projected.x,
      projected.y,
      radius
    );

    const baseColor = this.hexToRgb(particle.color);
    const lightColor = `rgb(${Math.min(255, baseColor.r + 80)}, ${Math.min(255, baseColor.g + 80)}, ${Math.min(255, baseColor.b + 80)})`;
    const darkColor = `rgb(${baseColor.r * 0.4}, ${baseColor.g * 0.4}, ${baseColor.b * 0.4})`;

    sphereGradient.addColorStop(0, lightColor);
    sphereGradient.addColorStop(0.4, particle.color);
    sphereGradient.addColorStop(1, darkColor);

    this.ctx.fillStyle = sphereGradient;
    this.ctx.beginPath();
    this.ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = particle.color;
    this.ctx.lineWidth = 1.5 * depth;
    this.ctx.globalAlpha = 0.6;
    this.ctx.beginPath();
    this.ctx.arc(projected.x, projected.y, radius * 0.95, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;

    if (radius > 8 && particle.element) {
      this.ctx.fillStyle = '#000000';
      this.ctx.font = `bold ${radius * 0.8}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(particle.element, projected.x, projected.y);
    }
  }

  private renderContainer() {
    if (!this.ctx || !this.canvas) return;

    const size = 80;
    const corners = [
      { x: -size, y: -size, z: -size },
      { x: size, y: -size, z: -size },
      { x: size, y: size, z: -size },
      { x: -size, y: size, z: -size },
      { x: -size, y: -size, z: size },
      { x: size, y: -size, z: size },
      { x: size, y: size, z: size },
      { x: -size, y: size, z: size }
    ];

    const projected = corners.map(c => this.project3D(c));

    this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)';
    this.ctx.lineWidth = 1;

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    for (const [i, j] of edges) {
      this.ctx.beginPath();
      this.ctx.moveTo(projected[i].x, projected[i].y);
      this.ctx.lineTo(projected[j].x, projected[j].y);
      this.ctx.stroke();
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  private renderEffects(ctx: CanvasRenderingContext2D, time: number) {
    const currentTime = Date.now();

    this.state.effects = this.state.effects.filter(effect => {
      const elapsed = currentTime - effect.startTime;
      return elapsed < effect.duration;
    });

    for (const effect of this.state.effects) {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;
      const alpha = (1 - progress) * effect.intensity;

      switch (effect.type) {
        case 'explosion':
          this.renderExplosion(ctx, progress, alpha);
          break;
        case 'heat':
          this.renderHeat(ctx, progress, alpha);
          break;
        case 'light':
          this.renderLight(ctx, alpha, effect.color || 'white');
          break;
        case 'gas_evolution':
          this.renderGas(ctx, progress, alpha);
          break;
        case 'color_change':
          this.renderColorChange(ctx, alpha, effect.color || 'white');
          break;
        case 'precipitate':
        case 'precipitation':
          this.renderPrecipitation(ctx, progress, alpha);
          break;
      }
    }
  }

  private renderExplosion(ctx: CanvasRenderingContext2D, progress: number, alpha: number) {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const radius = progress * 800;

    ctx.save();

    const mainGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.8);
    mainGradient.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, alpha * 2.5)})`);
    mainGradient.addColorStop(0.2, `rgba(255, 220, 100, ${Math.min(1, alpha * 1.8)})`);
    mainGradient.addColorStop(0.5, `rgba(255, 100, 0, ${Math.min(1, alpha * 1.2)})`);
    mainGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + progress * Math.PI * 0.5;
      const rayLength = radius * (0.7 + Math.sin(progress * 10 + i) * 0.3);
      const x = centerX + Math.cos(angle) * rayLength;
      const y = centerY + Math.sin(angle) * rayLength;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, x, y, 80);
      gradient.addColorStop(0, `rgba(255, 255, 200, ${Math.min(1, alpha * 1.6)})`);
      gradient.addColorStop(0.5, `rgba(255, 150, 50, ${Math.min(1, alpha * 1.3)})`);
      gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * (0.3 + Math.random() * 0.7);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = 10 + Math.random() * 20;

      ctx.fillStyle = `rgba(255, 200, 100, ${Math.min(1, alpha * 2)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderHeat(ctx: CanvasRenderingContext2D, progress: number, alpha: number) {
    const gradient = ctx.createLinearGradient(0, ctx.canvas.height, 0, 0);
    gradient.addColorStop(0, `rgba(255, 100, 0, ${Math.min(1, alpha * 1.2)})`);
    gradient.addColorStop(0.5, `rgba(255, 150, 50, ${Math.min(1, alpha * 0.8)})`);
    gradient.addColorStop(1, `rgba(255, 200, 100, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < 12; i++) {
      const x = (i / 12 + progress * 0.15) * ctx.canvas.width;
      const wave = Math.sin(progress * Math.PI * 6 + i) * 40;

      ctx.strokeStyle = `rgba(255, 120, 30, ${Math.min(1, alpha * 1.5)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, ctx.canvas.height);

      for (let y = ctx.canvas.height; y > 0; y -= 8) {
        const wobble = Math.sin(y * 0.08 + progress * 8) * wave;
        ctx.lineTo(x + wobble, y);
      }

      ctx.stroke();
    }

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * ctx.canvas.width;
      const y = ctx.canvas.height - (progress + Math.random() * 0.3) * ctx.canvas.height;
      const size = 15 + Math.random() * 25;

      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      glowGradient.addColorStop(0, `rgba(255, 180, 0, ${Math.min(1, alpha * 1.8)})`);
      glowGradient.addColorStop(0.5, `rgba(255, 100, 0, ${Math.min(1, alpha * 1.0)})`);
      glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderLight(ctx: CanvasRenderingContext2D, alpha: number, color: string) {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const time = Date.now() / 100;
    const pulse = 0.8 + Math.sin(time * 0.5) * 0.2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 600 * pulse);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, alpha * 2.0)})`);
    gradient.addColorStop(0.2, `rgba(255, 255, 240, ${Math.min(1, alpha * 1.6)})`);
    gradient.addColorStop(0.4, `rgba(255, 255, 180, ${Math.min(1, alpha * 1.2)})`);
    gradient.addColorStop(0.7, `rgba(255, 240, 100, ${Math.min(1, alpha * 0.6)})`);
    gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time * 0.2;
      const length = 300 * pulse;
      const x = centerX + Math.cos(angle) * length;
      const y = centerY + Math.sin(angle) * length;

      const rayGradient = ctx.createRadialGradient(centerX, centerY, 0, x, y, 100);
      rayGradient.addColorStop(0, `rgba(255, 255, 200, ${Math.min(1, alpha * 1.8)})`);
      rayGradient.addColorStop(0.5, `rgba(255, 240, 150, ${Math.min(1, alpha * 1.0)})`);
      rayGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

      ctx.fillStyle = rayGradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, length, angle - 0.1, angle + 0.1);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderGas(ctx: CanvasRenderingContext2D, progress: number, alpha: number) {
    for (let i = 0; i < 60; i++) {
      const xOffset = (i * 0.123) % 1;
      const x = (xOffset * 0.7 + 0.15) * ctx.canvas.width;
      const baseY = ctx.canvas.height * (1 - progress * 1.5);
      const wobble = Math.sin(progress * 8 + i * 0.5) * 60;
      const y = baseY + wobble;
      const radius = 20 + Math.random() * 35;

      if (y > 0) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(240, 245, 255, ${Math.min(1, alpha * 1.8)})`);
        gradient.addColorStop(0.3, `rgba(220, 230, 245, ${Math.min(1, alpha * 1.3)})`);
        gradient.addColorStop(0.7, `rgba(200, 215, 235, ${Math.min(1, alpha * 0.8)})`);
        gradient.addColorStop(1, 'rgba(180, 190, 220, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(200, 220, 255, ${Math.min(1, alpha * 1.2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private renderColorChange(ctx: CanvasRenderingContext2D, alpha: number, color: string) {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const time = Date.now() / 100;
    const pulse = 0.9 + Math.sin(time * 0.3) * 0.1;

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      ctx.canvas.width * 0.7 * pulse
    );

    gradient.addColorStop(0, `rgba(100, 220, 255, ${Math.min(1, alpha * 1.6)})`);
    gradient.addColorStop(0.4, `rgba(120, 200, 255, ${Math.min(1, alpha * 1.2)})`);
    gradient.addColorStop(0.7, `rgba(100, 180, 240, ${Math.min(1, alpha * 0.8)})`);
    gradient.addColorStop(1, 'rgba(80, 160, 220, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + time * 0.1;
      const radius = 150 + Math.sin(time + i) * 50;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const swirl = ctx.createRadialGradient(x, y, 0, x, y, 40);
      swirl.addColorStop(0, `rgba(150, 220, 255, ${Math.min(1, alpha * 1.4)})`);
      swirl.addColorStop(0.5, `rgba(100, 200, 255, ${Math.min(1, alpha * 0.8)})`);
      swirl.addColorStop(1, 'rgba(80, 180, 240, 0)');

      ctx.fillStyle = swirl;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderPrecipitation(ctx: CanvasRenderingContext2D, progress: number, alpha: number) {
    for (let i = 0; i < 80; i++) {
      const xOffset = (i * 0.347) % 1;
      const x = (xOffset * 0.8 + 0.1) * ctx.canvas.width;
      const fallProgress = ((progress * 1.5 + (i * 0.05)) % 1);
      const y = fallProgress * ctx.canvas.height + Math.cos(progress * 5 + i) * 40;
      const size = 4 + Math.random() * 8;

      if (y < ctx.canvas.height) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        gradient.addColorStop(0, `rgba(220, 230, 255, ${Math.min(1, alpha * 1.9)})`);
        gradient.addColorStop(0.5, `rgba(200, 210, 240, ${Math.min(1, alpha * 1.3)})`);
        gradient.addColorStop(1, `rgba(180, 190, 220, ${Math.min(1, alpha * 0.5)})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(240, 245, 255, ${Math.min(1, alpha * 1.8)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(180, 200, 240, ${Math.min(1, alpha * 1.5)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private renderAgitationRipples(ctx: CanvasRenderingContext2D) {
    const currentTime = Date.now();

    this.agitationRipples = this.agitationRipples.filter(ripple => {
      const elapsed = currentTime - ripple.startTime;
      return elapsed < ripple.duration;
    });

    for (const ripple of this.agitationRipples) {
      const elapsed = currentTime - ripple.startTime;
      const progress = elapsed / ripple.duration;

      const maxRadius = 100;
      const radius = progress * maxRadius;
      const alpha = (1 - progress) * 0.8;

      for (let i = 0; i < 3; i++) {
        const offset = i * 0.2;
        const waveProgress = Math.max(0, Math.min(1, progress - offset));
        const waveRadius = waveProgress * maxRadius;
        const waveAlpha = alpha * (1 - offset);

        ctx.strokeStyle = `rgba(100, 200, 255, ${waveAlpha})`;
        ctx.lineWidth = 3 - i;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      const glowGradient = ctx.createRadialGradient(
        ripple.x, ripple.y, 0,
        ripple.x, ripple.y, radius
      );
      glowGradient.addColorStop(0, `rgba(150, 220, 255, ${alpha * 0.3})`);
      glowGradient.addColorStop(0.5, `rgba(100, 180, 255, ${alpha * 0.15})`);
      glowGradient.addColorStop(1, 'rgba(80, 150, 255, 0)');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
        const sparkX = ripple.x + Math.cos(angle) * radius * 0.8;
        const sparkY = ripple.y + Math.sin(angle) * radius * 0.8;
        const sparkSize = 3 * (1 - progress);

        ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  addEffect(effect: VisualEffect) {
    this.state.effects.push({
      ...effect,
      startTime: Date.now()
    });
  }

  setState(newState: Partial<VisualizationState>) {
    this.state = { ...this.state, ...newState };
  }

  getState(): VisualizationState {
    return this.state;
  }

  startAnimation(updateCallback?: () => void) {
    console.log('Starting visualization animation with', this.state.particles.length, 'particles');
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.updateParticles(dt, 1.0, this.state.temperature);
      this.render(currentTime);

      if (updateCallback) updateCallback();

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  stopAnimation() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  agitate(screenX: number, screenY: number, intensity: number = 1.0) {
    if (!this.canvas) return;

    this.agitationRipples.push({
      x: screenX,
      y: screenY,
      startTime: Date.now(),
      duration: 1000
    });

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const worldX = (screenX - centerX) / 3;
    const worldY = (screenY - centerY) / 3;

    const agitationRadius = 50 * intensity;
    const agitationForce = 30 * intensity;

    for (const particle of this.state.particles) {
      const projected = this.project3D(particle);

      const dx = projected.x - screenX;
      const dy = projected.y - screenY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < agitationRadius) {
        const forceMagnitude = agitationForce * (1 - distance / agitationRadius);

        const angle = Math.atan2(dy, dx);
        particle.vx += Math.cos(angle) * forceMagnitude * 0.1;
        particle.vy += Math.sin(angle) * forceMagnitude * 0.1;

        particle.vz += (Math.random() - 0.5) * forceMagnitude * 0.15;

        const energyBoost = Math.sqrt(this.state.temperature / 300) * intensity;
        particle.vx += (Math.random() - 0.5) * energyBoost;
        particle.vy += (Math.random() - 0.5) * energyBoost;
        particle.vz += (Math.random() - 0.5) * energyBoost;
      }
    }
  }
}
