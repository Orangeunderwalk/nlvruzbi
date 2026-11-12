(() => {
  'use strict';
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  let state = 'ready', previousState = 'playing', score = 0, best = 0;
  let width = 1200, height = 500, bird, pipes = [], particles = [], elapsed = 0, lastTime = 0, spawn = 0;
  let sound = false, audio;
  try { best = Number(localStorage.getItem('little-wings-best')) || 0; } catch {}
  $('best').textContent = String(best).padStart(2, '0');
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio; canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (state === 'playing' || state === 'paused') reset();
  }
  const ground = () => height - 40;
  function reset() {
    state = 'ready'; score = 0; pipes = []; particles = []; spawn = 0;
    bird = { x: width * .27, y: height * .44, velocity: 0, rotation: 0 };
    $('overlay').hidden = false; $('score-display').hidden = true; $('pause').hidden = true; $('result').hidden = true;
    $('ready-tag').textContent = 'A FRESH LITTLE ADVENTURE';
    $('overlay-title').innerHTML = 'Meet your new<br><em>sky-high obsession.</em>';
    $('overlay-copy').textContent = 'Find your rhythm. Mind the pipes. Enjoy the flight.';
    $('play-text').textContent = "Let's fly"; $('start-hint').hidden = false;
    $('score').textContent = '0';
    $('pause').setAttribute('aria-label', 'Pause game');
  }
  function tone(frequency, duration, type = 'sine', volume = .06) {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .55, audio.currentTime + duration);
      gain.gain.setValueAtTime(volume, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
    } catch {}
  }
  function start() {
    reset(); state = 'playing'; spawn = .75;
    $('overlay').hidden = true; $('score-display').hidden = false; $('pause').hidden = false;
    flap();
  }
  function flap() {
    bird.velocity = -295; tone(680, .09);
    for (let i = 0; i < 3; i++) particles.push({ x: bird.x - 12, y: bird.y + 6, vx: -35 - Math.random() * 40, vy: Math.random() * 30, life: .4 });
  }
  function action() {
    if (state === 'ready' || state === 'over') start();
    else if (state === 'playing') flap();
    else if (state === 'paused') pause();
  }
  function end() {
    state = 'over'; tone(130, .3, 'triangle', .12);
    const isBest = score > best;
    best = Math.max(best, score);
    try { localStorage.setItem('little-wings-best', String(best)); } catch {}
    $('best').textContent = String(best).padStart(2, '0');
    $('overlay').hidden = false; $('score-display').hidden = true; $('pause').hidden = true;
    $('ready-tag').textContent = isBest ? 'A NEW PERSONAL BEST!' : 'EVERY FLIGHT IS A FRESH START';
    $('overlay-title').innerHTML = 'A little tumble.<br><em>A new beginning.</em>';
    $('overlay-copy').textContent = score ? 'Nice flying. There’s always another gap to find.' : 'A little tap goes a long way. Give it another go.';
    $('result').hidden = false; $('final-score').textContent = score; $('final-best').textContent = best;
    $('play-text').textContent = 'Fly again'; $('start-hint').hidden = false;
  }
  function pause() {
    if (state === 'playing') {
      previousState = state; state = 'paused'; $('overlay').hidden = false;
      $('ready-tag').textContent = 'TAKE A LITTLE BREATHER'; $('overlay-title').innerHTML = 'The sky<br><em>can wait.</em>';
      $('overlay-copy').textContent = 'Your flight is right where you left it.';
      $('play-text').textContent = 'Keep flying'; $('start-hint').hidden = true;
    } else if (state === 'paused') { state = previousState; $('overlay').hidden = true; }
    $('pause').setAttribute('aria-label', state === 'paused' ? 'Resume game' : 'Pause game');
  }
  function roundRect(x, y, w, h, radius, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); }
  function cloud(x, y, scale, opacity) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha = opacity;
    ctx.fillStyle = '#f8fae9'; ctx.beginPath(); ctx.moveTo(-45, 10); ctx.bezierCurveTo(-60, -4, -38, -22, -23, -16); ctx.bezierCurveTo(-22, -45, 19, -47, 25, -19); ctx.bezierCurveTo(52, -26, 66, -1, 54, 10); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function landscape() {
    const sky = ctx.createLinearGradient(0, 0, 0, height); sky.addColorStop(0, '#dfebd8'); sky.addColorStop(1, '#edf0d4'); ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f5edc1'; ctx.beginPath(); ctx.arc(width * .82, height * .22, 37, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f6edc54d'; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(width * .82, height * .22, 47, 0, Math.PI * 2); ctx.stroke();
    const drift = elapsed * 5;
    cloud(((width * .12 - drift) % (width + 200) + width + 200) % (width + 200) - 60, height * .25, .9, .75);
    cloud(((width * .61 - drift * .7) % (width + 200) + width + 200) % (width + 200) - 60, height * .17, .65, .65);
    cloud(width * .9 - drift * .2 % 80, height * .40, 1, .55);
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = ['#c6d6b5', '#b6cda1', '#a8c392'][layer];
      ctx.beginPath(); ctx.moveTo(0, height);
      for (let x = 0; x <= width + 10; x += 10) {
        const y = height * (.68 + layer * .105) + Math.sin(x / (110 + layer * 25) + layer * 2 + elapsed * .025) * (24 - layer * 4) + Math.sin(x / 240 + layer) * 15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height); ctx.closePath(); ctx.fill();
    }
    // Small distant trees give the meadow a sense of scale.
    for (let i = 0; i < 16; i++) {
      const x = (i * 113 + 24) % (width + 20), y = height * .83 + Math.sin(i * 2) * 12;
      ctx.fillStyle = '#93b480'; ctx.beginPath(); ctx.ellipse(x, y - 12, 7 + i % 4, 15 + i % 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#849e72'; ctx.fillRect(x - 1, y - 6, 2, 15);
    }
    ctx.fillStyle = '#c8d2a1'; ctx.fillRect(0, ground(), width, 40);
    ctx.fillStyle = '#899e68'; ctx.fillRect(0, ground(), width, 3);
    ctx.fillStyle = '#dae0b3'; ctx.fillRect(0, ground() + 3, width, 3);
    ctx.strokeStyle = '#b3c18d'; ctx.lineWidth = 1;
    for (let i = -1; i < width / 24 + 1; i++) { let x = i * 24 - (state === 'playing' ? elapsed * 90 % 24 : 0); ctx.beginPath(); ctx.moveTo(x, ground() + 17); ctx.lineTo(x + 4, ground() + 13); ctx.stroke(); }
    ctx.fillStyle = '#e8e9c4';
    for (let i = 0; i < 18; i++) { const x = (i * 151 + 45) % width; ctx.fillRect(x, ground() - 8 - i % 5, 3, 3); }
  }
  function drawPipe(pipe) {
    const w = 60, top = pipe.center - pipe.gap / 2, bottom = pipe.center + pipe.gap / 2;
    for (const [y, h, upper] of [[-10, top + 10, true], [bottom, ground() - bottom, false]]) {
      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + w, 0); gradient.addColorStop(0, '#6b9361'); gradient.addColorStop(.2, '#8bad73'); gradient.addColorStop(.75, '#93b67b'); gradient.addColorStop(1, '#62885b');
      roundRect(pipe.x, y, w, h, 3, gradient);
      ctx.fillStyle = '#b5ca9166'; ctx.fillRect(pipe.x + 8, y, 5, h);
      roundRect(pipe.x - 5, upper ? top - 23 : bottom, w + 10, 23, 4, '#668958');
      roundRect(pipe.x - 3, upper ? top - 21 : bottom + 2, w + 6, 17, 3, '#96b77d');
      ctx.fillStyle = '#c1d49a88'; ctx.fillRect(pipe.x + 2, upper ? top - 19 : bottom + 4, w + 1, 3);
    }
  }
  function drawBird(x, y, scale = 1, rotation = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(scale, scale);
    ctx.fillStyle = '#dd7446'; ctx.beginPath(); ctx.moveTo(-15, 1); ctx.lineTo(-27, -6); ctx.lineTo(-23, 7); ctx.lineTo(-12, 10); ctx.fill();
    ctx.fillStyle = '#efac59'; ctx.beginPath(); ctx.ellipse(0, 0, 19, 16, -.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f8d486'; ctx.beginPath(); ctx.ellipse(5, 6, 12, 10, -.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#de814a'; ctx.beginPath(); ctx.ellipse(-10, 4 + Math.sin(elapsed * 16) * 2, 11, 6, -.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffbee'; ctx.beginPath(); ctx.ellipse(9, -5, 7, 8, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b4238'; ctx.beginPath(); ctx.arc(12, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(13, -6, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dc7043'; ctx.beginPath(); ctx.moveTo(16, 1); ctx.lineTo(27, 4); ctx.lineTo(16, 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d18445'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -15); ctx.quadraticCurveTo(-6, -23, -11, -20); ctx.moveTo(0, -15); ctx.quadraticCurveTo(2, -23, -2, -22); ctx.stroke();
    ctx.restore();
  }
  function update(dt) {
    if (state !== 'playing') return;
    bird.velocity += 820 * dt; bird.y += bird.velocity * dt;
    bird.rotation = Math.max(-.4, Math.min(1.2, bird.velocity / 550));
    spawn += dt;
    const gap = Math.min(165, height * .37), speed = Math.min(205, 153 + score * 1.6);
    if (spawn >= 1.85) { spawn = 0; pipes.push({ x: width + 10, gap, center: 65 + gap / 2 + Math.random() * (ground() - gap - 115), passed: false }); }
    for (const pipe of pipes) {
      pipe.x -= speed * dt;
      if (!pipe.passed && pipe.x + 60 < bird.x - 15) { pipe.passed = true; score++; $('score').textContent = score; tone(920, .15); }
      if (bird.x + 14 > pipe.x - 5 && bird.x - 14 < pipe.x + 65 && (bird.y - 12 < pipe.center - pipe.gap / 2 || bird.y + 12 > pipe.center + pipe.gap / 2)) { end(); return; }
    }
    pipes = pipes.filter(p => p.x > -80);
    if (bird.y + 14 >= ground() || bird.y - 14 <= 0) end();
  }
  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000 || 0, .035); lastTime = now;
    if (state !== 'paused') elapsed += dt;
    update(dt); landscape();
    if (state === 'ready') {
      // Keep the opening scene open and uncluttered around the title.
      drawPipe({ x: width < 600 ? -34 : 72, center: height * .46, gap: height * .6 });
      drawPipe({ x: width - (width < 600 ? 25 : 115), center: height * .57, gap: height * .58 });
      drawBird(width * (width < 600 ? .5 : .23), height * (width < 600 ? .78 : .47) + Math.sin(elapsed * 2.5) * 7, width < 600 ? 1 : 1.2, -.12);
    } else {
      pipes.forEach(drawPipe);
      if (state !== 'over') drawBird(bird.x, bird.y, 1, bird.rotation);
    }
    for (const p of particles) {
      if (state !== 'paused') { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = '#fff8d9'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; particles = particles.filter(p => p.life > 0);
    requestAnimationFrame(frame);
  }
  $('play').addEventListener('click', e => { e.stopPropagation(); $('play').blur(); state === 'paused' ? pause() : start(); });
  $('playfield').addEventListener('pointerdown', e => { if (e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return; e.preventDefault(); action(); });
  $('pause').addEventListener('click', e => { e.stopPropagation(); $('pause').blur(); pause(); });
  $('sound').addEventListener('click', () => {
    sound = !sound; $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', sound ? 'Turn sound off' : 'Turn sound on');
    $('sound-wave').setAttribute('d', sound ? 'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14' : 'm16 9 6 6m0-6-6 6'); tone(700, .1);
  });
  window.addEventListener('keydown', e => {
    if (e.target.closest('button, a, input, textarea, select')) return;
    if (['Space', 'ArrowUp', 'KeyP', 'KeyR'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') action();
    if (e.code === 'KeyP') pause();
    if (e.code === 'KeyR') start();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); });
  window.addEventListener('resize', resize);
  resize(); reset(); requestAnimationFrame(frame);
})();
