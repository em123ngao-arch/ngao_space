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
  // OCEAN THEME STATE & PERFORMANCE CONTROLLER
  // --------------------------------------------------------------------------
  let currentTheme = localStorage.getItem('ngaos_ocean_theme') || 'day';
  let isEngineActive = true;
  let animFrameId = null;

  // Tạm dừng vẽ canvas khi người dùng ẩn tab/thu nhỏ trình duyệt (tiết kiệm 100% CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isEngineActive = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    } else {
      if (!isEngineActive) {
        isEngineActive = true;
        animFrameId = requestAnimationFrame(renderOcean);
      }
    }
  });

  // Load Moon Texture Image if available
  const moonImg = new Image();
  moonImg.src = 'assets/images/night_moon_sea.jpg';
  let moonLoaded = false;
  moonImg.onload = () => { moonLoaded = true; };

  // Stars background for Night Ocean
  const stars = [];
  for (let i = 0; i < 85; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random() * 0.45,
      radius: 0.5 + Math.random() * 1.5,
      twinkleSpeed: 0.5 + Math.random() * 2.0,
      phase: Math.random() * Math.PI * 2
    });
  }
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

  // --------------------------------------------------------------------------
  // 3.5. BIOLUMINESCENT JELLYFISH (Sứa Biển Phát Sáng Lung Linh Trong Biển Đêm)
  // Sứa dạ quang bơi uốn lượn, co bóp nhịp nhàng, tỏa hào quang cyan & tím hồng
  // --------------------------------------------------------------------------
  class BioluminescentJellyfish {
    constructor(x, y, scale = 1, hue = 188) { // hue 188: cyan, 280: violet-pink
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.scale = scale;
      this.hue = hue;
      this.phase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 1.2 + Math.random() * 0.6; // Nhịp co bóp bell
      this.swimAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.4; // Hướng bơi lên
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = -0.25 - Math.random() * 0.35;
      this.tentacleCount = 5;
    }

    update(time, shoreBaseY) {
      this.phase += 0.04 * this.pulseSpeed;
      // Nhịp co bóp (contract & expand)
      const contraction = Math.sin(this.phase);
      const thrust = Math.max(0, contraction);

      this.x += this.vx + Math.cos(time * 0.8 + this.phase) * 0.35;
      this.y += this.vy * (1 + thrust * 1.6);

      // Re-spawn seamless loop trong tầng nước biển
      const minY = shoreBaseY * 0.25;
      const maxY = shoreBaseY * 0.95;
      if (this.y < minY) {
        this.y = maxY;
        this.x = Math.random() * width;
      }
      if (this.x < -40) this.x = width + 40;
      if (this.x > width + 40) this.x = -40;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);

      const contraction = Math.sin(this.phase);
      // Co bóp vòm dù (bell pulsing)
      const bellWidth = (18 + contraction * 3.5) * this.scale;
      const bellHeight = (15 - contraction * 2.8) * this.scale;

      // 1. Vầng hào quang phát sáng tỏa rộng (Bioluminescent outer aura)
      const glowGrad = ctx.createRadialGradient(0, 0, bellWidth * 0.2, 0, 0, bellWidth * 2.8);
      glowGrad.addColorStop(0, `hsla(${this.hue}, 95%, 70%, 0.45)`);
      glowGrad.addColorStop(0.4, `hsla(${this.hue}, 90%, 60%, 0.18)`);
      glowGrad.addColorStop(1, `hsla(${this.hue}, 90%, 60%, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, bellWidth * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. Vòm dù của sứa (Jellyfish Translucent Dome Bell)
      const bellGrad = ctx.createRadialGradient(0, -bellHeight * 0.3, bellWidth * 0.1, 0, 0, bellWidth);
      bellGrad.addColorStop(0, `hsla(${this.hue}, 100%, 92%, 0.85)`);
      bellGrad.addColorStop(0.5, `hsla(${this.hue}, 95%, 68%, 0.55)`);
      bellGrad.addColorStop(0.9, `hsla(${this.hue + 25}, 90%, 60%, 0.35)`);
      bellGrad.addColorStop(1, `hsla(${this.hue + 40}, 95%, 55%, 0.15)`);

      ctx.fillStyle = bellGrad;
      ctx.beginPath();
      ctx.moveTo(-bellWidth, 0);
      ctx.bezierCurveTo(-bellWidth * 0.9, -bellHeight * 1.3, bellWidth * 0.9, -bellHeight * 1.3, bellWidth, 0);
      ctx.bezierCurveTo(bellWidth * 0.6, bellHeight * 0.35, -bellWidth * 0.6, bellHeight * 0.35, -bellWidth, 0);
      ctx.closePath();
      ctx.fill();

      // Viền phát sáng rực rỡ ở rìa vòm dù
      ctx.strokeStyle = `hsla(${this.hue}, 100%, 88%, 0.75)`;
      ctx.lineWidth = 1.2 * this.scale;
      ctx.stroke();

      // 3. Nhân cơ quan phát quang trung tâm (Bioluminescent organ core)
      ctx.fillStyle = `hsla(${this.hue - 15}, 100%, 95%, 0.9)`;
      ctx.beginPath();
      ctx.arc(0, -bellHeight * 0.35, 3.2 * this.scale, 0, Math.PI * 2);
      ctx.fill();

      // 4. Các xúc tu uyển chuyển mềm mại (Flowing flowing tentacles)
      ctx.lineWidth = 1.0 * this.scale;
      for (let i = 0; i < this.tentacleCount; i++) {
        const tOffset = (i - (this.tentacleCount - 1) / 2) * (bellWidth * 0.38);
        const tLen = (28 + (i % 2) * 12) * this.scale;

        ctx.strokeStyle = `hsla(${this.hue + i * 6}, 95%, 75%, ${0.55 - (i % 2) * 0.15})`;
        ctx.beginPath();
        ctx.moveTo(tOffset, 2);

        const wave1 = Math.sin(this.phase + i * 0.8) * (5 * this.scale);
        const wave2 = Math.cos(this.phase * 0.9 + i * 1.1) * (7 * this.scale);
        const wave3 = Math.sin(this.phase * 1.3 + i * 0.5) * (9 * this.scale);

        ctx.bezierCurveTo(
          tOffset + wave1, tLen * 0.35,
          tOffset - wave2, tLen * 0.7,
          tOffset + wave3, tLen
        );
        ctx.stroke();

        // Đốm sáng dạ quang ở đầu xúc tu
        ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, 0.8)`;
        ctx.beginPath();
        ctx.arc(tOffset + wave3, tLen, 1.2 * this.scale, 0, Math.PI * 2);
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

  // Create school of bioluminescent jellyfish for the night sea
  const jellyfishes = [
    new BioluminescentJellyfish(width * 0.15, height * 0.26, 1.1, 185), // Cyan glow
    new BioluminescentJellyfish(width * 0.32, height * 0.34, 0.8, 275), // Violet pink glow
    new BioluminescentJellyfish(width * 0.58, height * 0.22, 1.25, 192), // Radiant turquoise
    new BioluminescentJellyfish(width * 0.76, height * 0.30, 0.95, 290), // Magenta-violet
    new BioluminescentJellyfish(width * 0.88, height * 0.38, 0.75, 180), // Deep cyan
    new BioluminescentJellyfish(width * 0.42, height * 0.28, 1.05, 188)  // Moon cyan
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

    // ------------------------------------------------------------------------
    // 1. SKY & CELESTIAL BODIES (DAY SUN vs NIGHT MOON & STARS)
    // ------------------------------------------------------------------------
    const isNight = currentTheme === 'night';

    if (!isNight) {
      // DAY SKY: Crisp coastal zenith blue & warm sun mist
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.48);
      skyGrad.addColorStop(0, '#eaf4fc');
      skyGrad.addColorStop(0.35, '#f0f7fd');
      skyGrad.addColorStop(0.75, '#e4effa');
      skyGrad.addColorStop(1, '#cfe3f5');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.5);

      // Sun glare on horizon
      const sunGrad = ctx.createRadialGradient(width * 0.65, height * 0.12, 10, width * 0.65, height * 0.12, width * 0.45);
      sunGrad.addColorStop(0, 'rgba(255, 252, 235, 0.45)');
      sunGrad.addColorStop(0.3, 'rgba(255, 245, 210, 0.18)');
      sunGrad.addColorStop(1, 'rgba(255, 245, 210, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, width, height * 0.5);

      // Render flying seagulls in daytime sky
      seagulls.forEach(gull => {
        gull.update(time);
        gull.draw();
      });
    } else {
      // NIGHT SKY: Deep indigo abyss, majestic glowing moon & sparkling stars
      const nightSkyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.5);
      nightSkyGrad.addColorStop(0, '#040b17');
      nightSkyGrad.addColorStop(0.4, '#07162c');
      nightSkyGrad.addColorStop(0.8, '#0b2545');
      nightSkyGrad.addColorStop(1, '#0e3a63');
      ctx.fillStyle = nightSkyGrad;
      ctx.fillRect(0, 0, width, height * 0.5);

      // Twinkling stars
      stars.forEach(s => {
        const starAlpha = 0.35 + Math.sin(time * s.twinkleSpeed + s.phase) * 0.35;
        ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0, starAlpha)})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Luminous Giant Full Moon (Center-right in the night sky)
      const moonX = width * 0.5;
      const moonY = height * 0.18;
      const moonRadius = Math.min(width * 0.16, 120);

      // Moon celestial glow halo
      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 3.2);
      moonGlow.addColorStop(0, 'rgba(224, 242, 254, 0.45)');
      moonGlow.addColorStop(0.35, 'rgba(125, 211, 252, 0.22)');
      moonGlow.addColorStop(0.7, 'rgba(56, 189, 248, 0.08)');
      moonGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Moon body
      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.clip();

      if (moonLoaded) {
        // Draw real texture from the user's uploaded moon sea image
        const imgSize = moonRadius * 2.8;
        ctx.drawImage(moonImg, moonX - imgSize * 0.5, moonY - imgSize * 0.5 - 20, imgSize, imgSize);
      } else {
        // Fallback procedural detailed moon gradient
        const moonGrad = ctx.createRadialGradient(moonX - moonRadius * 0.25, moonY - moonRadius * 0.25, moonRadius * 0.1, moonX, moonY, moonRadius);
        moonGrad.addColorStop(0, '#ffffff');
        moonGrad.addColorStop(0.6, '#e0f2fe');
        moonGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = moonGrad;
        ctx.fillRect(moonX - moonRadius, moonY - moonRadius, moonRadius * 2, moonRadius * 2);
      }
      ctx.restore();

      // Soft clouds crossing in front of the moon
      ctx.fillStyle = 'rgba(14, 42, 71, 0.35)';
      ctx.beginPath();
      ctx.ellipse(moonX - moonRadius * 0.4, moonY + moonRadius * 0.6, moonRadius * 1.4, moonRadius * 0.35, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------------------------------
    // 2. SHORELINE SAND GEOMETRY (DAY WARM TAN vs NIGHT MOONLIT SILVER SAND)
    // ------------------------------------------------------------------------
    const shoreBaseY = height * 0.46;
    const sandGrad = ctx.createLinearGradient(0, shoreBaseY, 0, height);
    if (!isNight) {
      sandGrad.addColorStop(0, '#dfcfba');
      sandGrad.addColorStop(0.2, '#ebdcc9');
      sandGrad.addColorStop(0.6, '#f3e8dc');
      sandGrad.addColorStop(1, '#f9f3ec');
    } else {
      sandGrad.addColorStop(0, '#0a1626');   // deep night sand
      sandGrad.addColorStop(0.2, '#0f223a');  // midnight moist sand
      sandGrad.addColorStop(0.6, '#132b49');  // dark pearl sand
      sandGrad.addColorStop(1, '#183457');    // moonlight glazed sand
    }
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, shoreBaseY, width, height - shoreBaseY);

    // ------------------------------------------------------------------------
    // 3. TIDE DYNAMICS & SWASH CYCLE
    // ------------------------------------------------------------------------
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

    // ------------------------------------------------------------------------
    // 4. WET SAND REFLECTION
    // ------------------------------------------------------------------------
    if (wetSandMaxY > shoreBaseY) {
      ctx.save();
      const wetGrad = ctx.createLinearGradient(0, shoreBaseY, 0, wetSandMaxY);
      if (!isNight) {
        wetGrad.addColorStop(0, 'rgba(175, 148, 122, 0.55)');
        wetGrad.addColorStop(0.6, 'rgba(195, 170, 142, 0.45)');
        wetGrad.addColorStop(0.9, 'rgba(215, 195, 170, 0.35)');
        wetGrad.addColorStop(1, 'rgba(235, 215, 195, 0.0)');
      } else {
        wetGrad.addColorStop(0, 'rgba(10, 25, 45, 0.65)');
        wetGrad.addColorStop(0.6, 'rgba(14, 35, 62, 0.55)');
        wetGrad.addColorStop(0.9, 'rgba(25, 55, 95, 0.4)');
        wetGrad.addColorStop(1, 'rgba(35, 75, 125, 0.0)');
      }
      ctx.fillStyle = wetGrad;
      ctx.beginPath();
      ctx.rect(0, shoreBaseY, width, wetSandMaxY - shoreBaseY);
      ctx.fill();

      // Sky & Moon glaze reflection on wet sand
      const skyGlaze = ctx.createLinearGradient(0, shoreBaseY, 0, wetSandMaxY);
      if (!isNight) {
        skyGlaze.addColorStop(0, 'rgba(190, 220, 245, 0.25)');
        skyGlaze.addColorStop(0.7, 'rgba(210, 235, 255, 0.15)');
        skyGlaze.addColorStop(1, 'rgba(210, 235, 255, 0)');
      } else {
        skyGlaze.addColorStop(0, 'rgba(125, 211, 252, 0.35)');
        skyGlaze.addColorStop(0.7, 'rgba(56, 189, 248, 0.2)');
        skyGlaze.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = skyGlaze;
      ctx.fillRect(0, shoreBaseY, width, wetSandMaxY - shoreBaseY);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 5. DISTANT DEEP OCEAN WATER (Gerstner waves)
    // ------------------------------------------------------------------------
    ctx.save();
    const deepOceanGrad = ctx.createLinearGradient(0, 0, 0, shoreBaseY + 60);
    if (!isNight) {
      deepOceanGrad.addColorStop(0, '#023859');
      deepOceanGrad.addColorStop(0.25, '#03588c');
      deepOceanGrad.addColorStop(0.65, '#0284c7');
      deepOceanGrad.addColorStop(1, '#0ea5e9');
    } else {
      deepOceanGrad.addColorStop(0, '#02182b');
      deepOceanGrad.addColorStop(0.25, '#042747');
      deepOceanGrad.addColorStop(0.65, '#07416e');
      deepOceanGrad.addColorStop(1, '#0d5c98');
    }

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

    // ------------------------------------------------------------------------
    // Moonbeam Sparkling Reflection Trail (Vệt sáng trăng lung linh trên biển)
    // ------------------------------------------------------------------------
    if (isNight) {
      const beamCenter = width * 0.5;
      for (let x = beamCenter - 220; x <= beamCenter + 220; x += 24) {
        const distFromCenter = Math.abs(x - beamCenter);
        const intensity = Math.max(0, 1 - distFromCenter / 220);
        const gSpark = getGerstnerHeight(x, time, 5.0, 110, 1.4);
        if (gSpark < -1.2) {
          const sparkY = shoreBaseY * 0.65 + gSpark * 5 + Math.sin(x * 0.2 + time * 3) * 8;
          ctx.fillStyle = `rgba(224, 242, 254, ${intensity * 0.75})`;
          const rX = Math.max(0.5, 12 * intensity + Math.sin(x + time * 4) * 5);
          const rY = Math.max(0.5, 2.2 * intensity);
          ctx.beginPath();
          ctx.ellipse(x, sparkY, rX, rY, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Specular sunlight glints on wave crests
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let x = 30; x < width; x += 48) {
        const gSpark = getGerstnerHeight(x, time, 5.0, 120, 1.4);
        if (gSpark < -1.8) {
          const glintY = shoreBaseY * 0.7 + gSpark * 4;
          const rX = Math.max(0.5, 8 + Math.sin(x + time * 3) * 4);
          ctx.beginPath();
          ctx.ellipse(x, glintY, rX, 1.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ------------------------------------------------------------------------
    // BIOLUMINESCENT JELLYFISH FLOCK (Đàn sứa biển dạ quang bơi lội phát sáng)
    // ------------------------------------------------------------------------
    if (isNight) {
      jellyfishes.forEach(jelly => {
        jelly.update(time, shoreBaseY);
        jelly.draw();
      });
    }

    ctx.restore();

    // ------------------------------------------------------------------------
    // 6. MAIN BREAKING SURF WAVE LAYER
    // ------------------------------------------------------------------------
    ctx.save();
    const midWaveGrad = ctx.createLinearGradient(0, shoreBaseY, 0, surgeReachY);
    if (!isNight) {
      midWaveGrad.addColorStop(0, 'rgba(2, 132, 199, 0.85)');
      midWaveGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.65)');
      midWaveGrad.addColorStop(0.85, 'rgba(45, 212, 191, 0.52)');
      midWaveGrad.addColorStop(1, 'rgba(94, 234, 212, 0.28)');
    } else {
      midWaveGrad.addColorStop(0, 'rgba(7, 65, 110, 0.88)');
      midWaveGrad.addColorStop(0.5, 'rgba(13, 92, 152, 0.72)');
      midWaveGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.58)');
      midWaveGrad.addColorStop(1, 'rgba(125, 211, 252, 0.35)');
    }

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

    // 7. BREAKING WAVE CREST & CRASHING FOAM (Dịu nhẹ, thanh thoát, không đè vệt răng cưa lên thẻ)
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = isNight ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    for (let i = 0; i < swashPoints.length; i++) {
      const pt = swashPoints[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);

      // Thả nhẹ bọt biển tự nhiên, tối ưu hiệu năng
      if (i % 12 === 0 && Math.random() < 0.2) {
        emitFoam(pt.x, pt.y, 1.4, 0.5);
      }
    }
    ctx.stroke();
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

    // 9. Cua cát đã được gỡ bỏ để giao diện biển thanh khiết, sạch sẽ, không che khuất chữ

    // Decay mouse ripple
    mouseRipple.x += (mouseRipple.targetX - mouseRipple.x) * 0.15;
    mouseRipple.y += (mouseRipple.targetY - mouseRipple.y) * 0.15;
    mouseRipple.intensity *= 0.96;

    if (isEngineActive) {
      animFrameId = requestAnimationFrame(renderOcean);
    }
  }

  // --------------------------------------------------------------------------
  // 10. POWERFUL MULTI-LAYER PROCEDURAL OCEAN WAVES AUDIO SYNTHESIZER
  // Tái tạo âm thanh sóng biển cuộn trào mạnh mẽ, rõ ràng, kích thích tập trung:
  // - Lớp 1: Tiếng ầm ầm trầm hùng của sóng biển sâu (Deep Ocean Sub-Rumble: 45Hz - 120Hz)
  // - Lớp 2: Tiếng sóng đánh bờ cuộn trào vỗ mạnh (Crashing Breaker Surge: 180Hz - 850Hz)
  // - Lớp 3: Tiếng bọt trắng xóa sủi bọt xào xạc sắc nét (Crisp Foaming Surf Hiss: 1.2kHz - 4.5kHz)
  // - Hai chu kỳ sóng phối hợp: Sóng chính dồn dập (5.2s) & Sóng triều thứ cấp (8.4s)
  // --------------------------------------------------------------------------
  let oceanAudioCtx = null;
  let oceanSoundPlaying = false;
  let oceanGainNode = null;
  let noiseNode = null;
  let whiteNoiseNode = null;

  function initOceanAudio() {
    if (oceanAudioCtx) return;
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return;

    oceanAudioCtx = new AudioCtxClass();

    // 1. Pink Noise Buffer (8s seamless loop) cho sóng cuộn và tiếng ầm
    const bufferSize = oceanAudioCtx.sampleRate * 8;
    const pinkBuffer = oceanAudioCtx.createBuffer(1, bufferSize, oceanAudioCtx.sampleRate);
    const pinkData = pinkBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.14; // Âm lượng giàu năng lượng
      b6 = white * 0.115926;
    }

    // 2. White Noise Buffer cho tiếng bọt biển tan xào xạc chân thực
    const whiteBuffer = oceanAudioCtx.createBuffer(1, bufferSize, oceanAudioCtx.sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      whiteData[i] = (Math.random() * 2 - 1) * 0.12;
    }

    noiseNode = oceanAudioCtx.createBufferSource();
    noiseNode.buffer = pinkBuffer;
    noiseNode.loop = true;

    whiteNoiseNode = oceanAudioCtx.createBufferSource();
    whiteNoiseNode.buffer = whiteBuffer;
    whiteNoiseNode.loop = true;

    // --- LỚP 1: DEEP OCEAN SUB-RUMBLE (Tiếng ầm ầm trầm hùng sâu thẳm) ---
    const subFilter = oceanAudioCtx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(95, oceanAudioCtx.currentTime);
    subFilter.Q.setValueAtTime(1.8, oceanAudioCtx.currentTime);

    const subGain = oceanAudioCtx.createGain();
    subGain.gain.setValueAtTime(0.75, oceanAudioCtx.currentTime);

    // --- LỚP 2: CRASHING BREAKER SURGE (Tiếng sóng vỗ mạnh mẽ cuộn trào) ---
    const breakerFilter = oceanAudioCtx.createBiquadFilter();
    breakerFilter.type = 'lowpass';
    breakerFilter.frequency.setValueAtTime(420, oceanAudioCtx.currentTime);
    breakerFilter.Q.setValueAtTime(2.2, oceanAudioCtx.currentTime); // Resonance mạnh mẽ

    const breakerGain = oceanAudioCtx.createGain();
    breakerGain.gain.setValueAtTime(0.85, oceanAudioCtx.currentTime);

    // --- LỚP 3: CRISP FOAM HISS (Tiếng bọt biển vỡ xào xạc sắc nét, kích thích thính giác) ---
    const foamFilter = oceanAudioCtx.createBiquadFilter();
    foamFilter.type = 'bandpass';
    foamFilter.frequency.setValueAtTime(1800, oceanAudioCtx.currentTime);
    foamFilter.Q.setValueAtTime(1.4, oceanAudioCtx.currentTime);

    const foamGain = oceanAudioCtx.createGain();
    foamGain.gain.setValueAtTime(0.42, oceanAudioCtx.currentTime);

    // --- LFO MODULATION (Điều chế chu kỳ sóng đánh dồn dập, mạnh mẽ) ---
    // Sóng chính (Chu kỳ ~5.3s: tần số 0.19Hz)
    const lfo1 = oceanAudioCtx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.setValueAtTime(0.19, oceanAudioCtx.currentTime);

    const lfoBreakerFreqGain = oceanAudioCtx.createGain();
    lfoBreakerFreqGain.gain.setValueAtTime(460, oceanAudioCtx.currentTime); // Quét tần số 200Hz - 880Hz
    lfo1.connect(lfoBreakerFreqGain);
    lfoBreakerFreqGain.connect(breakerFilter.frequency);

    // Điều chế âm lượng tiếng sóng vỗ mạnh
    const lfoBreakerVolGain = oceanAudioCtx.createGain();
    lfoBreakerVolGain.gain.setValueAtTime(0.48, oceanAudioCtx.currentTime);
    lfo1.connect(lfoBreakerVolGain);
    lfoBreakerVolGain.connect(breakerGain.gain);

    // Sóng phụ (Chu kỳ triều ~8.6s: tần số 0.116Hz)
    const lfo2 = oceanAudioCtx.createOscillator();
    lfo2.type = 'triangle';
    lfo2.frequency.setValueAtTime(0.116, oceanAudioCtx.currentTime);

    const lfoSubGain = oceanAudioCtx.createGain();
    lfoSubGain.gain.setValueAtTime(0.35, oceanAudioCtx.currentTime);
    lfo2.connect(lfoSubGain);
    lfoSubGain.connect(subGain.gain);

    // Điều chế tiếng bọt biển (bọt xào xạc khi sóng đập vào bờ)
    const lfoFoamGain = oceanAudioCtx.createGain();
    lfoFoamGain.gain.setValueAtTime(0.28, oceanAudioCtx.currentTime);
    lfo1.connect(lfoFoamGain);
    lfoFoamGain.connect(foamGain.gain);

    // --- MASTER MIXER ---
    oceanGainNode = oceanAudioCtx.createGain();
    oceanGainNode.gain.setValueAtTime(0.001, oceanAudioCtx.currentTime);

    // Kết nối các luồng âm thanh
    noiseNode.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(oceanGainNode);

    noiseNode.connect(breakerFilter);
    breakerFilter.connect(breakerGain);
    breakerGain.connect(oceanGainNode);

    whiteNoiseNode.connect(foamFilter);
    foamFilter.connect(foamGain);
    foamGain.connect(oceanGainNode);

    oceanGainNode.connect(oceanAudioCtx.destination);

    // Bắt đầu phát âm thanh
    noiseNode.start(0);
    whiteNoiseNode.start(0);
    lfo1.start(0);
    lfo2.start(0);
  }

  // --------------------------------------------------------------------------
  // PUBLIC OCEAN ENGINE API
  // --------------------------------------------------------------------------
  window.OceanEngine = {
    getTheme() {
      return currentTheme;
    },

    setTheme(theme) {
      currentTheme = theme === 'night' ? 'night' : 'day';
      localStorage.setItem('ngaos_ocean_theme', currentTheme);

      if (currentTheme === 'night') {
        document.body.classList.add('theme-night');
      } else {
        document.body.classList.remove('theme-night');
      }

      this.updateHeaderControls();
    },

    toggleTheme() {
      const next = currentTheme === 'day' ? 'night' : 'day';
      this.setTheme(next);
      return next;
    },

    isSoundPlaying() {
      return oceanSoundPlaying;
    },

    toggleSound() {
      initOceanAudio();
      if (!oceanAudioCtx) return false;

      if (oceanAudioCtx.state === 'suspended') {
        oceanAudioCtx.resume();
      }

      const now = oceanAudioCtx.currentTime;
      if (!oceanSoundPlaying) {
        oceanSoundPlaying = true;
        oceanGainNode.gain.cancelScheduledValues(now);
        oceanGainNode.gain.setValueAtTime(oceanGainNode.gain.value, now);
        oceanGainNode.gain.linearRampToValueAtTime(0.58, now + 1.2); // Powerful, invigorating wave volume
      } else {
        oceanSoundPlaying = false;
        oceanGainNode.gain.cancelScheduledValues(now);
        oceanGainNode.gain.setValueAtTime(oceanGainNode.gain.value, now);
        oceanGainNode.gain.linearRampToValueAtTime(0.0001, now + 1.2); // Smooth fade-out
      }

      this.updateSoundControls();
      return oceanSoundPlaying;
    },

    updateHeaderControls() {
      const toggleBtn = document.getElementById('btn-theme-toggle');
      const toggleLabel = document.getElementById('theme-toggle-label');
      const toggleIcon = document.getElementById('theme-toggle-icon');

      if (toggleLabel && toggleIcon) {
        if (currentTheme === 'night') {
          toggleLabel.textContent = 'Biển Đêm';
          toggleIcon.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          `;
        } else {
          toggleLabel.textContent = 'Biển Ngày';
          toggleIcon.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          `;
        }
      }
    },

    updateSoundControls() {
      const soundBtn = document.getElementById('btn-sound-toggle');
      const soundLabel = document.getElementById('sound-toggle-label');

      if (soundBtn && soundLabel) {
        if (oceanSoundPlaying) {
          soundBtn.classList.add('playing');
          soundLabel.textContent = 'Đang Nghe Sóng';
        } else {
          soundBtn.classList.remove('playing');
          soundLabel.textContent = 'Sóng Biển';
        }
      }
    }
  };

  // Set initial theme on load
  window.OceanEngine.setTheme(currentTheme);

  // Start animated ocean ecosystem
  animFrameId = requestAnimationFrame(renderOcean);
})();

