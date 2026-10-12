/**
 * NGAAN OS — LIVING OCEAN & REALISTIC BLUE WHALE ENGINE
 * High-performance 60FPS HTML5 Canvas
 * Features:
 *  - Realistic undulating Blue Whale (Balaenoptera musculus) with harmonic sinusoidal spine physics
 *  - Volumetric underwater sun rays & light caustics
 *  - Bioluminescent floating plankton & micro-bubbles
 *  - Interactive ripples & summon whale mechanism
 */

(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'ocean-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // =========================================================================
  // 1. BIOLUMINESCENT PLANKTON & AMBIENT BUBBLES
  // =========================================================================
  const PARTICLE_COUNT = 65;
  const particles = [];

  class BiolumParticle {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 20;
      this.size = Math.random() * 2.5 + 1.0;
      this.speedY = -(Math.random() * 0.45 + 0.15);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.baseAlpha = Math.random() * 0.45 + 0.2;
      this.alpha = this.baseAlpha;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
      // Hue between deep marine cyan and glowing turquoise
      this.hue = Math.random() > 0.4 ? 188 : 172;
    }
    update(time) {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(time * 0.001 + this.pulsePhase) * 0.35;
      this.alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.18;

      if (this.y < -30 || this.x < -30 || this.x > width + 30) {
        this.reset(false);
      }
    }
    draw(isBeachDay = false) {
      ctx.save();
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3.5);
      if (isBeachDay) {
        grad.addColorStop(0, `hsla(45, 95%, 68%, ${Math.max(0, this.alpha * 0.9)})`);
        grad.addColorStop(0.4, `hsla(190, 90%, 65%, ${Math.max(0, this.alpha * 0.4)})`);
        grad.addColorStop(1, `hsla(45, 90%, 50%, 0)`);
      } else {
        grad.addColorStop(0, `hsla(${this.hue}, 95%, 72%, ${Math.max(0, this.alpha)})`);
        grad.addColorStop(0.4, `hsla(${this.hue}, 90%, 55%, ${Math.max(0, this.alpha * 0.5)})`);
        grad.addColorStop(1, `hsla(${this.hue}, 90%, 40%, 0)`);
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Solid tiny core
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, this.alpha + 0.2)})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new BiolumParticle());
  }

  // =========================================================================
  // 1.5. NATURAL COASTAL CALM — CIRRUS CLOUDS & SHORELINE WASH (DAY THEME)
  // =========================================================================
  class CirrusCloud {
    constructor(x, y, scale, speed) {
      this.x = x;
      this.y = y;
      this.scale = scale;
      this.speed = speed;
    }
    update() {
      this.x += this.speed;
      if (this.x > width + 250) {
        this.x = -250;
        this.y = Math.random() * (height * 0.35);
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 140 * this.scale);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      grad.addColorStop(0.4, 'rgba(240, 249, 255, 0.26)');
      grad.addColorStop(0.8, 'rgba(224, 242, 254, 0.1)');
      grad.addColorStop(1, 'rgba(224, 242, 254, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 140 * this.scale, 35 * this.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(50 * this.scale, -10 * this.scale, 90 * this.scale, 24 * this.scale, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const clouds = [
    new CirrusCloud(width * 0.1, height * 0.08, 1.1, 0.12),
    new CirrusCloud(width * 0.45, height * 0.14, 0.9, 0.08),
    new CirrusCloud(width * 0.75, height * 0.05, 1.3, 0.15),
    new CirrusCloud(width * 0.25, height * 0.22, 0.7, 0.06),
  ];

  function drawNaturalBeachScene(time) {
    // 1. Soothing natural coastal morning sky (Calm sea mist, zero harsh cyan glare)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#f8fafc');    // Soft morning pearl mist (Slate 50)
    skyGrad.addColorStop(0.35, '#f1f5f9'); // Serene gentle dawn (Slate 100)
    skyGrad.addColorStop(0.65, '#e2e8f0'); // Muted morning horizon
    skyGrad.addColorStop(0.85, '#dbeafe'); // Soft sea mist azure
    skyGrad.addColorStop(1, '#bfdbfe');    // Gentle calm coastal waters (Blue 200, muted & soothing)
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Drifting wispy cirrus clouds
    clouds.forEach(c => {
      c.update();
      c.draw();
    });

    // 3. Sandy beach floor at the bottom (Gentle warm linen & dune sand, low luminance)
    const beachY = height * 0.82;
    const sandGrad = ctx.createLinearGradient(0, beachY, 0, height);
    sandGrad.addColorStop(0, 'rgba(254, 252, 232, 0.7)'); // Soft warm linen
    sandGrad.addColorStop(0.4, 'rgba(254, 243, 199, 0.8)'); // Gentle dune sand
    sandGrad.addColorStop(0.8, 'rgba(253, 230, 138, 0.75)'); // Calm sandy shore
    sandGrad.addColorStop(1, 'rgba(245, 222, 179, 0.85)');

    // Natural undulating sand contour
    ctx.save();
    ctx.fillStyle = sandGrad;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, beachY + 15);
    for (let x = 0; x <= width; x += 20) {
      const sandWave = Math.sin(x * 0.004) * 8 + Math.cos(x * 0.009) * 4;
      ctx.lineTo(x, beachY + sandWave);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // 4. Multi-harmonic shoreline waves wash & foam
    // Wave layer 1: Gentle turquoise sea wash
    ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, beachY - 10);
    for (let x = 0; x <= width; x += 15) {
      const w1 = Math.sin(time * 0.0018 + x * 0.006) * 12 + Math.cos(time * 0.003 + x * 0.012) * 5;
      ctx.lineTo(x, beachY - 12 + w1);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Wave layer 2: Translucent aquamarine crest
    ctx.fillStyle = 'rgba(45, 212, 191, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, beachY + 2);
    for (let x = 0; x <= width; x += 15) {
      const w2 = Math.sin(time * 0.0014 + x * 0.005 + 1.2) * 14 + Math.sin(time * 0.0028 + x * 0.009) * 6;
      ctx.lineTo(x, beachY + w2);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Wave foam wash (bọt sóng trắng li ti dạt bờ nhịp nhàng)
    const tide = Math.sin(time * 0.0012);
    const foamY = beachY + 12 + tide * 16;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 12) {
      const foamCurve = Math.sin(time * 0.002 + x * 0.008) * 6 + Math.cos(x * 0.02) * 2.5;
      const curY = foamY + foamCurve;
      if (x === 0) ctx.moveTo(x, curY);
      else ctx.lineTo(x, curY);
    }
    ctx.stroke();

    // Tiny foam bubbles near the shore rim
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < 18; i++) {
      const bx = ((i * 73 + time * 0.02) % (width + 40)) - 20;
      const by = foamY + Math.sin(i * 1.7 + time * 0.002) * 8 + 4;
      ctx.beginPath();
      ctx.arc(bx, by, (i % 3) + 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================================
  // 2. OCEAN CAUSTICS & SUNLIGHT RAYS
  // =========================================================================
  const rays = [
    { xRatio: 0.15, width: 90, speed: 0.0008, phase: 0.5, intensity: 0.07 },
    { xRatio: 0.35, width: 140, speed: 0.0006, phase: 2.1, intensity: 0.10 },
    { xRatio: 0.55, width: 110, speed: 0.0009, phase: 4.2, intensity: 0.08 },
    { xRatio: 0.75, width: 160, speed: 0.0005, phase: 1.2, intensity: 0.11 },
    { xRatio: 0.90, width: 80, speed: 0.0007, phase: 3.5, intensity: 0.06 }
  ];

  function drawSunRays(time, isBeachDay = false) {
    ctx.save();
    rays.forEach((ray) => {
      const currentX = ray.xRatio * width + Math.sin(time * ray.speed + ray.phase) * 50;
      const alpha = isBeachDay ? 0.018 : (ray.intensity + Math.sin(time * ray.speed * 1.5 + ray.phase) * 0.03);

      const grad = ctx.createLinearGradient(currentX, 0, currentX - 120, height * 0.85);
      if (isBeachDay) {
        grad.addColorStop(0, `rgba(255, 252, 235, ${alpha * 0.7})`);
        grad.addColorStop(0.4, `rgba(224, 242, 254, ${alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        grad.addColorStop(0, `rgba(100, 220, 255, ${alpha * 1.5})`);
        grad.addColorStop(0.3, `rgba(56, 189, 248, ${alpha})`);
        grad.addColorStop(0.7, `rgba(14, 116, 144, ${alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(3, 15, 38, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(currentX - 20, 0);
      ctx.lineTo(currentX + ray.width, 0);
      ctx.lineTo(currentX + ray.width * 1.8 - 140, height * 0.85);
      ctx.lineTo(currentX - 160, height * 0.85);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  // =========================================================================
  // 3. REALISTIC BLUE WHALE (Cá Voi Xanh - Balaenoptera musculus)
  // =========================================================================
  class BlueWhale {
    constructor() {
      this.reset();
      // Start slightly on-screen so Ngân sees it shortly after opening
      this.x = width * 0.25;
      this.depthScale = 0.85; // 3D depth feeling
    }

    reset() {
      this.speed = Math.random() * 0.45 + 0.65; // Relaxed majestic swimming speed
      this.direction = 1; // 1 = swim right, -1 = swim left
      this.depthScale = Math.random() * 0.35 + 0.65; // Depth variation
      this.length = 340 * this.depthScale;
      this.height = 70 * this.depthScale;

      this.y = Math.random() * (height * 0.55) + height * 0.15;
      this.x = this.direction === 1 ? -this.length - 80 : width + this.length + 80;
      this.swimPhase = 0;
      this.bubbles = [];
    }

    triggerSummon() {
      this.direction = 1;
      this.depthScale = 0.95;
      this.length = 340 * this.depthScale;
      this.height = 70 * this.depthScale;
      this.x = -this.length - 20;
      this.y = height * 0.42;
      this.speed = 0.9;
    }

    update(time) {
      this.x += this.speed * this.direction;
      this.swimPhase += 0.028;

      // Gentle vertical sine bobbing (undulation)
      this.currentY = this.y + Math.sin(this.swimPhase * 0.7) * 24 * this.depthScale;

      // Emit tiny bubbles occasionally from the blowhole / tail
      if (Math.random() < 0.2) {
        this.bubbles.push({
          x: this.x + (this.direction === 1 ? this.length * 0.25 : -this.length * 0.25),
          y: this.currentY - this.height * 0.35,
          radius: Math.random() * 2 + 1,
          speedY: -(Math.random() * 0.8 + 0.4),
          speedX: (Math.random() - 0.5) * 0.3,
          alpha: 0.6
        });
      }

      // Update bubbles
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        b.y += b.speedY;
        b.x += b.speedX;
        b.alpha -= 0.007;
        if (b.alpha <= 0 || b.y < 0) {
          this.bubbles.splice(i, 1);
        }
      }

      // Loop patrol
      if (this.direction === 1 && this.x > width + this.length + 150) {
        this.reset();
      } else if (this.direction === -1 && this.x < -this.length - 150) {
        this.reset();
      }
    }

    draw(time, isBeachDay = false) {
      ctx.save();

      // Draw whale bubbles first
      this.bubbles.forEach((b) => {
        ctx.fillStyle = isBeachDay ? `rgba(255, 255, 255, ${b.alpha * 0.85})` : `rgba(180, 240, 255, ${b.alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Soft underwater ground shadow in daylight shallow water
      if (isBeachDay) {
        ctx.save();
        const groundShadowY = Math.min(height - 25, this.currentY + 120 * this.depthScale);
        ctx.fillStyle = 'rgba(2, 44, 84, 0.18)';
        ctx.beginPath();
        ctx.ellipse(this.x, groundShadowY, this.length * 0.42, 18 * this.depthScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.translate(this.x, this.currentY);
      if (this.direction === -1) {
        ctx.scale(-1, 1);
      }

      // Spine wave kinematics: calculate tail offsets
      const wave = Math.sin(this.swimPhase);
      const tailWave1 = Math.sin(this.swimPhase - 0.9) * 12 * this.depthScale;
      const tailWave2 = Math.sin(this.swimPhase - 1.6) * 26 * this.depthScale;
      const flukeAngle = Math.sin(this.swimPhase - 2.0) * 0.42;

      // Whale Body Gradient (Realistic slate blue with deep oceanic shading)
      const bodyGrad = ctx.createLinearGradient(0, -this.height * 0.5, 0, this.height * 0.6);
      if (isBeachDay) {
        bodyGrad.addColorStop(0, 'rgba(30, 68, 115, 0.92)'); // Dorsal blue
        bodyGrad.addColorStop(0.4, 'rgba(22, 52, 90, 0.95)'); // Mid body
        bodyGrad.addColorStop(0.75, 'rgba(14, 38, 68, 0.95)'); // Flank
        bodyGrad.addColorStop(1, 'rgba(165, 220, 250, 0.85)'); // Ventral light underside
        ctx.shadowColor = 'rgba(2, 132, 199, 0.22)';
      } else {
        bodyGrad.addColorStop(0, 'rgba(40, 78, 120, 0.85)'); // Dorsal blue-gray
        bodyGrad.addColorStop(0.4, 'rgba(28, 56, 88, 0.92)'); // Mid body
        bodyGrad.addColorStop(0.75, 'rgba(18, 38, 64, 0.95)'); // Lower flank
        bodyGrad.addColorStop(1, 'rgba(70, 115, 155, 0.75)'); // Ventral light underside
        ctx.shadowColor = 'rgba(0, 180, 255, 0.25)';
      }
      ctx.shadowBlur = 35 * this.depthScale;

      // ==========================
      // Draw Pectoral Fin (Far side)
      // ==========================
      ctx.save();
      ctx.fillStyle = 'rgba(20, 44, 72, 0.65)';
      ctx.beginPath();
      ctx.ellipse(30 * this.depthScale, -this.height * 0.15, 45 * this.depthScale, 10 * this.depthScale, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ==========================
      // Draw Main Whale Body (Anatomical Bezier contour)
      // ==========================
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();

      // Snout / Head
      const headX = 140 * this.depthScale;
      const headY = 4 * this.depthScale;
      ctx.moveTo(headX, headY);

      // Dorsal Ridge (Top of head -> blowhole -> back -> dorsal fin -> tail peduncle)
      ctx.bezierCurveTo(
        100 * this.depthScale, -this.height * 0.45,
        10 * this.depthScale, -this.height * 0.52,
        -60 * this.depthScale, -this.height * 0.35 + tailWave1 * 0.4
      );

      // Tail Peduncle (Back to tail connection)
      const tailX = -135 * this.depthScale;
      const tailY = tailWave2;
      ctx.bezierCurveTo(
        -90 * this.depthScale, -this.height * 0.22 + tailWave1,
        -115 * this.depthScale, -8 * this.depthScale + tailWave2,
        tailX, tailY
      );

      // Ventral Underside (Tail -> belly grooves -> broad jaw -> snout)
      ctx.bezierCurveTo(
        -115 * this.depthScale, 12 * this.depthScale + tailWave2,
        -70 * this.depthScale, this.height * 0.38 + tailWave1 * 0.5,
        0, this.height * 0.48
      );

      ctx.bezierCurveTo(
        60 * this.depthScale, this.height * 0.48,
        120 * this.depthScale, this.height * 0.28,
        headX, headY
      );
      ctx.closePath();
      ctx.fill();

      // ==========================
      // Ventral Grooves (Throat Pleats of Balaenoptera)
      // ==========================
      ctx.strokeStyle = 'rgba(120, 175, 220, 0.22)';
      ctx.lineWidth = 1.2 * this.depthScale;
      for (let g = 0; g < 4; g++) {
        const offset = (g - 1.5) * 5 * this.depthScale;
        ctx.beginPath();
        ctx.moveTo(110 * this.depthScale, (14 + offset) * this.depthScale);
        ctx.bezierCurveTo(
          60 * this.depthScale, (28 + offset) * this.depthScale,
          0, (26 + offset) * this.depthScale,
          -40 * this.depthScale, (12 + offset) * this.depthScale
        );
        ctx.stroke();
      }

      // ==========================
      // Small Dorsal Fin (Characteristic small fin near tail)
      // ==========================
      ctx.fillStyle = 'rgba(25, 52, 85, 0.9)';
      ctx.beginPath();
      const dorsalX = -75 * this.depthScale;
      const dorsalY = -this.height * 0.30 + tailWave1 * 0.5;
      ctx.moveTo(dorsalX, dorsalY);
      ctx.lineTo(dorsalX - 16 * this.depthScale, dorsalY - 14 * this.depthScale);
      ctx.lineTo(dorsalX - 22 * this.depthScale, dorsalY);
      ctx.closePath();
      ctx.fill();

      // ==========================
      // Tail Flukes (Broad powerful horizontal fins with sine oscillation)
      // ==========================
      ctx.save();
      ctx.translate(tailX, tailY);
      ctx.rotate(flukeAngle);

      ctx.fillStyle = 'rgba(30, 62, 98, 0.95)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Top fluke
      ctx.bezierCurveTo(-15 * this.depthScale, -20 * this.depthScale, -35 * this.depthScale, -36 * this.depthScale, -42 * this.depthScale, -38 * this.depthScale);
      ctx.bezierCurveTo(-38 * this.depthScale, -22 * this.depthScale, -25 * this.depthScale, -6 * this.depthScale, -12 * this.depthScale, 0);
      // Fluke central notch
      ctx.lineTo(-14 * this.depthScale, 0);
      // Bottom fluke
      ctx.bezierCurveTo(-25 * this.depthScale, 6 * this.depthScale, -38 * this.depthScale, 22 * this.depthScale, -42 * this.depthScale, 38 * this.depthScale);
      ctx.bezierCurveTo(-35 * this.depthScale, 36 * this.depthScale, -15 * this.depthScale, 20 * this.depthScale, 0, 0);
      ctx.closePath();
      ctx.fill();

      // Edge highlight on flukes
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.28)';
      ctx.lineWidth = 1.0 * this.depthScale;
      ctx.stroke();
      ctx.restore();

      // ==========================
      // Near Pectoral Fin (Prominent, graceful flipper)
      // ==========================
      ctx.save();
      const flipperAngle = Math.sin(this.swimPhase * 0.8) * 0.15 + 0.35;
      ctx.translate(40 * this.depthScale, 15 * this.depthScale);
      ctx.rotate(flipperAngle);

      const flipperGrad = ctx.createLinearGradient(0, 0, -60 * this.depthScale, 25 * this.depthScale);
      flipperGrad.addColorStop(0, 'rgba(45, 85, 130, 0.95)');
      flipperGrad.addColorStop(1, 'rgba(25, 52, 85, 0.8)');

      ctx.fillStyle = flipperGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-20 * this.depthScale, 15 * this.depthScale, -50 * this.depthScale, 35 * this.depthScale, -75 * this.depthScale, 32 * this.depthScale);
      ctx.bezierCurveTo(-60 * this.depthScale, 18 * this.depthScale, -35 * this.depthScale, 5 * this.depthScale, 0, -8 * this.depthScale);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(100, 210, 255, 0.3)';
      ctx.lineWidth = 1.2 * this.depthScale;
      ctx.stroke();
      ctx.restore();

      // Subtle bioluminescent spinal highlights (like starlight reflected on whale skin)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      for (let s = 0; s < 6; s++) {
        const spotX = (60 - s * 22) * this.depthScale;
        const spotY = (-this.height * 0.25 + s * 1.5) * this.depthScale + (s > 2 ? tailWave1 * 0.3 : 0);
        ctx.beginPath();
        ctx.arc(spotX, spotY, 2.2 * this.depthScale, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  const whale = new BlueWhale();

  // Expose global trigger for summoning the whale
  window.summonBlueWhale = function () {
    whale.triggerSummon();
  };

  // =========================================================================
  // 4. ANIMATION LOOP
  // =========================================================================
  let lastTime = 0;

  function render(time) {
    ctx.clearRect(0, 0, width, height);

    const isBeachDay = document.body && document.body.getAttribute('data-theme') === 'beach-day';

    if (isBeachDay) {
      drawNaturalBeachScene(time);
    } else {
      // Deep ocean volumetric gradient background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#04172c');   // Sub-surface turquoise tint
      bgGrad.addColorStop(0.35, '#031022'); // Mid-depth twilight
      bgGrad.addColorStop(0.75, '#020914'); // Abyss deep blue
      bgGrad.addColorStop(1, '#01040a');   // Ocean floor obsidian
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 1. Draw light caustics
    drawSunRays(time, isBeachDay);

    // 2. Update and draw whale
    whale.update(time);
    whale.draw(time, isBeachDay);

    // 3. Update and draw particles
    particles.forEach((p) => {
      p.update(time);
      p.draw(isBeachDay);
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
