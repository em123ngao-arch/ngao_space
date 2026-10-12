/**
 * NGAOS — REALISTIC LIVING OCEAN ENGINE
 * Photorealistic coastal wave simulation based on Gerstner waves and coastal surf dynamics:
 * - Multi-octave Trochoidal / Gerstner wave displacement
 * - Swash zone surf dynamics: Periodic tide sets, rolling breakers & backwash
 * - Translucent coastal water refraction over natural sand
 * - Wet sand specular sky reflection & capillary receding ripples
 * - Organic sea foam lace & dynamic popping bubble particles
 * - Natural sunlight specular caustics shimmering on crests
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
  // Dynamic Foam Bubble System (Hạt bọt biển xốp dạt bờ)
  // --------------------------------------------------------------------------
  const MAX_FOAM_PARTICLES = 160;
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
      this.decay = 0.008 + Math.random() * 0.014;
      this.vx = vx;
      this.vy = vy;
    }

    update() {
      if (!this.active) return;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.96;
      this.vy *= 0.96;
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

      // Subtle bubble ring outline
      if (this.radius > 2.2) {
        ctx.strokeStyle = 'rgba(210, 240, 255, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  for (let i = 0; i < MAX_FOAM_PARTICLES; i++) {
    foamParticles.push(new FoamBubble());
  }

  function emitFoam(x, y, count = 2, speed = 0.8) {
    let emitted = 0;
    for (let i = 0; i < foamParticles.length && emitted < count; i++) {
      if (!foamParticles[i].active) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed;
        foamParticles[i].spawn(
          x + (Math.random() - 0.5) * 14,
          y + (Math.random() - 0.5) * 6,
          Math.random() * 3.5 + 1.2,
          Math.random() * 0.7 + 0.3,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel * 0.4
        );
        emitted++;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Interactive Ripple Distortions
  // --------------------------------------------------------------------------
  let mouseRipple = { x: -999, y: -999, targetX: -999, targetY: -999, intensity: 0 };
  window.addEventListener('mousemove', (e) => {
    mouseRipple.targetX = e.clientX;
    mouseRipple.targetY = e.clientY;
    mouseRipple.intensity = Math.min(1, mouseRipple.intensity + 0.08);
  }, { passive: true });

  // --------------------------------------------------------------------------
  // Gerstner Wave Harmonic Function
  // --------------------------------------------------------------------------
  function getGerstnerHeight(x, t, amp, wavelength, speed, steepness = 0.6) {
    const k = (2 * Math.PI) / wavelength;
    const phase = k * x - speed * t;
    // Trochoidal peak sharpening: cosine peak with sine sharpening
    const cosVal = Math.cos(phase);
    const sinVal = Math.sin(phase);
    return amp * (cosVal + steepness * sinVal * sinVal * Math.sign(cosVal));
  }

  // --------------------------------------------------------------------------
  // Main Shore & Ocean Renderer
  // --------------------------------------------------------------------------
  let prevSwashY = 0;
  let wetSandMaxY = 0;

  function renderOcean(timestamp) {
    const time = timestamp * 0.001; // in seconds

    // 1. SKY & DISTANT HORIZON (Coastal Morning / Daylight Atmosphere)
    // Natural atmospheric Rayleigh scattering: Soft pastel cerulean mist into horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.48);
    skyGrad.addColorStop(0, '#eaf4fc');    // Pale coastal zenith blue
    skyGrad.addColorStop(0.35, '#f0f7fd'); // Soft ambient mist
    skyGrad.addColorStop(0.75, '#e4effa'); // Marine boundary haze
    skyGrad.addColorStop(1, '#cfe3f5');    // Horizon waterline
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.5);

    // Subtle sun glare on horizon (Golden morning glint)
    const sunGrad = ctx.createRadialGradient(width * 0.65, height * 0.12, 10, width * 0.65, height * 0.12, width * 0.45);
    sunGrad.addColorStop(0, 'rgba(255, 252, 235, 0.45)');
    sunGrad.addColorStop(0.3, 'rgba(255, 245, 210, 0.18)');
    sunGrad.addColorStop(1, 'rgba(255, 245, 210, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height * 0.5);

    // 2. SHORELINE SAND GEOMETRY (Natural Coastal Dune Sand)
    // Shoreline starts at ~46% of viewport and extends to the bottom
    const shoreBaseY = height * 0.46;

    // Dry & Mid sand background
    const sandGrad = ctx.createLinearGradient(0, shoreBaseY, 0, height);
    sandGrad.addColorStop(0, '#dfcfba');   // Distant dry coastal sand
    sandGrad.addColorStop(0.2, '#ebdcc9');  // Warm fine dune sand
    sandGrad.addColorStop(0.6, '#f3e8dc');  // Gentle sloping beach sand
    sandGrad.addColorStop(1, '#f9f3ec');    // Fore-shore light cream sand
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, shoreBaseY, width, height - shoreBaseY);

    // 3. TIDE DYNAMICS & SWASH CYCLE (Nhịp triều dâng & sóng xô bờ chân thực)
    // A natural surf wave set repeats every ~6.8 seconds
    const tideCycleDuration = 6.8;
    const tidePhase = (time % tideCycleDuration) / tideCycleDuration;

    // Asymmetric wave rush:
    // 0.0 -> 0.38: Fast surge forward up the beach (swash rush)
    // 0.38 -> 1.0: Gentle slow backwash receding with wet sand shine
    let surgeProgress = 0;
    if (tidePhase < 0.38) {
      // Swash surge forward (eased sinusoidal acceleration)
      const p = tidePhase / 0.38;
      surgeProgress = Math.sin(p * Math.PI * 0.5);
    } else {
      // Backwash recede (gentle exponential decay)
      const p = (tidePhase - 0.38) / 0.62;
      surgeProgress = Math.cos(p * Math.PI * 0.5);
    }

    // Secondary harmonic wave to give organic irregularity (3-wave set feel)
    const setModulation = 0.85 + Math.sin(time * 0.22) * 0.15;
    const surgeReachY = shoreBaseY + (height * 0.42) * surgeProgress * setModulation;

    // Keep track of maximum reached wet sand for realistic wet sheen
    if (surgeProgress > 0.85) {
      wetSandMaxY = Math.max(wetSandMaxY, surgeReachY);
    } else {
      wetSandMaxY = Math.max(shoreBaseY + 30, wetSandMaxY - 0.25); // very slow dry rate
    }

    // 4. WET SAND REFLECTION (Vết cát ướt bóng láng phản chiếu bầu trời)
    if (wetSandMaxY > shoreBaseY) {
      ctx.save();
      const wetGrad = ctx.createLinearGradient(0, shoreBaseY, 0, wetSandMaxY);
      wetGrad.addColorStop(0, 'rgba(175, 148, 122, 0.55)'); // saturated wet sand
      wetGrad.addColorStop(0.6, 'rgba(195, 170, 142, 0.45)');
      wetGrad.addColorStop(0.9, 'rgba(215, 195, 170, 0.35)');
      wetGrad.addColorStop(1, 'rgba(235, 215, 195, 0.0)');
      ctx.fillStyle = wetGrad;
      ctx.beginPath();
      ctx.rect(0, shoreBaseY, width, wetSandMaxY - shoreBaseY);
      ctx.fill();

      // Mirror-like sky glaze on wet sand
      const skyGlaze = ctx.createLinearGradient(0, shoreBaseY, 0, wetSandMaxY);
      skyGlaze.addColorStop(0, 'rgba(190, 220, 245, 0.25)');
      skyGlaze.addColorStop(0.7, 'rgba(210, 235, 255, 0.15)');
      skyGlaze.addColorStop(1, 'rgba(210, 235, 255, 0)');
      ctx.fillStyle = skyGlaze;
      ctx.fillRect(0, shoreBaseY, width, wetSandMaxY - shoreBaseY);
      ctx.restore();
    }

    // 5. DISTANT DEEP OCEAN WATER (Biển sâu nhấp nhô sóng Gerstner)
    // Renders the permanent deep ocean volume above the shoreline
    ctx.save();
    const deepOceanGrad = ctx.createLinearGradient(0, 0, 0, shoreBaseY + 60);
    deepOceanGrad.addColorStop(0, '#023859');   // Deep cobalt abyss
    deepOceanGrad.addColorStop(0.25, '#03588c'); // Marine azure
    deepOceanGrad.addColorStop(0.65, '#0284c7'); // Turquoise coastal swell
    deepOceanGrad.addColorStop(1, '#0ea5e9');    // Aqua shallow transition

    ctx.fillStyle = deepOceanGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, shoreBaseY);

    // Multi-octave wave horizon line
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

    // Specular sunlight sparkle caustics on distant wave crests
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

    // 6. MAIN BREAKING SURF WAVE LAYER (Lớp sóng cuộn chính dạt bờ)
    // Layer 1: Translucent Emerald/Aquamarine Swell
    ctx.save();
    const midWaveGrad = ctx.createLinearGradient(0, shoreBaseY, 0, surgeReachY);
    midWaveGrad.addColorStop(0, 'rgba(2, 132, 199, 0.85)');
    midWaveGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.65)');
    midWaveGrad.addColorStop(0.85, 'rgba(45, 212, 191, 0.52)');
    midWaveGrad.addColorStop(1, 'rgba(94, 234, 212, 0.28)'); // Crystal clear edge

    ctx.fillStyle = midWaveGrad;
    ctx.beginPath();
    ctx.moveTo(0, shoreBaseY);

    const swashPoints = [];
    for (let x = 0; x <= width; x += 12) {
      // Complex organic wave edge combining Gerstner harmonics and coastal shoaling
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

    // 7. BREAKING WAVE CREST & FOAM LACE (Mép bọt biển trắng xốp dạt bờ)
    // Draw the foamy white fringe right at the advancing wave boundary
    ctx.save();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    for (let i = 0; i < swashPoints.length; i++) {
      const pt = swashPoints[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);

      // Emit sea foam bubble particles along the active crest
      if (i % 6 === 0 && Math.random() < 0.28) {
        emitFoam(pt.x, pt.y, 1, 0.6);
      }
    }
    ctx.stroke();

    // Secondary translucent foam trail (bọt ren thứ cấp dạt sau)
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    for (let i = 0; i < swashPoints.length; i++) {
      const pt = swashPoints[i];
      const trailY = pt.y - 7 - Math.sin(pt.x * 0.08 + time * 4) * 4;
      if (i === 0) ctx.moveTo(pt.x, trailY);
      else ctx.lineTo(pt.x, trailY);
    }
    ctx.stroke();

    // Organic foam lace clusters (Mảng bọt biển trắng li ti rải rác)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let i = 4; i < swashPoints.length - 4; i += 7) {
      const pt = swashPoints[i];
      const patchY = pt.y - 4 - Math.cos(pt.x * 0.05 + time) * 3;
      ctx.beginPath();
      ctx.ellipse(pt.x, patchY, 9 + Math.sin(pt.x) * 4, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 8. UPDATE & RENDER DYNAMIC FOAM PARTICLES
    for (let i = 0; i < foamParticles.length; i++) {
      foamParticles[i].update();
      foamParticles[i].draw();
    }

    // Decay mouse ripple intensity
    mouseRipple.x += (mouseRipple.targetX - mouseRipple.x) * 0.15;
    mouseRipple.y += (mouseRipple.targetY - mouseRipple.y) * 0.15;
    mouseRipple.intensity *= 0.96;

    // Loop
    requestAnimationFrame(renderOcean);
  }

  // Start realistic ocean wave loop
  requestAnimationFrame(renderOcean);
})();
