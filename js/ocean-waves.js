/**
 * NGAOS — LIVING COASTAL ECOSYSTEM & REALISTIC OCEAN ENGINE
 * Realistic ocean wave physics + Coastal wildlife animation (Seagulls & Sand Crabs)
 * Features:
 * - Multi-octave Trochoidal / Gerstner wave displacement with crest curling
 * - Breaking surf spray particles with parabolic gravity & splash rings
 * - Swash zone dynamics: Periodic tide sets, rolling breakers & backwash
 * - Translucent coastal water refraction over natural sand with wet sand sky glaze
 * - Flying Coastal Seagulls (Chim hải âu) with multi-jointed wing flapping & gliding physics
 * - Scuttling Ghost Sand Crabs (Cua cát bờ biển 🦀) with realistic leg locomotion, foraging & wave fleeing
 * - Responsive, 60fps hardware-accelerated 2D canvas with DPR scaling
 */

(function () {
  'use strict';

  // Create canvas container
  const canvas = document.createElement('canvas');
  canvas.id = 'realistic-ocean-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: false });
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // --------------------------------------------------------------------------
  // 1. Dynamic Foam Bubble & Wave Spray Particles
  // --------------------------------------------------------------------------
  const MAX_FOAM_PARTICLES = 180;
  const foamParticles = [];

  class FoamBubble {
    constructor() {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.radius = 0;
      this.alpha = 0;
      this.decay = 0;
      this.vx = 0;
      this.vy = 0;
    }

    spawn(x, y, radius, alpha, vx, vy) {
      this.active = true;
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.alpha = alpha;
      this.decay = 0.007 + Math.random() * 0.012;
      this.vx = vx;
      this.vy = vy;
    }

    update() {
      if (!this.active) return;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.95;
      this.vy *= 0.95;
      this.alpha -= this.decay;
      if (this.alpha <= 0.02) {
        this.active = false;
      }
    }

    draw() {
      if (!this.active || this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      if (this.radius > 2.2) {
        ctx.strokeStyle = 'rgba(210, 245, 255, 0.7)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  for (let i = 0; i < MAX_FOAM_PARTICLES; i++) {
    foamParticles.push(new FoamBubble());
  }

  function emitFoam(x, y, count = 2, speed = 0.9) {
    let emitted = 0;
    for (let i = 0; i < foamParticles.length && emitted < count; i++) {
      if (!foamParticles[i].active) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed;
        foamParticles[i].spawn(
          x + (Math.random() - 0.5) * 16,
          y + (Math.random() - 0.5) * 8,
          Math.random() * 3.8 + 1.2,
          Math.random() * 0.75 + 0.35,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel * 0.5
        );
        emitted++;
      }
    }
  }

  // Wave Spray Droplets (Bọt nước & giọt nước bắn tung khi sóng vỗ)
  const MAX_SPRAYS = 70;
  const sprayParticles = [];

  class SprayParticle {
    constructor() {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.size = 0;
      this.alpha = 0;
      this.gravity = 0.14;
    }
    spawn(x, y) {
      this.active = true;
      this.x = x + (Math.random() - 0.5) * 20;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 2.2;
      this.vy = -(Math.random() * 2.8 + 1.2); // shoot upward
      this.size = Math.random() * 2.2 + 0.8;
      this.alpha = Math.random() * 0.6 + 0.4;
    }
    update() {
      if (!this.active) return;
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.alpha -= 0.022;
      if (this.alpha <= 0.05) this.active = false;
    }
    draw() {
      if (!this.active) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < MAX_SPRAYS; i++) sprayParticles.push(new SprayParticle());

  function emitSpray(x, y, count = 3) {
    let emitted = 0;
    for (let i = 0; i < sprayParticles.length && emitted < count; i++) {
      if (!sprayParticles[i].active) {
        sprayParticles[i].spawn(x, y);
        emitted++;
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Coastal Wildlife: Flying Seagulls (Chim hải âu bay lượn chân thực)
  // --------------------------------------------------------------------------
  class Seagull {
    constructor(x, y, scale = 1, speed = 1.6) {
      this.x = x;
      this.y = y;
      this.scale = scale;
      this.speed = speed;
      this.wingPhase = Math.random() * Math.PI * 2;
      this.glideTimer = Math.random() * 80 + 40;
      this.isGliding = false;
      this.bankingAngle = 0;
    }

    update(time) {
      this.x += this.speed * this.scale;
      this.y += Math.sin(time * 0.7 + this.wingPhase) * (0.5 * this.scale);

      this.glideTimer--;
      if (this.glideTimer <= 0) {
        this.isGliding = !this.isGliding;
        this.glideTimer = this.isGliding ? Math.random() * 110 + 70 : Math.random() * 90 + 50;
        this.bankingAngle = (Math.random() - 0.5) * 0.22;
      }

      if (!this.isGliding) {
        this.wingPhase += 0.15;
      }

      // Wrap around screen seamlessly
      if (this.x > width + 100 * this.scale) {
        this.x = -100 * this.scale;
        this.y = height * (0.04 + Math.random() * 0.25);
        this.scale = 0.55 + Math.random() * 0.65;
        this.speed = 1.3 + Math.random() * 0.9;
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.bankingAngle);
      ctx.scale(this.scale, this.scale);

      const wingFlap = this.isGliding ? 0.2 : Math.sin(this.wingPhase);
      const wingY = wingFlap * 14;

      // Body (Streamlined seagull profile)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft gray mantle back
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(-2, -1, 10, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head & yellow beak
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(14, -1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b'; // amber beak
      ctx.beginPath();
      ctx.moveTo(17, -1.8);
      ctx.lineTo(22, -0.8);
      ctx.lineTo(17, 0.2);
      ctx.closePath();
      ctx.fill();

      // Left Wing (upper / background)
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(2, -2);
      ctx.quadraticCurveTo(-6, -18 + wingY, -24, -22 + wingY * 1.4);
      ctx.quadraticCurveTo(-14, -8 + wingY * 0.8, -4, -1);
      ctx.closePath();
      ctx.fill();

      // Left Wingtip (black primary feathers)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-16, -16 + wingY * 1.1);
      ctx.lineTo(-24, -22 + wingY * 1.4);
      ctx.lineTo(-19, -12 + wingY * 0.9);
      ctx.closePath();
      ctx.fill();

      // Right Wing (foreground)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.quadraticCurveTo(-6, 16 - wingY, -26, 20 - wingY * 1.4);
      ctx.quadraticCurveTo(-14, 7 - wingY * 0.8, -4, 1);
      ctx.closePath();
      ctx.fill();

      // Right Wingtip
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-18, 14 - wingY * 1.1);
      ctx.lineTo(-26, 20 - wingY * 1.4);
      ctx.lineTo(-21, 10 - wingY * 0.9);
      ctx.closePath();
      ctx.fill();

      // Tail feathers
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-14, -1);
      ctx.lineTo(-23, 0);
      ctx.lineTo(-14, 1.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  const seagulls = [
    new Seagull(width * 0.08, height * 0.16, 1.25, 1.7),
    new Seagull(width * 0.42, height * 0.28, 1.05, 1.4),
    new Seagull(width * 0.78, height * 0.18, 1.35, 1.9),
    new Seagull(width * 0.22, height * 0.36, 0.85, 1.2)
  ];

  // --------------------------------------------------------------------------
  // 3. Coastal Wildlife: Ghost Sand Crabs (Cua cát dạo bờ biển 🦀)
  // --------------------------------------------------------------------------
  class SandCrab {
    constructor(x, y, scale = 1.0) {
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.scale = scale;
      this.vx = (Math.random() - 0.5) * 1.3;
      this.targetX = x + (Math.random() - 0.5) * 180;
      this.state = 'FORAGING'; // 'SCUTTLING', 'FORAGING', 'FLEEING'
      this.timer = Math.random() * 120 + 60;
      this.stepPhase = 0;
      this.clawPhase = 0;
      this.facing = Math.sign(this.vx) || 1;
      this.fleeTimer = 0;
    }

    update(time, waveReachY) {
      this.timer--;

      // React to wave: if water gets too close, flee upwards or sideways!
      if (this.y < waveReachY + 35) {
        this.state = 'FLEEING';
        this.y += 1.5; // run back onto dry sand
        this.vx = this.facing * 2.5;
        this.fleeTimer = 45;
      } else if (this.fleeTimer > 0) {
        this.fleeTimer--;
      } else if (this.timer <= 0) {
        if (this.state === 'FORAGING') {
          this.state = 'SCUTTLING';
          this.targetX = Math.max(30, Math.min(width - 30, this.x + (Math.random() - 0.5) * 240));
          this.facing = this.targetX > this.x ? 1 : -1;
          this.vx = this.facing * (1.3 + Math.random() * 0.9);
          this.timer = Math.random() * 110 + 40;
        } else {
          this.state = 'FORAGING';
          this.vx = 0;
          this.timer = Math.random() * 150 + 70;
        }
      }

      if (this.state === 'SCUTTLING' || this.state === 'FLEEING') {
        this.x += this.vx;
        this.stepPhase += 0.38;
        this.clawPhase += 0.16;
        if (this.y > this.baseY + 18) this.y -= 0.25;
      } else {
        this.clawPhase += 0.08;
      }

      // Keep within bounds
      if (this.x < 25) { this.x = 25; this.facing = 1; this.vx = Math.abs(this.vx); }
      if (this.x > width - 25) { this.x = width - 25; this.facing = -1; this.vx = -Math.abs(this.vx); }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.scale * this.facing, this.scale);

      // Soft ambient sand shadow beneath crab
      ctx.fillStyle = 'rgba(110, 85, 65, 0.26)';
      ctx.beginPath();
      ctx.ellipse(0, 7, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 8 Walking legs (4 on left, 4 on right)
      const legCount = 4;
      ctx.strokeStyle = '#d4bba0'; // pale coastal sand crab color
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';

      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < legCount; i++) {
          const cycle = Math.sin(this.stepPhase + (i * 0.8) + (side * 1.5)) * 4.5;
          const xBase = side * (4 + i * 2.2);
          const yBase = -1 + i * 1.2;

          const kneeX = xBase + side * (8 + i * 2);
          const kneeY = yBase - (side === 1 ? 4 : 2) + (this.state === 'FORAGING' ? 0 : cycle * 0.5);

          const footX = kneeX + side * 4;
          const footY = 6 + (this.state === 'FORAGING' ? 0 : cycle);

          ctx.beginPath();
          ctx.moveTo(xBase, yBase);
          ctx.lineTo(kneeX, kneeY);
          ctx.lineTo(footX, footY);
          ctx.stroke();
        }
      }

      // Crab Carapace (thân mai cua)
      const bodyGrad = ctx.createRadialGradient(0, -1, 2, 0, 0, 11);
      bodyGrad.addColorStop(0, '#f2e5d5'); // sandy dorsal cream
      bodyGrad.addColorStop(0.7, '#deb896'); // warm tan
      bodyGrad.addColorStop(1, '#c49a72'); // shell margin

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(165, 125, 95, 0.6)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Pincers / Claws (2 càng cua)
      const clawWave = Math.sin(this.clawPhase) * 3;
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = '#e8ccaf';
        ctx.strokeStyle = '#c49a72';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(side * 6, -2);
        ctx.lineTo(side * 11, -7 + clawWave * side);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(side * 13, -8 + clawWave * side, 4.2, 2.8, side * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Stalked Eyes (2 mắt ốc ngó nghiêng)
      for (let side = -1; side <= 1; side += 2) {
        ctx.strokeStyle = '#d4bba0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(side * 2.8, -4);
        ctx.lineTo(side * 3.5, -9);
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(side * 3.5, -9.5, 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(side * 3.5 + 0.4, -10, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Create crabs positioned across the coastal sand
  const crabs = [
    new SandCrab(Math.min(width * 0.08, 110), height * 0.86, 1.3),
    new SandCrab(Math.max(width * 0.90, width - 130), height * 0.88, 1.2),
    new SandCrab(width * 0.48, height * 0.93, 1.1),
    new SandCrab(width * 0.25, height * 0.90, 0.85)
  ];

  // --------------------------------------------------------------------------
  // 4. Gerstner Wave Math & Interactive Mouse Ripples
  // --------------------------------------------------------------------------
  let mouseRipple = { x: -999, y: -999, targetX: -999, targetY: -999, intensity: 0 };
  window.addEventListener('mousemove', (e) => {
    mouseRipple.targetX = e.clientX;
    mouseRipple.targetY = e.clientY;
    mouseRipple.intensity = Math.min(1, mouseRipple.intensity + 0.08);
  }, { passive: true });

  function getGerstnerHeight(x, t, amp, wavelength, speed, steepness = 0.6) {
    const k = (2 * Math.PI) / wavelength;
    const phase = k * x - speed * t;
    const cosVal = Math.cos(phase);
    const sinVal = Math.sin(phase);
    return amp * (cosVal + steepness * sinVal * sinVal * Math.sign(cosVal));
  }

  // --------------------------------------------------------------------------
  // 5. Main Shore & Ocean Renderer Loop
  // --------------------------------------------------------------------------
  let wetSandMaxY = 0;

  function renderOcean(timestamp) {
    const time = timestamp * 0.001;

    // 1. SKY & DISTANT HORIZON
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.48);
    skyGrad.addColorStop(0, '#eaf4fc');    // coastal zenith blue
    skyGrad.addColorStop(0.35, '#f0f7fd'); // soft ambient sea mist
    skyGrad.addColorStop(0.75, '#e4effa'); // marine boundary haze
    skyGrad.addColorStop(1, '#cfe3f5');    // horizon waterline
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.5);

    // Subtle sun glare on horizon
    const sunGrad = ctx.createRadialGradient(width * 0.65, height * 0.12, 10, width * 0.65, height * 0.12, width * 0.45);
    sunGrad.addColorStop(0, 'rgba(255, 252, 235, 0.45)');
    sunGrad.addColorStop(0.3, 'rgba(255, 245, 210, 0.18)');
    sunGrad.addColorStop(1, 'rgba(255, 245, 210, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height * 0.5);

    // Render flying seagulls in the sky
    seagulls.forEach(gull => {
      gull.update(time);
      gull.draw();
    });

    // 2. SHORELINE SAND GEOMETRY
    const shoreBaseY = height * 0.46;
    const sandGrad = ctx.createLinearGradient(0, shoreBaseY, 0, height);
    sandGrad.addColorStop(0, '#dfcfba');   // dry coastal sand
    sandGrad.addColorStop(0.2, '#ebdcc9');  // warm fine dune sand
    sandGrad.addColorStop(0.6, '#f3e8dc');  // gentle beach sand
    sandGrad.addColorStop(1, '#f9f3ec');    // foreshore light sand
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, shoreBaseY, width, height - shoreBaseY);

    // 3. TIDE DYNAMICS & SWASH CYCLE
    const tideCycleDuration = 6.8;
    const tidePhase = (time % tideCycleDuration) / tideCycleDuration;

    let surgeProgress = 0;
    if (tidePhase < 0.38) {
      const p = tidePhase / 0.38;
      surgeProgress = Math.sin(p * Math.PI * 0.5);
    } else {
      const p = (tidePhase - 0.38) / 0.62;
      surgeProgress = Math.cos(p * Math.PI * 0.5);
    }

    const setModulation = 0.85 + Math.sin(time * 0.22) * 0.15;
    const surgeReachY = shoreBaseY + (height * 0.42) * surgeProgress * setModulation;

    if (surgeProgress > 0.85) {
      wetSandMaxY = Math.max(wetSandMaxY, surgeReachY);
    } else {
      wetSandMaxY = Math.max(shoreBaseY + 30, wetSandMaxY - 0.25);
    }

    // 4. WET SAND REFLECTION
    if (wetSandMaxY > shoreBaseY) {
      ctx.save();
      const wetGrad = ctx.createLinearGradient(0, shoreBaseY, 0, wetSandMaxY);
      wetGrad.addColorStop(0, 'rgba(175, 148, 122, 0.55)');
      wetGrad.addColorStop(0.6, 'rgba(195, 170, 142, 0.45)');
      wetGrad.addColorStop(0.9, 'rgba(215, 195, 170, 0.35)');
      wetGrad.addColorStop(1, 'rgba(235, 215, 195, 0.0)');
      ctx.fillStyle = wetGrad;
      ctx.beginPath();
      ctx.rect(0, shoreBaseY, width, wetSandMaxY - shoreBaseY);
      ctx.fill();

      // Sky glaze reflection
      const skyGlaze = ctx.createLinearGradient(0, shoreBaseY, 0, wetSandMaxY);
      skyGlaze.addColorStop(0, 'rgba(190, 220, 245, 0.25)');
      skyGlaze.addColorStop(0.7, 'rgba(210, 235, 255, 0.15)');
      skyGlaze.addColorStop(1, 'rgba(210, 235, 255, 0)');
      ctx.fillStyle = skyGlaze;
      ctx.fillRect(0, shoreBaseY, width, wetSandMaxY - shoreBaseY);
      ctx.restore();
    }

    // 5. DISTANT DEEP OCEAN WATER (Gerstner waves)
    ctx.save();
    const deepOceanGrad = ctx.createLinearGradient(0, 0, 0, shoreBaseY + 60);
    deepOceanGrad.addColorStop(0, '#023859');   // deep cobalt abyss
    deepOceanGrad.addColorStop(0.25, '#03588c'); // marine azure
    deepOceanGrad.addColorStop(0.65, '#0284c7'); // turquoise swell
    deepOceanGrad.addColorStop(1, '#0ea5e9');    // aqua shallow

    ctx.fillStyle = deepOceanGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, shoreBaseY);

    const stepX = 14;
    for (let x = 0; x <= width; x += stepX) {
      const g1 = getGerstnerHeight(x, time, 6.0, 180, 1.2, 0.7);
      const g2 = getGerstnerHeight(x, time, 3.5, 95, 1.8, 0.5);
      const g3 = getGerstnerHeight(x, time, 1.5, 45, 2.6, 0.3);
      ctx.lineTo(x, shoreBaseY + g1 + g2 + g3);
    }
    ctx.lineTo(width, 0);
    ctx.closePath();
    ctx.fill();

    // Specular sunlight glints on wave crests
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let x = 30; x < width; x += 48) {
      const gSpark = getGerstnerHeight(x, time, 5.0, 120, 1.4);
      if (gSpark < -1.8) {
        const glintY = shoreBaseY * 0.7 + gSpark * 4;
        ctx.beginPath();
        ctx.ellipse(x, glintY, 8 + Math.sin(x + time * 3) * 4, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 6. MAIN BREAKING SURF WAVE LAYER
    ctx.save();
    const midWaveGrad = ctx.createLinearGradient(0, shoreBaseY, 0, surgeReachY);
    midWaveGrad.addColorStop(0, 'rgba(2, 132, 199, 0.85)');
    midWaveGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.65)');
    midWaveGrad.addColorStop(0.85, 'rgba(45, 212, 191, 0.52)');
    midWaveGrad.addColorStop(1, 'rgba(94, 234, 212, 0.28)');

    ctx.fillStyle = midWaveGrad;
    ctx.beginPath();
    ctx.moveTo(0, shoreBaseY);

    const swashPoints = [];
    for (let x = 0; x <= width; x += 12) {
      const gShoal1 = getGerstnerHeight(x, time, 14, 240, 1.1, 0.8);
      const gShoal2 = getGerstnerHeight(x, time, 7, 110, 1.9, 0.6);
      const gShoal3 = Math.sin(x * 0.045 + time * 2.8) * 3.5;
      const mouseDist = Math.abs(x - mouseRipple.x);
      const rippleOffset = mouseDist < 120 ? Math.sin(mouseDist * 0.1 - time * 6) * mouseRipple.intensity * 8 : 0;

      const waveY = surgeReachY + gShoal1 + gShoal2 + gShoal3 + rippleOffset;
      swashPoints.push({ x, y: waveY });
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(width, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 7. BREAKING WAVE CREST & CRASHING FOAM
    ctx.save();
    ctx.lineWidth = 4.8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    for (let i = 0; i < swashPoints.length; i++) {
      const pt = swashPoints[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);

      // Emit sea foam & crashing wave spray particles
      if (i % 5 === 0 && Math.random() < 0.32) {
        emitFoam(pt.x, pt.y, 2, 0.8);
      }
      if (i % 14 === 0 && surgeProgress > 0.6 && Math.random() < 0.22) {
        emitSpray(pt.x, pt.y, 2);
      }
    }
    ctx.stroke();

    // Secondary foam lace trail
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
    ctx.beginPath();
    for (let i = 0; i < swashPoints.length; i++) {
      const pt = swashPoints[i];
      const trailY = pt.y - 7 - Math.sin(pt.x * 0.08 + time * 4) * 4;
      if (i === 0) ctx.moveTo(pt.x, trailY);
      else ctx.lineTo(pt.x, trailY);
    }
    ctx.stroke();

    // Organic foam lace clusters
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    for (let i = 4; i < swashPoints.length - 4; i += 7) {
      const pt = swashPoints[i];
      const patchY = pt.y - 4 - Math.cos(pt.x * 0.05 + time) * 3;
      ctx.beginPath();
      ctx.ellipse(pt.x, patchY, 10 + Math.sin(pt.x) * 4, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 8. UPDATE & DRAW FOAM & SPRAY PARTICLES
    for (let i = 0; i < foamParticles.length; i++) {
      foamParticles[i].update();
      foamParticles[i].draw();
    }
    for (let i = 0; i < sprayParticles.length; i++) {
      sprayParticles[i].update();
      sprayParticles[i].draw();
    }

    // 9. ANIMATE & RENDER SAND CRABS ON THE BEACH
    crabs.forEach(crab => {
      crab.update(time, surgeReachY);
      crab.draw();
    });

    // Decay mouse ripple
    mouseRipple.x += (mouseRipple.targetX - mouseRipple.x) * 0.15;
    mouseRipple.y += (mouseRipple.targetY - mouseRipple.y) * 0.15;
    mouseRipple.intensity *= 0.96;

    requestAnimationFrame(renderOcean);
  }

  // Start animated ocean ecosystem
  requestAnimationFrame(renderOcean);
})();
