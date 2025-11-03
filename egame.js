GitHub Copilot Chat Assistant

(()=>{
alert("JS Loaded");
// core scene setup
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.02, 0.01, 0.06);
scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
scene.fogDensity = 0.008;

const glow = new BABYLON.GlowLayer("glow", scene, { blurKernelSize: 32 });
glow.intensity = 0.36;

const camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 2.8, 9), scene);
camera.setTarget(BABYLON.Vector3.Zero());
camera.attachControl(canvas, true);

const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), scene); hemi.intensity = 0.35;
const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.3, -1, 0.2), scene); dir.position = new BABYLON.Vector3(0,8,8); dir.intensity = 0.45;

const ground = BABYLON.MeshBuilder.CreateGround("ground", { width:6, height:320 }, scene);
ground.position.z = 40;
const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
groundMat.emissiveColor = new BABYLON.Color3(0.2,0.05,0.3);
ground.material = groundMat;

// lane stripes
const laneMat = new BABYLON.StandardMaterial("laneMat", scene);
laneMat.emissiveColor = new BABYLON.Color3(0.1,0.9,0.1);
laneMat.alpha = 1.0;
const laneBoxes = [];
for(let i=0;i<60;i++){
  const b = BABYLON.MeshBuilder.CreateBox("lane"+i, { width:0.16, height:0.02, depth:3 }, scene);
  b.material = laneMat;
  b.position = new BABYLON.Vector3(0, 0.01, -i*3 + 12);
  laneBoxes.push(b);
}

// sounds (same filenames as before)
const switchSound = new Audio('switch.wav');
const passSound = new Audio('pass.mp3');
const gameOverSound = new Audio('gameover.mp3');
function unlockAudio(){
  [switchSound, passSound, gameOverSound].forEach(s=>{
    s.play().then(()=>{ s.pause(); s.currentTime = 0 }).catch(()=>{});
  });
}

// config
const CONFIG = {
  elements: ['water','lightning','fire'],
  colorsHex: ['#44aaff','#ffd24a','#ff6b4a'],
  spawnZ: -90,
  despawnZ: 16,
  baseSpeed: 1.0,
  gapMin: 10,
  speedIncreaseEvery: 1,
  leaderboardKey: 'elementShiftBest'
};
const color3 = CONFIG.colorsHex.map(h => BABYLON.Color3.FromHexString(h));

// state
let playerElementIndex = 0, playerColorIndex = 0, playerMesh = null;
const playerY = 1.2, playerZ = 4.2;
let running = false, score = 0, speed = CONFIG.baseSpeed, passesSinceSpeedUp = 0;
let objects = [];
let slowMotionUntil = 0;

// HUD refs
const scoreHud = document.getElementById('scoreHud');
const speedHud = document.getElementById('speedHud');
const hintText = document.getElementById('hintText');
const startUI = document.getElementById('startUI');
const gameOverUI = document.getElementById('gameOverUI');
const bestOnStart = document.getElementById('bestOnStart');

// show best
(function(){ const arr = JSON.parse(localStorage.getItem(CONFIG.leaderboardKey) || '[]'); const best = arr[0] || 0; bestOnStart.textContent = best ? "Best Score: " + best : "No best yet"; })();

// ---------- Element model functions (complete) ----------

// Water blob (wobbling sphere)
function makeWater(name, size=1.0){
  const mat = new BABYLON.StandardMaterial("watMat_"+name, scene);
  mat.diffuseColor = new BABYLON.Color3(0.12,0.5,0.9);
  mat.specularPower = 64;
  mat.alpha = 0.85;
  mat.emissiveColor = new BABYLON.Color3(0.05,0.15,0.25);

  const sph = BABYLON.MeshBuilder.CreateSphere(name, { diameter: size, segments: 32 }, scene);
  sph.material = mat;
  sph._wobbleAmp = 0.06 * size;
  sph._wobbleSpeed = 0.003 + Math.random()*0.002;
  sph.registerBeforeRender(()=>{
    const t = performance.now();
    const s = 1 + Math.sin(t * sph._wobbleSpeed) * sph._wobbleAmp;
    sph.scaling.y = s;
    sph.scaling.x = 1 + Math.cos(t * sph._wobbleSpeed * 1.3) * sph._wobbleAmp*0.8;
    sph.scaling.z = 1 + Math.cos(t * sph._wobbleSpeed * 0.9) * sph._wobbleAmp*0.8;
  });
  return sph;
}

// Fire cone + embers
function makeFire(name, size=1.0){
  const mat = new BABYLON.StandardMaterial("firMat_"+name, scene);
  mat.diffuseColor = new BABYLON.Color3(0.6,0.2,0.05);
  mat.emissiveColor = new BABYLON.Color3(1.0,0.45,0.12);
  mat.alpha = 0.92;

  const cone = BABYLON.MeshBuilder.CreateCylinder(name, { diameterTop: 0.02, diameterBottom: size, height: size*1.4, tessellation: 24 }, scene);
  cone.rotation.x = Math.PI;
  cone.material = mat;
  cone._flicker = { amp: 0.05, speed: 0.012 + Math.random()*0.01 };
  cone.registerBeforeRender(()=>{
    const t = performance.now();
    const f = 1 + Math.sin(t * cone._flicker.speed) * cone._flicker.amp;
    cone.scaling.x = f; cone.scaling.z = f; cone.scaling.y = 1 + Math.cos(t * cone._flicker.speed * 1.5) * cone._flicker.amp * 0.6;
  });

  const ps = new BABYLON.ParticleSystem("embers_"+name, 100, scene);
  ps.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
  ps.emitter = cone;
  ps.minEmitBox = new BABYLON.Vector3(0, cone.getBoundingInfo().boundingBox.extendSize.y*0.2, 0);
  ps.maxEmitBox = new BABYLON.Vector3(0, cone.getBoundingInfo().boundingBox.extendSize.y*0.6, 0);
  ps.color1 = new BABYLON.Color4(1,0.6,0.1,1.0);
  ps.color2 = new BABYLON.Color4(1,0.2,0.05,1.0);
  ps.minSize = 0.02*size; ps.maxSize = 0.08*size;
  ps.minLifeTime = 0.4; ps.maxLifeTime = 1.1;
  ps.emitRate = 30;
  ps.direction1 = new BABYLON.Vector3(-0.2,1,0); ps.direction2 = new BABYLON.Vector3(0.2,1,0);
  ps.minEmitPower = 0.5; ps.maxEmitPower = 1.4;
  ps.gravity = new BABYLON.Vector3(0,0,0);
  ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  ps.start();

  return cone;
}

// Lightning bolt (tube) + halo
function makeLightning(name, size=1.0){
  const pts = [];
  const segments = 6;
  for(let i=0;i<segments;i++){
    const x = (Math.random()*2-1) * 0.25 * (1 - i/segments) * size;
    const y = -size*0.6 + (i/segments) * size*1.2;
    pts.push(new BABYLON.Vector3(x,y,0));
  }
  const bolt = BABYLON.MeshBuilder.CreateTube(name, { path: pts, radius: 0.06*size, tessellation: 6 }, scene);
  const mat = new BABYLON.StandardMaterial("litMat_"+name, scene);
  mat.emissiveColor = new BABYLON.Color3(0.95,0.96,1.0);
  mat.diffuseColor = new BABYLON.Color3(0.2,0.3,0.9);
  mat.specularPower = 64;
  bolt.material = mat;

  const halo = bolt.clone(name + "_halo");
  halo.scaling.multiplyInPlace(new BABYLON.Vector3(1.5,1.3,1.5));
  const hmat = new BABYLON.StandardMaterial("hmat_"+name, scene);
  hmat.emissiveColor = new BABYLON.Color3(0.6,0.7,1.0);
  hmat.alpha = 0.18;
  halo.material = hmat;

  bolt._flick = { speed: 0.01 + Math.random()*0.02 };
  bolt.registerBeforeRender(()=>{
    const t = performance.now();
    const s = 1 + Math.sin(t * bolt._flick.speed) * 0.03;
    bolt.scaling.y = s;
    halo.scaling.y = s * 1.15;
  });

  return bolt;
}

// ---------- Player creation ----------
function createPlayer(){
  if(playerMesh){
    try{ playerMesh.dispose(); }catch(e){}
  }

  const el = CONFIG.elements[playerElementIndex];
  const size = 0.9;
  let mesh = null;

  if(el === 'water') mesh = makeWater("player_water", size);
  else if(el === 'fire') mesh = makeFire("player_fire", size);
  else mesh = makeLightning("player_light", size*0.9);

  // apply color tint to emissive
  const col = color3[playerColorIndex];
  if(mesh && mesh.material){
    // guard in case material.emissiveColor is undefined for some meshes
    const baseEm = mesh.material.emissiveColor || new BABYLON.Color3(0,0,0);
    mesh.material.emissiveColor = baseEm.add(col.scale(0.35));
  }

  mesh.position = new BABYLON.Vector3(0, playerY, playerZ);
  playerMesh = mesh;

  // small shadow disc
  const disc = BABYLON.MeshBuilder.CreateDisc("disc_shadow", { radius: 0.8, tessellation: 32 }, scene);
  const dmat = new BABYLON.StandardMaterial("dmat_shadow", scene);
  dmat.diffuseColor = new BABYLON.Color3(0,0,0); dmat.alpha = 0.12;
  disc.material = dmat;
  disc.position = new BABYLON.Vector3(0, 0.02, playerZ + 0.35);
  disc.rotation.x = Math.PI/2;
}

createPlayer();

// ---------- Portal gate creation ----------
function createPortalGate(elementName, colorIndex){
  const ring = BABYLON.MeshBuilder.CreateTorus("portal_"+Math.random().toString(36).slice(2), { diameter: 3.2, thickness: 0.22, tessellation: 48 }, scene);
  const rm = new BABYLON.StandardMaterial("portalMat_"+Math.random().toString(36).slice(2), scene);
  rm.emissiveColor = color3[colorIndex].scale(0.8);
  ring.material = rm;
  ring.rotation.x = Math.PI/2;
  ring._spin = 0.0006 + Math.random() * 0.0009;
  ring.registerBeforeRender(()=>{ ring.rotation.z += ring._spin * 0.9; });

  let inner;
  if(elementName === 'water') inner = makeWater("inner_"+Math.random().toString(36).slice(2), 1.1);
  else if(elementName === 'fire') inner = makeFire("innerf_"+Math.random().toString(36).slice(2), 1.0);
  else inner = makeLightning("innerl_"+Math.random().toString(36).slice(2), 0.9);

  inner.position = new BABYLON.Vector3(0, 0.6, 0);
  inner.rotation.y = Math.random() * Math.PI * 2;
  if(inner.material){
    const baseEm = inner.material.emissiveColor || new BABYLON.Color3(0,0,0);
    inner.material.emissiveColor = baseEm.add(color3[colorIndex].scale(0.35));
  }

  const holder = new BABYLON.TransformNode("holder_"+Math.random().toString(36).slice(2), scene);
  ring.parent = holder;
  inner.parent = holder;
  holder.position = new BABYLON.Vector3((Math.random() * 0.8 - 0.4), 1.0, CONFIG.spawnZ - Math.random() * 6);

  holder._rotSpeed = 0.002 + Math.random() * 0.003;
  holder.registerBeforeRender(()=>{
    holder.rotation.y += holder._rotSpeed;
    holder.position.y = 1.0 + Math.sin(performance.now() * 0.001 + holder._rotSpeed * 100) * 0.12;
  });

  return { mesh: holder, type: 'gate', element: elementName, colorIndex: colorIndex, passed: false };
}

// helper cleanup
function clearObjects(){
  for(const o of objects){
    try{ o.mesh.dispose(); }catch(e){}
  }
  objects = [];
}
function farthestZ(){ if(objects.length===0) return -9999; return Math.max(...objects.map(o=>o.mesh.position.z)); }

// spawn logic
function spawnGate(){
  const far = farthestZ();
  if(far > CONFIG.spawnZ + -CONFIG.gapMin/2) return;
  const el = CONFIG.elements[Math.floor(Math.random()*CONFIG.elements.length)];
  const colorIndex = Math.floor(Math.random()*CONFIG.colorsHex.length);
  const gate = createPortalGate(el, colorIndex);
  objects.push(gate);
}

function spawnLoop(){
  if(!running) return;
  spawnGate();
  // randomize spawn interval slightly
  setTimeout(spawnLoop, 900 + Math.random() * 700);
}

// ---------- Controls ----------
const leftZone = document.getElementById('leftZone'), rightZone = document.getElementById('rightZone');
function leftTap(){ if(!running) return; playerElementIndex = (playerElementIndex + 1) % CONFIG.elements.length; createPlayer(); fadeHint(); try{ switchSound.currentTime = 0; switchSound.play(); }catch(e){} }
function rightTap(){ if(!running) return; playerColorIndex = (playerColorIndex + 1) % CONFIG.colorsHex.length; createPlayer(); fadeHint(); try{ switchSound.currentTime = 0; switchSound.play(); }catch(e){} }
if(leftZone) leftZone.addEventListener('pointerdown', leftTap);
if(rightZone) rightZone.addEventListener('pointerdown', rightTap);
window.addEventListener('keydown', (e)=>{ if(!running) return; if(e.key==='a'||e.key==='ArrowLeft') leftTap(); if(e.key==='d'||e.key==='ArrowRight') rightTap(); });

function fadeHint(){ if(hintText) { hintText.style.opacity = '0.3'; setTimeout(()=>hintText.style.opacity='1', 1600); } }

// HUD helpers
function setScore(v){ score = v; if(scoreHud) scoreHud.textContent = 'Score: ' + score; }
function setSpeedHUD(val){ if(speedHud) speedHud.textContent = 'Speed: ' + (val.toFixed(2)); }

// ---------- Main loop ----------
let last = performance.now();
function frame(){
  const now = performance.now();
  const dtRaw = (now - last) / 1000;
  last = now;
  const timeScale = (slowMotionUntil && slowMotionUntil > now) ? 0.35 : 1.0;
  const dt = dtRaw * timeScale;

  // lane motion
  for(const b of laneBoxes){
    b.position.z += dt * speed * 12;
    if(b.position.z > 24) b.position.z = -120 + Math.random()*8;
  }

  // move gates forward & collision
  for(let i = objects.length - 1; i >= 0; i--){
    const o = objects[i];
    o.mesh.position.z += dt * speed * 12;

    if(!o.passed && o.mesh.position.z >= playerZ - 0.6 && o.mesh.position.z < playerZ + 0.8){
      if(o.type === 'gate'){
        const matchEl = (o.element === CONFIG.elements[playerElementIndex]);
        const matchColor = (o.colorIndex === playerColorIndex);
        if(matchEl && matchColor){
          setScore(score + 1);
          try{ passSound.currentTime = 0; passSound.play(); }catch(e){}
          o.passed = true;
          try{ o.mesh.dispose(); }catch(e){}
          objects.splice(i,1);
          passesSinceSpeedUp++;
          if(passesSinceSpeedUp >= CONFIG.speedIncreaseEvery){
            passesSinceSpeedUp = 0; speed += 0.2; pulseHUDOnSpeedIncrease();
          }
          continue;
        } else {
          try{ gameOverSound.currentTime = 0; gameOverSound.play(); }catch(e){}
          return triggerGameOver();
        }
      }
    }

    if(o.mesh.position.z > CONFIG.despawnZ + 4){
      try{ o.mesh.dispose(); }catch(e){}
      objects.splice(i,1);
    }
  }

  // slight bob on player
  if(playerMesh) playerMesh.position.y = playerY + Math.sin(now*0.0025) * 0.06;

  setSpeedHUD(speed);
  scene.render();
  if(running) requestAnimationFrame(frame);
}

// HUD pulse
function pulseHUDOnSpeedIncrease(){ if(speedHud){ speedHud.style.transition = 'transform 0.28s ease'; speedHud.style.transform = 'scale(1.15)'; setTimeout(()=>speedHud.style.transform='scale(1)',280); } }

// game over
function triggerGameOver(){
  running = false;
  slowMotionUntil = performance.now() + 700;
  const startZ = camera.position.z, targetZ = startZ + 2.2;
  const startTime = performance.now();
  const duration = 700;
  (function zoomStep(){
    const t = (performance.now() - startTime) / duration;
    if(t < 1){
      camera.position.z = startZ + (targetZ - startZ) * easeOutCubic(t);
      requestAnimationFrame(zoomStep);
    } else {
      camera.position.z = startZ;
      showGameOverUI();
    }
  })();
}
function easeOutCubic(t){ return (--t)*t*t + 1; }
function showGameOverUI(){
  const key = CONFIG.leaderboardKey;
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(score); arr.sort((a,b)=>b-a); const top = arr.slice(0,5);
  localStorage.setItem(key, JSON.stringify(top));
  const finalScoreEl = document.getElementById('finalScore');
  const bestScoreEl = document.getElementById('bestScore');
  if(finalScoreEl) finalScoreEl.textContent = String(score);
  if(bestScoreEl) bestScoreEl.textContent = String(top[0] || score);
  if(gameOverUI) gameOverUI.style.display = 'flex';
}

// start/reset
function startGame(){
  unlockAudio();
  clearObjects();
  score = 0; setScore(0); speed = CONFIG.baseSpeed; passesSinceSpeedUp = 0; slowMotionUntil = 0;
  playerElementIndex = 0; playerColorIndex = 0;
  createPlayer();
  if(startUI) startUI.style.display = 'none';
  if(gameOverUI) gameOverUI.style.display = 'none';
  running = true;
  last = performance.now();
  // start spawning and main loop
  setTimeout(spawnLoop, 600);
  requestAnimationFrame(frame);
}

// UI wiring
const playBtn = document.getElementById('playBtn');
if(playBtn) playBtn.addEventListener('click', startGame);

const howBtn = document.getElementById('howBtn');
if(howBtn) howBtn.addEventListener('click', ()=> alert('Tap left half to cycle element (Water → Lightning → Fire). Tap right half to cycle color. Match both element and color to pass gates.'));

const retryBtn = document.getElementById('retryBtn');
if(retryBtn) retryBtn.addEventListener('click', ()=> { if(gameOverUI) gameOverUI.style.display = 'none'; startGame(); });

const homeBtn = document.getElementById('homeBtn');
if(homeBtn) homeBtn.addEventListener('click', ()=> { if(gameOverUI) gameOverUI.style.display = 'none'; if(startUI) startUI.style.display = 'flex'; });

// initial idle render
engine.runRenderLoop(()=>{ if(!running) scene.render(); });
window.addEventListener('resize', ()=> engine.resize());
canvas.tabIndex = 0;

})();