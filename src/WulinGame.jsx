import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import './wulinGame.css';

const WORLD = {width: 18, height: 10, ground: 0.65, launch: new THREE.Vector2(-7.35, 2.1)};
const STEP = 1 / 60;
const MAX_SHOTS = 5;

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function canvasTexture(draw, width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function woodTexture() {
  return canvasTexture((ctx, width, height) => {
    ctx.fillStyle = '#8e4d2d';
    ctx.fillRect(0, 0, width, height);
    for (let y = 10; y < height; y += 21) {
      ctx.strokeStyle = y % 42 === 10 ? '#c27b44' : '#6b321f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * .25, y - 8, width * .5, y + 8, width, y - 2);
      ctx.stroke();
    }
    for (let i = 0; i < 28; i += 1) {
      ctx.fillStyle = 'rgba(35, 17, 11, .18)';
      ctx.fillRect((i * 71) % width, (i * 43) % height, 3, 8);
    }
    ctx.strokeStyle = 'rgba(255, 224, 158, .35)';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, width - 8, height - 8);
  });
}

function flagTexture() {
  return canvasTexture((ctx, width, height) => {
    ctx.fillStyle = '#b7352d';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f6d37c';
    ctx.font = 'bold 74px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('逍遥', width / 2, height / 2 - 8);
    ctx.font = 'bold 23px sans-serif';
    ctx.fillText('弹指神通', width / 2, height - 25);
  }, 256, 192);
}

function makeTextSprite(text, color = '#f6d37c', size = 32) {
  const texture = canvasTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.font = `700 ${size}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(17, 12, 25, .65)';
    ctx.shadowBlur = 9;
    ctx.fillStyle = color;
    ctx.fillText(text, width / 2, height / 2);
  }, 512, 128);
  const material = new THREE.SpriteMaterial({map: texture, transparent: true, depthWrite: false});
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.6, .65, 1);
  return sprite;
}

function makeFigure(color, accent) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .52, 4, 8), new THREE.MeshStandardMaterial({color, roughness: .7}));
  body.position.y = .64;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10), new THREE.MeshStandardMaterial({color: '#f1bd91', roughness: .8}));
  head.position.y = 1.16;
  group.add(head);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(.34, .18, 6), new THREE.MeshStandardMaterial({color: accent, roughness: .6}));
  hat.position.y = 1.4;
  group.add(hat);
  return group;
}

function worldFromPointer(event, element, camera) {
  const rect = element.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  const viewWidth = camera.right - camera.left;
  const viewHeight = camera.top - camera.bottom;
  return new THREE.Vector2(camera.left + x * viewWidth + camera.position.x, camera.bottom + (1 - y) * viewHeight + camera.position.y);
}

function makeBeam(scene, texture, config) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(config.size.x, config.size.y, .42),
    new THREE.MeshStandardMaterial({map: texture, roughness: .82, metalness: .02})
  );
  mesh.position.set(config.pos.x, config.pos.y, config.z ?? 0);
  mesh.rotation.z = config.angle ?? 0;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return {...config, mesh, velocity: new THREE.Vector2(), angularVelocity: 0, dynamic: false, broken: false, integrity: config.integrity ?? 1, maxIntegrity: config.integrity ?? 1};
}

function makeTarget(scene, config) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .54, 4, 8), new THREE.MeshStandardMaterial({color: '#d85a3f', roughness: .7}));
  body.position.y = .34;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 10), new THREE.MeshStandardMaterial({color: '#eab486', roughness: .8}));
  head.position.y = .86;
  const sash = new THREE.Mesh(new THREE.BoxGeometry(.48, .13, .1), new THREE.MeshStandardMaterial({color: '#f1c765', roughness: .55}));
  sash.position.set(0, .45, -.18);
  group.add(body, head, sash);
  group.position.set(config.pos.x, config.pos.y, config.z ?? .1);
  group.castShadow = true;
  scene.add(group);
  return {...config, mesh: group, velocity: new THREE.Vector2(), angularVelocity: 0, dynamic: false, down: false, integrity: 1};
}

function makeParticles(scene, color, position, count = 12, spread = 1) {
  const particles = [];
  const material = new THREE.MeshBasicMaterial({color, transparent: true, opacity: .9});
  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.06 + Math.random() * .08, .06 + Math.random() * .12, .06), material.clone());
    mesh.position.set(position.x, position.y, .42 + Math.random() * .15);
    scene.add(mesh);
    particles.push({mesh, velocity: new THREE.Vector2((Math.random() - .5) * spread, Math.random() * spread), life: .55 + Math.random() * .55});
  }
  return particles;
}

function disposeObject(object) {
  object.traverse(node => {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach(material => { if (material.map) material.map.dispose(); material.dispose(); });
    }
  });
}

export default function WulinGame({onExit}) {
  const mountRef = useRef(null);
  const gameRef = useRef(null);
  const [phase, setPhase] = useState('ready');
  const [shots, setShots] = useState(MAX_SHOTS);
  const [score, setScore] = useState(0);
  const [style, setStyle] = useState('待入场');
  const [audience, setAudience] = useState(true);
  const [message, setMessage] = useState('拖住弹指石，瞄准木架，松手发射');
  const [best, setBest] = useState(() => Number(localStorage.getItem('wulin弹指最佳') || 0));

  const ui = {setPhase, setShots, setScore, setStyle, setMessage, setBest};

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#151127');
    const camera = new THREE.OrthographicCamera(-WORLD.width / 2, WORLD.width / 2, WORLD.height / 2, -WORLD.height / 2, .1, 100);
    camera.position.set(0, 4.65, 20);
    camera.lookAt(0, 4.65, 0);
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, powerPreference: 'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight('#ffd9a0', '#17112e', 2.4);
    scene.add(ambient);
    const moon = new THREE.DirectionalLight('#ffe4b4', 4.2);
    moon.position.set(-4, 9, 8);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    scene.add(moon);

    const wood = woodTexture();
    const flag = flagTexture();
    const objects = [];
    const targets = [];
    const particles = [];
    const crowd = [];
    const state = {
      phase: 'ready',
      shots: MAX_SHOTS,
      score: 0,
      style: '待入场',
      audience: true,
      dragging: false,
      pointer: new THREE.Vector2(),
      aim: new THREE.Vector2(1, .1),
      power: 0,
      projectile: null,
      accumulator: 0,
      last: performance.now(),
      elapsed: 0,
      shake: 0,
      eventLog: [],
      targetCount: 0,
      flagDown: false,
      audio: null,
    };

    function audioTone(frequency, duration = .08, type = 'triangle') {
      try {
        if (!state.audio) state.audio = new AudioContext();
        const oscillator = state.audio.createOscillator();
        const gain = state.audio.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, state.audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(.06, state.audio.currentTime + .01);
        gain.gain.exponentialRampToValueAtTime(.0001, state.audio.currentTime + duration);
        oscillator.connect(gain).connect(state.audio.destination);
        oscillator.start();
        oscillator.stop(state.audio.currentTime + duration + .02);
      } catch { /* Audio is optional and may be blocked until a gesture. */ }
    }

    function emit(type, payload = {}) {
      state.eventLog.push({type, time: state.elapsed, ...payload});
      if (state.eventLog.length > 40) state.eventLog.shift();
      if (type === 'success') ui.setMessage(payload.text || '漂亮！木架开始松动');
      if (type === 'mistake') ui.setMessage(payload.text || '这一下，弹指石也很尴尬');
      if (type === 'highlight') ui.setMessage(payload.text || '整活成功，围观弟子已经站起来了');
      if (type === 'highlight') state.shake = Math.max(state.shake, .14);
    }

    function buildBackdrop() {
      const gradient = canvasTexture((ctx, width, height) => {
        const g = ctx.createLinearGradient(0, 0, 0, height);
        g.addColorStop(0, '#171231');
        g.addColorStop(.52, '#3d2856');
        g.addColorStop(1, '#d07a58');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }, 4, 4);
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.width, WORLD.height), new THREE.MeshBasicMaterial({map: gradient}));
      sky.position.z = -2.5;
      scene.add(sky);
      const mountainMat = new THREE.MeshBasicMaterial({color: '#241a3f'});
      for (let i = 0; i < 8; i += 1) {
        const mountain = new THREE.Mesh(new THREE.ConeGeometry(1.3 + (i % 3) * .45, 3.2 + (i % 2) * 1.2, 4), mountainMat);
        mountain.position.set(-8 + i * 2.4, 1.6 + (i % 2) * .5, -1.9);
        mountain.rotation.y = Math.PI / 4;
        scene.add(mountain);
      }
      const ground = new THREE.Mesh(new THREE.BoxGeometry(WORLD.width, .7, 2.4), new THREE.MeshStandardMaterial({color: '#1d4b45', roughness: .9}));
      ground.position.set(0, .25, 0);
      ground.receiveShadow = true;
      scene.add(ground);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(WORLD.width, .08, 2.45), new THREE.MeshStandardMaterial({color: '#e6ae5a', roughness: .5}));
      trim.position.set(0, .64, .04);
      scene.add(trim);
      const pavilion = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, .18, 4), new THREE.MeshStandardMaterial({color: '#9a2f3c', roughness: .7}));
      pavilion.position.set(6.9, 5.9, -1.4);
      pavilion.rotation.y = Math.PI / 4;
      scene.add(pavilion);
      const sign = makeTextSprite('逍遥擂台', '#ffe7a3', 38);
      sign.position.set(6.9, 6.3, -1.2);
      sign.scale.set(2.3, .52, 1);
      scene.add(sign);
      for (let i = 0; i < 7; i += 1) {
        const figure = makeFigure(i % 2 ? '#435b83' : '#6c3f62', i % 2 ? '#d9a34e' : '#7fc5b1');
        figure.position.set(-7.9 + i * 1.1, .62, -1.1);
        figure.scale.setScalar(.78 + (i % 3) * .04);
        crowd.push(figure);
        scene.add(figure);
      }
    }

    function buildArena() {
      const base = new THREE.Mesh(new THREE.BoxGeometry(.8, .18, .8), new THREE.MeshStandardMaterial({color: '#493022', roughness: .85}));
      base.position.set(WORLD.launch.x, WORLD.ground + .09, .12);
      base.castShadow = true;
      scene.add(base);
      const sling = new THREE.Mesh(new THREE.TorusGeometry(.26, .045, 8, 18, Math.PI), new THREE.MeshStandardMaterial({color: '#e1b462', roughness: .55}));
      sling.position.set(WORLD.launch.x, WORLD.launch.y, .2);
      sling.rotation.z = Math.PI / 2;
      scene.add(sling);
      const pillarLeft = makeBeam(scene, wood, {id: 'pillar-left', pos: new THREE.Vector2(1.9, 2.05), size: new THREE.Vector2(.34, 2.8), integrity: 2, fixed: true});
      const pillarRight = makeBeam(scene, wood, {id: 'pillar-right', pos: new THREE.Vector2(6.0, 2.05), size: new THREE.Vector2(.34, 2.8), integrity: 2, fixed: true});
      const beamA = makeBeam(scene, wood, {id: 'beam-a', pos: new THREE.Vector2(3.95, 3.35), size: new THREE.Vector2(4.35, .34), integrity: 5, fixed: true, supportIds: ['pillar-left', 'pillar-right']});
      const beamB = makeBeam(scene, wood, {id: 'beam-b', pos: new THREE.Vector2(3.95, 4.7), size: new THREE.Vector2(3.35, .3), integrity: 4, fixed: true, supportIds: ['beam-a']});
      const beamC = makeBeam(scene, wood, {id: 'beam-c', pos: new THREE.Vector2(3.95, 5.68), size: new THREE.Vector2(2.1, .28), integrity: 3, fixed: true, supportIds: ['beam-b']});
      const jar = makeBeam(scene, wood, {id: 'jar', pos: new THREE.Vector2(2.9, 4.05), size: new THREE.Vector2(.48, .62), integrity: 2, fixed: true, supportIds: ['beam-a'], kind: 'jar'});
      const flagPole = makeBeam(scene, wood, {id: 'flag-pole', pos: new THREE.Vector2(5.75, 6.05), size: new THREE.Vector2(.11, 2.5), integrity: 2, fixed: true, supportIds: ['beam-c']});
      const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), new THREE.MeshStandardMaterial({map: flag, transparent: true, side: THREE.DoubleSide, roughness: .7}));
      flagMesh.position.set(5.15, 6.55, .4);
      flagMesh.castShadow = true;
      scene.add(flagMesh);
      const flagObj = {...flagPole, id: 'flag', mesh: flagMesh, size: new THREE.Vector2(1.4, 1.05), pos: new THREE.Vector2(5.15, 6.55), dynamic: false, integrity: 1, supportIds: ['beam-c'], isFlag: true};
      objects.push(pillarLeft, pillarRight, beamA, beamB, beamC, jar, flagPole, flagObj);
      const targetPositions = [new THREE.Vector2(2.65, 1.5), new THREE.Vector2(4.0, 1.5), new THREE.Vector2(5.2, 1.5)];
      targetPositions.forEach((pos, index) => { targets.push(makeTarget(scene, {id: `target-${index + 1}`, pos, size: new THREE.Vector2(.48, 1.1), supportIds: ['beam-a']})); });
      state.targetCount = targets.length;
      state.projectile = new THREE.Mesh(new THREE.SphereGeometry(.23, 20, 14), new THREE.MeshStandardMaterial({color: '#efc36d', roughness: .34, metalness: .2}));
      state.projectile.position.set(WORLD.launch.x, WORLD.launch.y, .36);
      state.projectile.castShadow = true;
      state.projectile.visible = false;
      scene.add(state.projectile);
      const tray = new THREE.Mesh(new THREE.BoxGeometry(1.15, .14, .55), new THREE.MeshStandardMaterial({color: '#682f32', roughness: .75}));
      tray.position.set(WORLD.launch.x + .2, WORLD.ground + .76, .08);
      tray.castShadow = true;
      scene.add(tray);
    }

    function resetArena() {
      objects.forEach(object => {
        object.broken = false;
        object.dynamic = false;
        object.integrity = object.maxIntegrity ?? object.integrity ?? 1;
        object.velocity.set(0, 0);
        object.angularVelocity = 0;
        object.mesh.visible = true;
        object.mesh.position.set(object.pos.x, object.pos.y, object.mesh.position.z);
        object.mesh.rotation.z = object.angle || 0;
      });
      targets.forEach(target => {
        target.down = false;
        target.dynamic = false;
        target.velocity.set(0, 0);
        target.mesh.visible = true;
        target.mesh.position.set(target.pos.x, target.pos.y, target.mesh.position.z);
        target.mesh.rotation.z = 0;
      });
      state.flagDown = false;
      state.projectile.visible = false;
      state.projectile.position.set(WORLD.launch.x, WORLD.launch.y, .36);
      state.projectile.rotation.set(0, 0, 0);
      particles.splice(0).forEach(particle => disposeObject(particle.mesh));
      state.shots = MAX_SHOTS;
      state.score = 0;
      state.style = '待入场';
      state.eventLog = [];
      state.elapsed = 0;
      ui.setShots(MAX_SHOTS);
      ui.setScore(0);
      ui.setStyle('待入场');
      ui.setMessage('拖住弹指石，瞄准木架，松手发射');
    }

    function startRound() {
      resetArena();
      state.phase = 'playing';
      ui.setPhase('playing');
      ui.setMessage('第一发：瞄准木架的支点');
      audioTone(392, .09);
    }

    function failRound() {
      if (state.phase !== 'playing') return;
      state.phase = 'defeat';
      state.style = '惨';
      ui.setPhase('defeat');
      ui.setStyle('惨');
      ui.setMessage('弹指石用尽，江湖暂时替木架松了口气');
      emit('mistake', {text: '这一下，弹指石也很尴尬'});
      audioTone(150, .18, 'sawtooth');
    }

    function winRound() {
      if (state.phase !== 'playing') return;
      state.phase = 'victory';
      const used = MAX_SHOTS - state.shots;
      const chainBonus = objects.filter(object => object.broken).length * 30;
      const remainingBonus = state.shots * 45;
      const finalScore = 300 + chainBonus + remainingBonus + (state.flagDown ? 100 : 0);
      state.score = finalScore;
      state.style = used <= 2 ? '稳' : state.eventLog.some(event => event.type === 'highlight') ? '整活' : '险';
      ui.setPhase('victory');
      ui.setScore(finalScore);
      ui.setStyle(state.style);
      const storedBest = Number(localStorage.getItem('wulin弹指最佳') || 0);
      if (finalScore > storedBest) {
        localStorage.setItem('wulin弹指最佳', String(finalScore));
        ui.setBest(finalScore);
      }
      ui.setMessage(state.style === '整活' ? '整活成功！逍遥旗和铜锣一起落地了' : '木架坍塌，逍遥派拿下开场胜利');
      emit('success', {text: '漂亮！木架开始松动'});
      audioTone(660, .12);
      setTimeout(() => audioTone(880, .14), 90);
    }

    function breakObject(object, impact = 1, text = '木梁断裂，连锁开始') {
      if (object.broken) return;
      object.integrity -= impact;
      if (object.integrity > 0) return;
      object.broken = true;
      object.dynamic = true;
      object.velocity.set((Math.random() - .5) * 2.4, .8 + Math.random() * 1.8);
      object.angularVelocity = (Math.random() - .5) * 2.6;
      state.score += 35;
      ui.setScore(state.score);
      particles.push(...makeParticles(scene, object.kind === 'jar' ? '#e5d3a3' : '#c87a45', object.mesh.position, object.kind === 'jar' ? 22 : 14, 2.6));
      state.shake = Math.max(state.shake, .08);
      audioTone(object.kind === 'jar' ? 240 : 180, .06, 'square');
      emit(object.kind === 'jar' ? 'highlight' : 'success', {text});
    }

    function knockTarget(target, impulse) {
      if (target.down) return;
      target.down = true;
      target.dynamic = true;
      target.velocity.set(impulse.x * .28, Math.max(.7, impulse.y * .16));
      target.angularVelocity = (Math.random() - .5) * 5;
      state.score += 100;
      ui.setScore(state.score);
      particles.push(...makeParticles(scene, '#e9b46b', target.mesh.position, 15, 2));
      state.shake = Math.max(state.shake, .11);
      emit('success', {text: '木人倒地！观众开始起哄'});
      audioTone(480, .08);
    }

    function circleBoxHit(point, radius, object) {
      if (!object.mesh.visible || object.broken || object.down) return false;
      const cos = Math.cos(-object.mesh.rotation.z);
      const sin = Math.sin(-object.mesh.rotation.z);
      const dx = point.x - object.mesh.position.x;
      const dy = point.y - object.mesh.position.y;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      const closestX = clamp(localX, -object.size.x / 2, object.size.x / 2);
      const closestY = clamp(localY, -object.size.y / 2, object.size.y / 2);
      const diffX = localX - closestX;
      const diffY = localY - closestY;
      return diffX * diffX + diffY * diffY <= radius * radius;
    }

    function launch() {
      if (state.phase !== 'playing' || state.dragging || state.projectile.visible || state.shots <= 0) return;
      const vector = new THREE.Vector2(WORLD.launch.x - state.pointer.x, WORLD.launch.y - state.pointer.y);
      const distance = vector.length();
      if (distance < .28) return;
      const power = clamp(distance / 3.3, .16, 1);
      vector.normalize();
      state.aim.copy(vector);
      state.power = power;
      state.projectile.visible = true;
      state.projectile.position.set(WORLD.launch.x, WORLD.launch.y, .36);
      state.projectileVelocity = vector.multiplyScalar(8.6 + power * 8.8);
      state.shots -= 1;
      ui.setShots(state.shots);
      state.dragging = false;
      state.shake = .025;
      emit('success', {text: '弹指石出手！'});
      audioTone(300 + power * 180, .07);
    }

    function updatePreview() {
      if (!state.dragging) return;
      const vector = new THREE.Vector2(WORLD.launch.x - state.pointer.x, WORLD.launch.y - state.pointer.y);
      const distance = clamp(vector.length(), 0, 3.3);
      if (distance < .05) return;
      state.aim.copy(vector.normalize());
      state.power = clamp(distance / 3.3, .16, 1);
      state.projectile.position.set(WORLD.launch.x - state.aim.x * distance, WORLD.launch.y - state.aim.y * distance, .36);
    }

    function updateSupport(object) {
      if (!object.supportIds?.length || object.broken) return;
      if (object.supportIds.some(id => {
        const support = objects.find(item => item.id === id);
        return support?.broken || (support?.dynamic && support.mesh.position.y < support.pos.y - .18);
      })) {
        object.dynamic = true;
        object.velocity.y -= .35;
        object.angularVelocity += (Math.random() - .5) * .15;
      }
    }

    function step(dt) {
      if (state.phase !== 'playing') return;
      state.elapsed += dt;
      if (state.projectile.visible) {
        const velocity = state.projectileVelocity;
        velocity.y -= 17.5 * dt;
        state.projectile.position.x += velocity.x * dt;
        state.projectile.position.y += velocity.y * dt;
        state.projectile.rotation.z += velocity.x * dt * 1.7;
        let hit = false;
        for (const object of objects) {
          if (circleBoxHit(new THREE.Vector2(state.projectile.position.x, state.projectile.position.y), .23, object)) {
            hit = true;
            const speed = Math.hypot(velocity.x, velocity.y);
            if (object.isFlag) {
              state.flagDown = true;
              object.dynamic = true;
              object.velocity.set(velocity.x * .16, Math.max(.8, velocity.y * .08));
              state.score += 100;
              ui.setScore(state.score);
              emit('highlight', {text: '逍遥旗被打落！全场起立'});
              particles.push(...makeParticles(scene, '#e2b65b', object.mesh.position, 22, 3));
            } else {
              breakObject(object, Math.max(.8, speed * .4), object.kind === 'jar' ? '酒坛碎了，掌门开始装作没看见' : '木梁断裂，连锁开始');
            }
            state.projectile.visible = false;
            state.projectile.position.set(WORLD.launch.x, WORLD.launch.y, .36);
            break;
          }
        }
        if (!hit) {
          for (const target of targets) {
            if (circleBoxHit(new THREE.Vector2(state.projectile.position.x, state.projectile.position.y), .23, target)) {
              hit = true;
              knockTarget(target, velocity);
              state.projectile.visible = false;
              state.projectile.position.set(WORLD.launch.x, WORLD.launch.y, .36);
              break;
            }
          }
        }
        if (state.projectile.position.y < WORLD.ground + .24 || state.projectile.position.x > 9 || state.projectile.position.x < -9) {
          state.projectile.visible = false;
          state.projectile.position.set(WORLD.launch.x, WORLD.launch.y, .36);
          emit('mistake', {text: '弹指石滚远了，观众笑得很有层次'});
        }
      }
      objects.forEach(updateSupport);
      targets.forEach(updateSupport);
      [...objects, ...targets].forEach(object => {
        if (!object.dynamic || !object.mesh.visible) return;
        object.velocity.y -= 16 * dt;
        object.mesh.position.x += object.velocity.x * dt;
        object.mesh.position.y += object.velocity.y * dt;
        object.mesh.rotation.z += object.angularVelocity * dt;
        object.velocity.x *= .992;
        object.angularVelocity *= .988;
        const halfHeight = object.size.y / 2;
        const floor = WORLD.ground + halfHeight;
        if (object.mesh.position.y < floor) {
          object.mesh.position.y = floor;
          if (Math.abs(object.velocity.y) > .55) {
            object.velocity.y *= -.25;
            state.shake = Math.max(state.shake, .035);
          } else object.velocity.y = 0;
          object.velocity.x *= .82;
          object.angularVelocity *= .75;
        }
        if (Math.abs(object.mesh.position.x) > 10) object.mesh.visible = false;
      });
      targets.forEach(target => {
        if (target.dynamic && !target.down && target.mesh.position.y <= WORLD.ground + .58) {
          target.down = true;
          state.score += 60;
          ui.setScore(state.score);
          emit('success', {text: '木架倒下，木人也跟着认输了'});
        }
      });
      particles.forEach(particle => {
        particle.life -= dt;
        particle.velocity.y -= 7 * dt;
        particle.mesh.position.x += particle.velocity.x * dt;
        particle.mesh.position.y += particle.velocity.y * dt;
        particle.mesh.rotation.z += dt * 6;
        particle.mesh.material.opacity = clamp(particle.life, 0, 1);
      });
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        if (particles[index].life <= 0) {
          disposeObject(particles[index].mesh);
          scene.remove(particles[index].mesh);
          particles.splice(index, 1);
        }
      }
      const targetDown = targets.filter(target => target.down).length;
      if (targetDown >= state.targetCount || state.flagDown) winRound();
      else if (state.shots <= 0 && !state.projectile.visible) failRound();
    }

    function render(now) {
      const elapsed = Math.min(.08, (now - state.last) / 1000);
      state.last = now;
      state.accumulator += elapsed;
      while (state.accumulator >= STEP) {
        step(STEP);
        state.accumulator -= STEP;
      }
      state.shake *= .9;
      camera.position.x = state.shake ? (Math.random() - .5) * state.shake : 0;
      camera.position.y = 4.65 + (state.shake ? (Math.random() - .5) * state.shake : 0);
      crowd.forEach((figure, index) => {
        const bounce = state.audience && state.eventLog.length ? Math.sin(state.elapsed * 5 + index) * .015 : 0;
        figure.position.y = .62 + bounce;
      });
      renderer.render(scene, camera);
      state.frame = requestAnimationFrame(render);
    }

    function resize() {
      const rect = mount.getBoundingClientRect();
      const aspect = rect.width / Math.max(1, rect.height);
      const baseAspect = WORLD.width / WORLD.height;
      if (aspect > baseAspect) {
        const height = WORLD.height;
        const width = height * aspect;
        camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2;
      } else {
        const width = WORLD.width;
        const height = width / aspect;
        camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    }

    function pointerDown(event) {
      if (state.phase !== 'playing' || state.projectile.visible || state.shots <= 0) return;
      state.dragging = true;
      state.pointer.copy(worldFromPointer(event, renderer.domElement, camera));
      updatePreview();
      renderer.domElement.setPointerCapture?.(event.pointerId);
    }
    function pointerMove(event) {
      if (!state.dragging) return;
      state.pointer.copy(worldFromPointer(event, renderer.domElement, camera));
      updatePreview();
    }
    function pointerUp(event) {
      if (!state.dragging) return;
      state.pointer.copy(worldFromPointer(event, renderer.domElement, camera));
      updatePreview();
      state.dragging = false;
      launch();
      renderer.domElement.releasePointerCapture?.(event.pointerId);
    }
    function keydown(event) {
      if (event.key.toLowerCase() === 'r') startRound();
      if (event.key === ' ' && state.phase === 'ready') startRound();
    }

    buildBackdrop();
    buildArena();
    resize();
    window.addEventListener('resize', resize);
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    window.addEventListener('keydown', keydown);
    state.frame = requestAnimationFrame(render);
    gameRef.current = {startRound, resetArena, setAudience: value => { state.audience = value; }, dispose: () => {
      cancelAnimationFrame(state.frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', keydown);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      if (state.audio) state.audio.close?.();
      scene.traverse(object => { if (object.geometry || object.material) disposeObject(object); });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    }};
    return () => gameRef.current?.dispose();
  }, []);

  function begin() { gameRef.current?.startRound(); }
  function toggleAudience() { setAudience(value => { gameRef.current?.setAudience(!value); return !value; }); }
  function reset() { gameRef.current?.startRound(); }

  return <div className="wulin-game-shell" data-phase={phase}>
    <div className="wulin-game-canvas" ref={mountRef} aria-label="逍遥派弹指神通游戏画面" />
    <div className="wulin-vignette" />
    <header className="wulin-hud">
      <div className="wulin-brand"><span className="wulin-seal">逍遥</span><div><strong>弹指神通</strong><small>武林大会 · 开场旗舰赛</small></div></div>
      <div className="wulin-hud-actions"><button type="button" className={`wulin-audience-toggle ${audience ? 'is-on' : ''}`} onClick={toggleAudience}><span className="wulin-live-dot" />观众 {audience ? 'ON' : 'OFF'}</button><button type="button" className="wulin-exit" onClick={onExit}>退出试玩</button></div>
    </header>
    <div className="wulin-status-strip"><span>剩余发数 <b>{shots}</b> / {MAX_SHOTS}</span><span>本场得分 <b>{score}</b></span><span>风格 <b>{style}</b></span><span>最佳 <b>{best}</b></span></div>
    <div className="wulin-message" aria-live="polite"><span className="wulin-message-dot" />{message}</div>
    <div className="wulin-controls"><span>拖住弹指石瞄准</span><i>·</i><span>松手释放</span><i>·</i><span>R 重新开始</span></div>
    {phase === 'ready' && <div className="wulin-modal wulin-intro-modal"><div className="wulin-modal-card"><span className="wulin-kicker">逍遥派 · 第一场</span><h1>弹指神通</h1><p>一发弹指石，拆穿一座木架。木人会倒，酒坛会碎，掌门会假装一切尽在掌握。</p><div className="wulin-how"><span><b>01</b>按住弹指石</span><span><b>02</b>向后拖拽蓄力</span><span><b>03</b>松手看坍塌</span></div><button type="button" className="wulin-primary-button" onClick={begin}>入场开打 <span>→</span></button><small>单场 30–60 秒 · 失败后立即重来</small></div></div>}
    {(phase === 'victory' || phase === 'defeat') && <div className="wulin-result-card"><span className="wulin-kicker">{phase === 'victory' ? '开场胜利' : '江湖失手'}</span><h2>{phase === 'victory' ? '木架已塌，掌门鼓掌' : '这次木架赢了'}</h2><p>{message}</p><div className="wulin-result-stats"><span>得分 <b>{score}</b></span><span>风格 <b>{style}</b></span></div><button type="button" className="wulin-primary-button" onClick={reset}>{phase === 'victory' ? '再来一场' : '不服再来'} <span>↗</span></button></div>}
  </div>;
}
