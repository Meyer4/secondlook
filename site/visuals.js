/* Prism visuals: local preferences, projected 3D canvas, capped foreground motion.
   Decorative only. This is not a live threat feed or background message monitor. */
export function bootVisuals() {
  if (document.documentElement.dataset.visualsReady) return;
  document.documentElement.dataset.visualsReady = 'true';
  const root = document.documentElement;
  const key = 'secondlook:appearance:v1';
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let preferences = { theme: 'system', motion: true };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (saved && typeof saved === 'object') {
      if (['light', 'dark', 'system'].includes(saved.theme)) preferences.theme = saved.theme;
      if (typeof saved.motion === 'boolean') preferences.motion = saved.motion;
    }
  } catch { /* The sandbox/private browser may block storage. */ }
  const background = document.getElementById('ambient-canvas');
  const hero = document.getElementById('prism-canvas');
  const bg = background?.getContext('2d');
  const gl = hero?.getContext('2d');
  let dark = false, running = false, raf = 0, last = -1000, time = 0;
  let width = innerWidth, height = innerHeight, pointer = { x: 0, y: 0 };
  const nodes = Array.from({ length: 22 }, (_, i) => ({ x: ((i * 0.61803398875) % 1), y: ((i * 0.41421356 + 0.17) % 1), phase: i * 1.7 }));
  const themeButton = document.getElementById('theme-toggle');
  const motionButton = document.getElementById('motion-toggle');
  function save() { try { localStorage.setItem(key, JSON.stringify(preferences)); } catch {} }
  function effectiveMotion() { return preferences.motion && !reduced.matches && !document.hidden; }
  function apply() {
    dark = preferences.theme === 'dark' || preferences.theme === 'system' && systemDark.matches;
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.motion = preferences.motion && !reduced.matches ? 'on' : 'off';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0c1530' : '#eaf0fc');
    if (themeButton) {
      themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.querySelector('.control-glyph').textContent = dark ? '☀' : '☾';
      themeButton.querySelector('.control-label').textContent = dark ? 'Light' : 'Dark';
    }
    if (motionButton) {
      motionButton.disabled = reduced.matches;
      motionButton.setAttribute('aria-pressed', String(preferences.motion && !reduced.matches));
      motionButton.setAttribute('aria-label', reduced.matches ? 'Motion disabled by your reduced-motion preference' : preferences.motion ? 'Pause background motion' : 'Enable background motion');
      motionButton.querySelector('.control-label').textContent = reduced.matches ? 'Reduced' : preferences.motion ? 'Motion on' : 'Motion off';
      motionButton.querySelector('.control-glyph').textContent = preferences.motion && !reduced.matches ? 'Ⅱ' : '▷';
    }
    restart();
  }
  themeButton?.addEventListener('click', () => { preferences.theme = dark ? 'light' : 'dark'; save(); apply(); });
  motionButton?.addEventListener('click', () => { if (!reduced.matches) preferences.motion = !preferences.motion; save(); apply(); });
  systemDark.addEventListener('change', apply);
  reduced.addEventListener('change', apply);
  function size() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    if (background && bg) { background.width = Math.round(width * ratio); background.height = Math.round(height * ratio); bg.setTransform(ratio, 0, 0, ratio, 0, 0); }
    if (hero && gl) { hero.width = 720; hero.height = 540; gl.setTransform(2, 0, 0, 2, 0, 0); }
    draw();
  }
  function backdrop() {
    if (!bg) return;
    bg.clearRect(0, 0, width, height);
    const waves = [
      { x: .18 + Math.sin(time * .17) * .08, y: .18, r: .52, color: dark ? '94,82,239' : '126,132,255' },
      { x: .88, y: .35 + Math.cos(time * .13) * .12, r: .42, color: dark ? '32,161,212' : '69,204,227' },
      { x: .57 + Math.sin(time * .12) * .09, y: .96, r: .40, color: dark ? '201,87,144' : '245,156,173' },
    ];
    waves.forEach(wave => {
      const x = width * wave.x, y = height * wave.y, radius = Math.max(width, height) * wave.r;
      const gradient = bg.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${wave.color},${dark ? .15 : .18})`); gradient.addColorStop(1, `rgba(${wave.color},0)`);
      bg.fillStyle = gradient; bg.fillRect(0, 0, width, height);
    });
    const count = width < 650 ? 12 : nodes.length;
    for (let i = 0; i < count; i++) {
      const point = nodes[i]; const x = point.x * width + Math.sin(time * .10 + point.phase) * 15; const y = point.y * height + Math.cos(time * .09 + point.phase) * 12;
      bg.fillStyle = dark ? 'rgba(157,183,240,.25)' : 'rgba(87,116,188,.19)'; bg.beginPath(); bg.arc(x, y, i % 4 === 0 ? 1.7 : .9, 0, Math.PI * 2); bg.fill();
      if (i % 3 === 0) { bg.strokeStyle = dark ? 'rgba(153,185,239,.065)' : 'rgba(98,121,185,.09)'; bg.lineWidth = .7; bg.beginPath(); bg.moveTo(x, y); bg.lineTo(x + 34, y - 20); bg.lineTo(x + 63, y + 4); bg.stroke(); }
    }
  }
  function project(x, y, z, ry, rx) {
    const x1 = x * Math.cos(ry) + z * Math.sin(ry), z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    const y1 = y * Math.cos(rx) - z1 * Math.sin(rx), z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
    const scale = 440 / (440 + z2);
    return { x: 182 + x1 * scale, y: 123 + y1 * scale, z: z2 };
  }
  function polygon(points, fill, stroke, lineWidth = 1) {
    gl.beginPath(); points.forEach((p, i) => i ? gl.lineTo(p.x, p.y) : gl.moveTo(p.x, p.y)); gl.closePath();
    if (fill) { gl.fillStyle = fill; gl.fill(); } if (stroke) { gl.strokeStyle = stroke; gl.lineWidth = lineWidth; gl.stroke(); }
  }
  function scene() {
    if (!gl) return;
    gl.clearRect(0, 0, 360, 270);
    const ry = .30 + Math.sin(time * .26) * .13 + pointer.x * .16, rx = -.16 + Math.cos(time * .21) * .06 + pointer.y * .09;
    const aura = gl.createRadialGradient(190, 117, 10, 190, 117, 143); aura.addColorStop(0, dark ? '#7771f046' : '#aaa3ff58'); aura.addColorStop(1, '#aaa3ff00');gl.fillStyle = aura;gl.fillRect(0,0,360,270);
    // A perspective-projected orbit passes behind and in front of the glass token.
    function ring(front) {
      const pieces = [];
      for (let i = 0; i <= 90; i++) {
        const angle = i / 90 * Math.PI * 2 + time * .055;
        const x = 120 * Math.cos(angle), y = 65 * Math.sin(angle), z = 60 * Math.sin(angle);
        const p = project(x, y, z, -.3, .4); pieces.push(p);
      }
      gl.lineWidth = 1.2; gl.strokeStyle = front ? (dark ? '#f1aace85' : '#af67bc78') : (dark ? '#8ecdef38' : '#708bbf48');
      gl.beginPath(); let joined = false;
      pieces.forEach(p => { const visible = front ? p.z < 0 : p.z >= 0; if (visible) { if (!joined) gl.moveTo(p.x,p.y); else gl.lineTo(p.x,p.y); joined = true; } else joined = false; });gl.stroke();
    }
    ring(false);
    // Floating UI plates add spatial layers without representing real messages.
    function plate(x, y, rotation, color) {
      gl.save(); gl.translate(x, y); gl.rotate(rotation);
      const fill = gl.createLinearGradient(0,0,95,50);fill.addColorStop(0,dark?'#263864ed':'#ffffffed');fill.addColorStop(1,dark?'#192647e8':'#e3eafce8');
      gl.fillStyle=fill;gl.strokeStyle=dark?'#8198d673':'#a5b4dfb0';gl.lineWidth=1;gl.beginPath();gl.roundRect(0,0,95,53,11);gl.fill();gl.stroke();
      gl.fillStyle=color;gl.beginPath();gl.roundRect(11,12,19,19,6);gl.fill();gl.strokeStyle=dark?'#8fa8d0':'#8795bc';gl.lineWidth=3;gl.lineCap='round';gl.beginPath();gl.moveTo(39,17);gl.lineTo(78,17);gl.moveTo(39,25);gl.lineTo(66,25);gl.moveTo(13,41);gl.lineTo(70,41);gl.stroke();gl.restore();
    }
    plate(25,149+Math.sin(time*.4)*3,-.16,'#9f8ced');plate(242,140+Math.cos(time*.37)*4,.15,'#71c7de');
    const contour = [];
    for(let corner=0;corner<4;corner++) {
      const centers=[[-34,-39],[34,-39],[34,39],[-34,39]];
      for(let step=0;step<=8;step++) {
        const angle=Math.PI+(corner*Math.PI/2)+step/8*Math.PI/2;
        contour.push({x:centers[corner][0]+22*Math.cos(angle), y:centers[corner][1]+22*Math.sin(angle)});
      }
    }
    const front=contour.map(p=>project(p.x,p.y,22,ry,rx)),back=contour.map(p=>project(p.x,p.y,-3,ry,rx));
    const drop=front.map(p=>({x:p.x+8,y:p.y+16}));polygon(drop,dark?'#01082440':'#6d74b41b',null);
    polygon(back,dark?'#738bdd99':'#a8ccebaa',dark?'#ccceff75':'#bcc6ee',1.2);
    for(let i=0;i<front.length;i++) {
      const j=(i+1)%front.length;
      polygon([back[i],back[j],front[j],front[i]], i<16?'#ababe7aa':'#67aacfb0',null);
    }
    const glass=gl.createLinearGradient(120,50,238,195);glass.addColorStop(0,dark?'#d7cfff':'#ffffff');glass.addColorStop(.32,dark?'#b1b8f5':'#e2d6fd');glass.addColorStop(.68,dark?'#89ccea':'#a9dcef');glass.addColorStop(1,dark?'#c6a4e6':'#ecc6e0');
    polygon(front,glass,dark?'#e0e8ffb0':'#ffffffdf',1.6);
    const shine=contour.map(p=>project(p.x*.91,p.y*.91,23,ry,rx));polygon(shine,null,'#ffffff65',.8);
    // The eye is embossed on the projected front face.
    const eye=[];
    for(let i=0;i<=32;i++){const a=i/32*Math.PI;eye.push(project(-35+70*i/32,-21*Math.sin(a),24,ry,rx));}
    for(let i=32;i>=0;i--){const a=i/32*Math.PI;eye.push(project(-35+70*i/32,21*Math.sin(a),24,ry,rx));}
    polygon(eye,null,'#344c8c',2.4);
    const pupil=[];for(let i=0;i<40;i++){const a=i/40*Math.PI*2;pupil.push(project(11*Math.cos(a),11*Math.sin(a),25,ry,rx));}polygon(pupil,'#354b88',null);
    const spark=project(3,-4,27,ry,rx);gl.fillStyle='#eff9ff';gl.beginPath();gl.arc(spark.x,spark.y,3,0,Math.PI*2);gl.fill();
    ring(true);
    [[76,63],[290,87],[256,226]].forEach(([x,y],i)=>{gl.strokeStyle=['#8877d9','#27a9c6','#d983b3'][i];gl.lineWidth=1.5;gl.beginPath();gl.moveTo(x-4,y);gl.lineTo(x+4,y);gl.moveTo(x,y-4);gl.lineTo(x,y+4);gl.stroke();});
  }
  function draw() { backdrop(); scene(); }
  function frame(timestamp) {
    if (!running) return;
    if (timestamp - last >= 1000 / 24) { const delta = last < 0 ? 0 : Math.min((timestamp-last)/1000,.1);time += delta;last=timestamp;draw(); }
    raf=requestAnimationFrame(frame);
  }
  function restart() {
    cancelAnimationFrame(raf);running=effectiveMotion();root.dataset.animating=running?'true':'false';last=-1000;draw();if(running)raf=requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',restart);
  addEventListener('resize',size,{passive:true});
  if(matchMedia('(pointer:fine)').matches)document.addEventListener('pointermove',event=>{
    if(!effectiveMotion())return;pointer.x=(event.clientX/innerWidth-.5)*2;pointer.y=(event.clientY/innerHeight-.5)*2;
  },{passive:true});
  size();apply();
}
