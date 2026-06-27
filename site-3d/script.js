import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.querySelector('#swordScene');
const section = canvas ? canvas.closest('.sword-hero-section') : null;
const leftArrow = document.querySelector('.carousel-arrow-left');
const rightArrow = document.querySelector('.carousel-arrow-right');
const clock = new THREE.Clock();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getBalancedPixelRatio(width = window.innerWidth) {
  return Math.min(window.devicePixelRatio || 1, width < 768 ? 1.25 : 1.5);
}

function scheduleIdle(callback) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout: 1600 });
  }

  return window.setTimeout(callback, 220);
}

function getViewportSize() {
  const bounds = section ? section.getBoundingClientRect() : null;
  const width = Math.max(1, Math.round(bounds?.width || canvas?.clientWidth || window.innerWidth));
  const height = Math.max(1, Math.round(bounds?.height || canvas?.clientHeight || window.innerHeight));

  return { width, height };
}

let scene;
let camera;
let renderer;
let composer;
let bloomPass;
let backgroundGroup;
let swordGroup;
let swordSpinGroup;
let redPointLight;
let floorRedLight;
let cloverGlowOuter;
let cloverGlowInner;
let floorGlow;
let motionStreak;

let isDragging = false;
let isTransitioning = false;
let lastPointerX = 0;
let lastPointerY = 0;
let activeIndex = 0;
let activeItem = null;
let transitionState = null;
let targetRotationX = 0.08;
let targetRotationY = 0.42;
let currentRotationX = targetRotationX;
let currentRotationY = targetRotationY;
let targetBaseZRotation = -2.56;
let currentBaseZRotation = targetBaseZRotation;
let targetBaseY = 0.02;
let currentBaseY = targetBaseY;
let animationFrame = null;
let isSceneActive = false;
let resizeFrame = null;

const modelItems = [];
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const swordDesktopHeight = 3.32;
const swordMobileHeight = 2.78;

const carouselModels = [
  {
    id: 'sword1',
    type: 'sword',
    path: './site-3d/xyz/models/sword1.glb',
    targetHeight: swordDesktopHeight,
    mobileHeight: swordMobileHeight,
    baseZ: -2.56,
    spinX: 0.08,
    spinY: 0.42,
    baseY: 0.02,
    z: 0.25
  },
  {
    id: 'sword3',
    type: 'sword',
    path: './site-3d/3d%20models/sword3.glb',
    targetHeight: 3.55,
    mobileHeight: 2.95,
    baseZ: -2.5,
    spinX: 0.06,
    spinY: 0.34,
    baseY: 0.0,
    z: 0.25
  },
  {
    id: 'sword4',
    type: 'sword',
    path: './site-3d/3d%20models/sword4.glb',
    targetHeight: 3.4,
    mobileHeight: 2.85,
    baseZ: -2.54,
    spinX: 0.08,
    spinY: 0.36,
    baseY: 0.02,
    z: 0.25
  },
  {
    id: 'grimoire',
    type: 'grimoire',
    path: './site-3d/3d%20models/Grimore.glb',
    targetHeight: 2.65,
    mobileHeight: 2.25,
    baseZ: -0.24,
    spinX: 0.14,
    spinY: -1.05,
    baseY: 0.03,
    z: 0.1
  }
];

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#030303');
  scene.fog = new THREE.Fog('#030303', 6, 14);

  const { width, height } = getViewportSize();

  camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 0.35, 6.2);
  camera.lookAt(0, 0.05, 0);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(getBalancedPixelRatio(width));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = width >= 768 && !reducedMotion;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    width < 768 ? 0 : 0.38,
    0.32,
    0.18
  );
  bloomPass.enabled = width >= 768 && !reducedMotion;
  composer.addPass(bloomPass);

  backgroundGroup = new THREE.Group();
  scene.add(backgroundGroup);

  swordGroup = new THREE.Group();
  swordGroup.position.set(0, currentBaseY, 0.25);
  swordGroup.rotation.set(0, 0, currentBaseZRotation);
  scene.add(swordGroup);

  swordSpinGroup = new THREE.Group();
  swordSpinGroup.rotation.set(currentRotationX, currentRotationY, 0);
  swordGroup.add(swordSpinGroup);

  motionStreak = createMotionStreak();
  scene.add(motionStreak);

  createWall();
  createFloor();
  createClover();
  setupLights();
  setupInteraction();
  setupCarouselControls();
  loadCarouselModels();
  handleResize();

  window.addEventListener('resize', scheduleResize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAnimation();
    } else if (isSceneActive) {
      startAnimation();
    }
  });
  window.addEventListener('swordScene:activate', activateSwordScene);
  window.addEventListener('swordScene:deactivate', deactivateSwordScene);
  window.siteSwordScene = { activateSwordScene, deactivateSwordScene, renderSwordFrame };
}

function createWall() {
  const wallMaterial = createWallPBRMaterial(5.8, 2.5, '#2a211e');
  const centerMaterial = createWallPBRMaterial(2.1, 2.05, '#241d1b');

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: '#0b0b0d',
    roughness: 0.76,
    metalness: 0.1
  });

  const seamMaterial = new THREE.MeshBasicMaterial({
    color: '#070707'
  });

  const wall = new THREE.Mesh(preparePbrGeometry(new THREE.BoxGeometry(14.5, 6.35, 0.24, 96, 48, 1)), wallMaterial);
  wall.position.set(0, 0.55, -2.1);
  wall.receiveShadow = true;
  backgroundGroup.add(wall);

  const centerPanel = new THREE.Mesh(preparePbrGeometry(new THREE.BoxGeometry(5.15, 5.25, 0.06, 48, 48, 1)), centerMaterial);
  centerPanel.position.set(0, 0.55, -1.94);
  centerPanel.receiveShadow = true;
  backgroundGroup.add(centerPanel);

  [-2.05, 0, 2.05, -5.15, 5.15].forEach((x) => {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.018, 5.8, 0.04), seamMaterial);
    seam.position.set(x, 0.55, -1.88);
    backgroundGroup.add(seam);
  });

  const lowerLedge = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.16, 0.3), trimMaterial);
  lowerLedge.position.set(0, -1.55, -1.72);
  lowerLedge.castShadow = true;
  lowerLedge.receiveShadow = true;
  backgroundGroup.add(lowerLedge);

  const lowerGroove = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.025, 0.05), seamMaterial);
  lowerGroove.position.set(0, -1.42, -1.54);
  backgroundGroup.add(lowerGroove);

  createSidePanel(-5.25);
  createSidePanel(5.25);
  createCornerWall(-7.25);
  createCornerWall(7.25);
  createSubtleCracks();
}

function createSidePanel(x) {
  const side = Math.sign(x);
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: '#0a0a0c',
    roughness: 0.78,
    metalness: 0.12
  });
  const lineMaterial = new THREE.MeshBasicMaterial({ color: '#151113' });

  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 4.65, 0.18), trimMaterial);
  pillar.position.set(x, 0.45, -1.79);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  backgroundGroup.add(pillar);

  const innerLine = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.15, 0.05), lineMaterial);
  innerLine.position.set(x - side * 0.15, 0.74, -1.65);
  backgroundGroup.add(innerLine);

  const outerLine = new THREE.Mesh(new THREE.BoxGeometry(0.025, 2.8, 0.05), lineMaterial);
  outerLine.position.set(x + side * 0.16, 0.82, -1.65);
  backgroundGroup.add(outerLine);

  const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.24), trimMaterial);
  capTop.position.set(x, 2.2, -1.68);
  backgroundGroup.add(capTop);

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.66, 0.36), trimMaterial);
  base.position.set(x, -1.5, -1.55);
  base.castShadow = true;
  base.receiveShadow = true;
  backgroundGroup.add(base);

  const angledTop = makeBar(0.36, 0.025, lineMaterial);
  angledTop.position.set(x - side * 0.08, 1.34, -1.61);
  angledTop.rotation.z = -side * 0.72;
  backgroundGroup.add(angledTop);

  const angledBottom = makeBar(0.36, 0.025, lineMaterial);
  angledBottom.position.set(x - side * 0.08, 0.07, -1.61);
  angledBottom.rotation.z = side * 0.72;
  backgroundGroup.add(angledBottom);
}

function createCornerWall(x) {
  const side = Math.sign(x);
  const sideMaterial = createWallPBRMaterial(1.35, 2.55, '#1b1817');
  const sideWall = new THREE.Mesh(preparePbrGeometry(new THREE.BoxGeometry(2.4, 6.35, 0.22, 32, 48, 1)), sideMaterial);
  sideWall.position.set(x, 0.48, -1.72);
  sideWall.rotation.y = side * 0.28;
  sideWall.receiveShadow = true;
  backgroundGroup.add(sideWall);

  const edgeLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 5.95, 0.06),
    new THREE.MeshBasicMaterial({ color: '#020202' })
  );
  edgeLine.position.set(x - side * 1.05, 0.5, -1.42);
  backgroundGroup.add(edgeLine);
}

function createFloor() {
  const floorMaterial = createGroundPBRMaterial();

  const lineMaterial = new THREE.MeshBasicMaterial({
    color: '#231b16',
    transparent: true,
    opacity: 0.3
  });

  const floorGeometry = new THREE.PlaneGeometry(16, 9.5, 96, 56);
  floorGeometry.setAttribute('uv2', floorGeometry.attributes.uv.clone());
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -1.92, 0.7);
  floor.receiveShadow = true;
  backgroundGroup.add(floor);

  for (let i = -8; i <= 8; i += 1) {
    const floorLine = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.01, 6.7), lineMaterial);
    floorLine.position.set(i * 0.72, -1.902, 0.24);
    backgroundGroup.add(floorLine);
  }

  for (let i = 0; i < 7; i += 1) {
    const crossLine = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.01, 0.015), lineMaterial);
    crossLine.position.set(0, -1.9, -1.28 + i * 0.62);
    backgroundGroup.add(crossLine);
  }

  floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 3.4),
    new THREE.MeshBasicMaterial({
      map: createSoftReflectionTexture(),
      color: '#ff2020',
      transparent: true,
      opacity: 0.105,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.rotation.z = -0.02;
  floorGlow.position.set(0.12, -1.881, -0.62);
  backgroundGroup.add(floorGlow);
}

function createGroundPBRMaterial() {
  const colorMap = loadGroundTexture('Ground038_1K-PNG_Color.png', true);
  const normalMap = loadGroundTexture('Ground038_1K-PNG_NormalGL.png');
  const roughnessMap = loadGroundTexture('Ground038_1K-PNG_Roughness.png');
  const aoMap = loadGroundTexture('Ground038_1K-PNG_AmbientOcclusion.png');
  const displacementMap = loadGroundTexture('Ground038_1K-PNG_Displacement.png');

  return new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap,
    roughnessMap,
    aoMap,
    displacementMap,
    color: '#40342d',
    roughness: 0.92,
    metalness: 0.01,
    normalScale: new THREE.Vector2(0.42, 0.42),
    aoMapIntensity: 0.72,
    displacementScale: 0.022,
    displacementBias: -0.014
  });
}

function createWallPBRMaterial(repeatX, repeatY, tint = '#2b2421') {
  const colorMap = loadWallTexture('Bricks089_4K-JPG_Color.jpg', repeatX, repeatY, true);
  const normalMap = loadWallTexture('Bricks089_4K-JPG_NormalGL.jpg', repeatX, repeatY);
  const roughnessMap = loadWallTexture('Bricks089_4K-JPG_Roughness.jpg', repeatX, repeatY);
  const aoMap = loadWallTexture('Bricks089_4K-JPG_AmbientOcclusion.jpg', repeatX, repeatY);
  const displacementMap = loadWallTexture('Bricks089_4K-JPG_Displacement.jpg', repeatX, repeatY);

  return new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap,
    roughnessMap,
    aoMap,
    displacementMap,
    color: tint,
    roughness: 0.88,
    metalness: 0.015,
    normalScale: new THREE.Vector2(0.34, 0.34),
    aoMapIntensity: 0.8,
    displacementScale: 0.018,
    displacementBias: -0.011
  });
}

function loadWallTexture(fileName, repeatX, repeatY, isColorMap = false) {
  const texture = textureLoader.load(`./site-3d/wall-textures/${fileName}`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;

  if (isColorMap) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  return texture;
}

function preparePbrGeometry(geometry) {
  geometry.setAttribute('uv2', geometry.attributes.uv.clone());
  return geometry;
}

function loadGroundTexture(fileName, isColorMap = false) {
  const texture = textureLoader.load(`./site-3d/GROUND%20TEXTURE/${fileName}`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.35, 2.18);
  texture.anisotropy = 4;

  if (isColorMap) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  return texture;
}

function createSoftReflectionTexture() {
  const size = 512;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  context.clearRect(0, 0, size, size);

  drawFlattenedCloverReflection(context, size, 42, 'rgba(255,28,24,0.13)', 1.42, 0.62);
  drawFlattenedCloverReflection(context, size, 22, 'rgba(255,36,28,0.18)', 1.28, 0.5);
  drawFlattenedCloverReflection(context, size, 9, 'rgba(255,54,42,0.105)', 1.08, 0.38);

  const spill = context.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.48);
  spill.addColorStop(0, 'rgba(255,24,20,0.22)');
  spill.addColorStop(0.32, 'rgba(255,18,18,0.11)');
  spill.addColorStop(0.72, 'rgba(255,0,0,0.025)');
  spill.addColorStop(1, 'rgba(255,0,0,0)');
  context.globalCompositeOperation = 'lighter';
  context.fillStyle = spill;
  context.save();
  context.translate(size * 0.5, size * 0.54);
  context.scale(1.42, 0.54);
  context.beginPath();
  context.arc(0, 0, size * 0.31, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i += 1) {
    const x = size * (0.28 + (i % 7) * 0.07);
    const y = size * (0.47 + Math.sin(i * 1.9) * 0.055);
    const glow = context.createRadialGradient(x, y, 0, x, y, size * (0.045 + (i % 3) * 0.015));
    glow.addColorStop(0, 'rgba(255,52,38,0.12)');
    glow.addColorStop(1, 'rgba(255,0,0,0)');
    context.fillStyle = glow;
    context.beginPath();
    context.ellipse(x, y, size * 0.105, size * 0.022, Math.sin(i) * 0.22, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 64; i += 1) {
    const x = (Math.sin(i * 9.31) * 0.5 + 0.5) * size;
    const y = (Math.cos(i * 6.71) * 0.5 + 0.5) * size;
    const radius = 8 + (i % 8) * 4;
    const cut = context.createRadialGradient(x, y, 0, x, y, radius);
    cut.addColorStop(0, 'rgba(0,0,0,0.3)');
    cut.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = cut;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function drawFlattenedCloverReflection(context, size, blur, color, scaleX, scaleY) {
  const points = createCloverShape().getPoints(120);
  context.save();
  context.globalCompositeOperation = 'lighter';
  context.filter = `blur(${blur}px)`;
  context.fillStyle = color;
  context.translate(size * 0.5, size * 0.51);
  context.rotate(-0.02);
  context.scale(size * 0.26 * scaleX, -size * 0.26 * scaleY);
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.closePath();
  context.fill();
  context.restore();
  context.filter = 'none';
}

function createGroundDetails() {
  const dirtMaterial = new THREE.MeshStandardMaterial({
    color: '#241915',
    roughness: 0.94,
    metalness: 0,
    transparent: true,
    opacity: 0.72
  });
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: '#24201d',
    roughness: 0.9,
    metalness: 0.02
  });
  const grassMaterial = new THREE.MeshBasicMaterial({
    color: '#182219',
    transparent: true,
    opacity: 0.86
  });

  const dirtPatches = [
    [-2.9, -0.62, 1.5, 0.48, -0.18],
    [2.55, -0.42, 1.35, 0.36, 0.22],
    [-0.85, 0.72, 1.95, 0.42, 0.08],
    [3.8, 1.15, 1.4, 0.32, -0.28],
    [-4.15, 1.22, 1.25, 0.28, 0.36]
  ];

  dirtPatches.forEach(([x, z, sx, sy, angle]) => {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.52, 28), dirtMaterial);
    patch.scale.set(sx, sy, 1);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = angle;
    patch.position.set(x, -1.884, z);
    backgroundGroup.add(patch);
  });

  const stones = [
    [-4.8, -0.9, 0.25, 0.08, -0.2],
    [-4.35, -0.6, 0.18, 0.06, 0.42],
    [4.45, -0.75, 0.22, 0.07, 0.36],
    [4.9, -0.42, 0.16, 0.05, -0.35],
    [1.7, 1.52, 0.14, 0.04, 0.12],
    [-1.8, 1.48, 0.16, 0.05, -0.18]
  ];

  stones.forEach(([x, z, sx, sy, angle]) => {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1, 0.035, 0.45), stoneMaterial);
    stone.scale.set(sx, 1, sy);
    stone.rotation.y = angle;
    stone.position.set(x, -1.872, z);
    stone.castShadow = true;
    stone.receiveShadow = true;
    backgroundGroup.add(stone);
  });

  const grassTufts = [
    [-5.25, 0.25], [-4.9, 0.55], [-3.7, 1.45], [-2.15, 1.65],
    [2.2, 1.55], [3.2, 1.05], [4.7, 0.4], [5.15, 0.15]
  ];

  grassTufts.forEach(([x, z], index) => {
    for (let i = 0; i < 4; i += 1) {
      const blade = makeBar(0.018, 0.22 + i * 0.025, grassMaterial);
      blade.rotation.x = -Math.PI / 2;
      blade.rotation.z = -0.55 + i * 0.35 + index * 0.04;
      blade.position.set(x + (i - 1.5) * 0.055, -1.86, z + i * 0.025);
      backgroundGroup.add(blade);
    }
  });
}

function createClover() {
  const cloverGroup = new THREE.Group();
  cloverGroup.position.set(0, 1.25, -1.56);
  cloverGroup.scale.setScalar(0.88);
  backgroundGroup.add(cloverGroup);

  const recessMaterial = new THREE.MeshStandardMaterial({
    color: '#070506',
    roughness: 0.94,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const bevelMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1515',
    roughness: 0.84,
    metalness: 0.04,
    side: THREE.DoubleSide
  });

  const innerEdgeMaterial = new THREE.MeshBasicMaterial({
    color: '#4e0909',
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const cloverMaterial = new THREE.MeshBasicMaterial({
    color: '#ff1a1a',
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const recessGeometry = new THREE.ShapeGeometry(createScaledCloverShape(1.12), 64);
  const recessBack = new THREE.Mesh(recessGeometry, recessMaterial);
  recessBack.position.z = -0.055;
  cloverGroup.add(recessBack);

  const rimPoints = createCloverShape().getSpacedPoints(180);
  const rimShape = new THREE.Shape(rimPoints.map((point) => new THREE.Vector2(point.x * 1.18, point.y * 1.18)));
  const rimHole = new THREE.Path(
    [...rimPoints].reverse().map((point) => new THREE.Vector2(point.x * 0.96, point.y * 0.96))
  );
  rimShape.holes.push(rimHole);
  const rim = new THREE.Mesh(
    new THREE.ExtrudeGeometry(rimShape, {
      depth: 0.052,
      bevelEnabled: true,
      bevelSize: 0.014,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 48
    }),
    bevelMaterial
  );
  rim.position.z = -0.058;
  cloverGroup.add(rim);

  const innerWall = new THREE.Mesh(
    new THREE.ShapeGeometry(createScaledCloverShape(1.0), 64),
    innerEdgeMaterial
  );
  innerWall.position.z = -0.034;
  cloverGroup.add(innerWall);

  const cloverGeometry = new THREE.ShapeGeometry(createScaledCloverShape(0.82), 64);
  const cloverMesh = new THREE.Mesh(cloverGeometry, cloverMaterial);
  cloverMesh.position.z = -0.01;
  cloverGroup.add(cloverMesh);

  cloverGlowOuter = new THREE.Mesh(
    new THREE.CircleGeometry(0.76, 96),
    new THREE.MeshBasicMaterial({
      color: '#ff1717',
      transparent: true,
      opacity: 0.035,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  cloverGlowOuter.position.z = -0.06;
  cloverGroup.add(cloverGlowOuter);

  cloverGlowInner = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 96),
    new THREE.MeshBasicMaterial({
      color: '#ff2020',
      transparent: true,
      opacity: 0.075,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  cloverGlowInner.scale.set(1.08, 1.08, 1);
  cloverGlowInner.position.z = -0.045;
  cloverGroup.add(cloverGlowInner);
}

function createScaledCloverShape(scale) {
  const sourcePoints = createCloverShape().getPoints(160);
  const scaledShape = new THREE.Shape();
  sourcePoints.forEach((point, index) => {
    const x = point.x * scale;
    const y = point.y * scale;
    if (index === 0) {
      scaledShape.moveTo(x, y);
    } else {
      scaledShape.lineTo(x, y);
    }
  });
  scaledShape.closePath();
  return scaledShape;
}

function createCloverShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.62);
  shape.bezierCurveTo(0.15, 0.98, 0.55, 0.97, 0.62, 0.62);
  shape.bezierCurveTo(0.68, 0.35, 0.42, 0.2, 0.2, 0.04);
  shape.bezierCurveTo(0.5, 0.28, 0.93, 0.31, 1.02, 0.02);
  shape.bezierCurveTo(1.13, -0.35, 0.75, -0.52, 0.34, -0.34);
  shape.bezierCurveTo(0.72, -0.48, 0.83, -0.86, 0.55, -1.05);
  shape.bezierCurveTo(0.27, -1.24, 0.06, -0.96, 0, -0.46);
  shape.bezierCurveTo(-0.06, -0.96, -0.27, -1.24, -0.55, -1.05);
  shape.bezierCurveTo(-0.83, -0.86, -0.72, -0.48, -0.34, -0.34);
  shape.bezierCurveTo(-0.75, -0.52, -1.13, -0.35, -1.02, 0.02);
  shape.bezierCurveTo(-0.93, 0.31, -0.5, 0.28, -0.2, 0.04);
  shape.bezierCurveTo(-0.42, 0.2, -0.68, 0.35, -0.62, 0.62);
  shape.bezierCurveTo(-0.55, 0.97, -0.15, 0.98, 0, 0.62);
  return shape;
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.2);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight('#ffffff', 3.0);
  keyLight.position.set(-2.5, 2.6, 4.2);
  keyLight.castShadow = window.innerWidth >= 768 && !reducedMotion;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 10;
  keyLight.shadow.camera.left = -4;
  keyLight.shadow.camera.right = 4;
  keyLight.shadow.camera.top = 4;
  keyLight.shadow.camera.bottom = -4;
  scene.add(keyLight);

  redPointLight = new THREE.PointLight('#ff1616', 2.15, 6.0, 1.8);
  redPointLight.position.set(0, 1.25, -1.25);
  scene.add(redPointLight);

  const redRimLight = new THREE.DirectionalLight('#ff1212', 1.45);
  redRimLight.position.set(1.8, 1.1, -2.2);
  scene.add(redRimLight);

  const bladeEdgeLight = new THREE.DirectionalLight('#ffffff', 1.95);
  bladeEdgeLight.position.set(-1.4, 0.55, 2.4);
  scene.add(bladeEdgeLight);

  floorRedLight = new THREE.PointLight('#ff1717', 1.25, 3.8, 1.35);
  floorRedLight.position.set(0.15, -1.32, 0.1);
  scene.add(floorRedLight);
}

function setupCarouselControls() {
  if (!leftArrow || !rightArrow) return;

  leftArrow.addEventListener('click', () => {
    if (!isTransitioning && modelItems.length > 1) {
      transitionToModel((activeIndex + 1) % modelItems.length, -1);
    }
  });

  rightArrow.addEventListener('click', () => {
    if (!isTransitioning && modelItems.length > 1) {
      transitionToModel((activeIndex - 1 + modelItems.length) % modelItems.length, 1);
    }
  });

  setArrowDisabled(true);
}

function setArrowDisabled(disabled) {
  if (!leftArrow || !rightArrow) return;
  leftArrow.disabled = disabled;
  rightArrow.disabled = disabled;
}

async function loadCarouselModels() {
  try {
    const firstItem = await loadModelItem(carouselModels[0]);
    addModelItem(firstItem);
    showModel(0, 0);
    renderSwordFrame();
    scheduleIdle(loadRemainingModels);
  } catch (error) {
    console.error('Carousel models failed to load:', error);
  }
}

async function loadRemainingModels() {
  for (const definition of carouselModels.slice(1)) {
    try {
      const item = await loadModelItem(definition);
      addModelItem(item);
      if (isSceneActive) {
        renderSwordFrame();
      }
    } catch (error) {
      console.error(`${definition.id} failed to load:`, error);
    }
  }
}

function addModelItem(item) {
  prepareModelItem(item);
  modelItems.push(item);
  swordSpinGroup.add(item.root);
  setArrowDisabled(modelItems.length < 2);
}

function loadModelItem(definition) {
  return new Promise((resolve, reject) => {
    loader.load(
      definition.path,
      (gltf) => resolve({ ...definition, model: gltf.scene }),
      undefined,
      reject
    );
  });
}

function prepareModelItem(item) {
  item.root = new THREE.Group();
  item.root.name = `${item.id}-carousel-root`;
  item.root.visible = false;
  item.root.position.set(0, 0, 0);
  item.root.add(item.model);

  centerModel(item.model);

  if (item.type === 'grimoire') {
    orientGrimoireModel(item.model);
    applyGrimoireMaterial(item.model);
    item.aura = createGrimoireAura();
    item.aura.visible = false;
    item.root.add(item.aura);
  } else {
    orientModelAlongYAxis(item.model);
    applySwordMaterial(item.model, item);
  }

  fitModelToViewport(item);
  setModelOpacity(item, 0);
}

function showModel(index, direction) {
  activeIndex = index;
  activeItem = modelItems[index];
  modelItems.forEach((item, itemIndex) => {
    item.root.visible = itemIndex === index;
    item.root.position.x = itemIndex === index ? 0 : direction * 4;
    setModelOpacity(item, itemIndex === index ? 1 : 0);
    if (item.aura) {
      item.aura.visible = itemIndex === index;
      setAuraOpacity(item.aura, itemIndex === index ? 1 : 0);
    }
  });
  setActivePresentation(activeItem);
}

function transitionToModel(nextIndex, direction) {
  if (!modelItems.length || nextIndex === activeIndex || isTransitioning) {
    return;
  }

  const outgoing = activeItem;
  const incoming = modelItems[nextIndex];
  const slideDistance = window.innerWidth < 768 ? 1.28 : 1.72;
  isTransitioning = true;
  isDragging = false;
  setArrowDisabled(true);
  modelItems.forEach((item) => {
    if (item !== outgoing && item !== incoming) {
      item.root.visible = false;
      item.root.position.set(0, 0, 0);
      item.root.rotation.set(0, 0, 0);
      setModelOpacity(item, 0);
      if (item.aura) {
        item.aura.visible = false;
        setAuraOpacity(item.aura, 0);
      }
    }
  });

  incoming.root.visible = true;
  incoming.root.position.set(-direction * slideDistance, 0, 0);
  incoming.root.rotation.y = 0;
  incoming.root.scale.setScalar(0.985);
  setModelOpacity(incoming, 0);
  if (incoming.aura) {
    incoming.aura.visible = true;
    setAuraOpacity(incoming.aura, 0);
  }
  if (outgoing.aura) {
    outgoing.aura.visible = true;
  }

  motionStreak.visible = false;
  motionStreak.material.opacity = 0;
  motionStreak.position.x = direction * -0.8;
  motionStreak.rotation.z = targetBaseZRotation;
  setActivePresentation(incoming);

  transitionState = {
    outgoing,
    incoming,
    nextIndex,
    direction,
    slideDistance,
    startedAt: clock.getElapsedTime(),
    duration: 1.18
  };
  startAnimation();
}

function updateTransition(time) {
  if (!transitionState) {
    return;
  }

  const { outgoing, incoming, direction, slideDistance, startedAt, duration, nextIndex } = transitionState;
  const rawProgress = THREE.MathUtils.clamp((time - startedAt) / duration, 0, 1);
  const progress = butteryEase(rawProgress);
  const incomingFade = smoothRange(rawProgress, 0.22, 0.92);
  const outgoingFade = 1 - smoothRange(rawProgress, 0.02, 0.76);
  const lift = Math.sin(Math.PI * progress) * 0.035;

  outgoing.root.position.x = direction * slideDistance * progress;
  outgoing.root.position.y = lift;
  outgoing.root.rotation.y = 0;
  outgoing.root.scale.setScalar(1 - progress * 0.025);
  setModelOpacity(outgoing, outgoingFade);

  incoming.root.position.x = -direction * slideDistance * (1 - progress);
  incoming.root.position.y = lift * 0.45;
  incoming.root.rotation.y = 0;
  incoming.root.scale.setScalar(0.985 + progress * 0.015);
  setModelOpacity(incoming, incomingFade);

  if (outgoing.aura) {
    setAuraOpacity(outgoing.aura, outgoingFade);
  }
  if (incoming.aura) {
    setAuraOpacity(incoming.aura, incomingFade);
  }

  motionStreak.position.x = THREE.MathUtils.lerp(direction * -1.2, direction * 1.2, progress);
  motionStreak.material.opacity = 0;

  if (rawProgress >= 1) {
    activeIndex = nextIndex;
    activeItem = incoming;
    setActivePresentation(incoming);
    modelItems.forEach((item) => {
      const isActive = item === incoming;
      item.root.visible = isActive;
      item.root.position.set(0, 0, 0);
      item.root.rotation.set(0, 0, 0);
      item.root.scale.setScalar(1);
      setModelOpacity(item, isActive ? 1 : 0);
      if (item.aura) {
        item.aura.visible = isActive;
        setAuraOpacity(item.aura, isActive ? 1 : 0);
      }
    });
    motionStreak.visible = false;
    transitionState = null;
    isTransitioning = false;
    setArrowDisabled(false);
  }
}

function setActivePresentation(item) {
  targetRotationX = item.spinX;
  targetRotationY = item.spinY;
  targetBaseZRotation = item.baseZ;
  targetBaseY = item.baseY;
  swordGroup.position.z = item.z;
}

function updateActiveModel(time) {
  currentRotationX += (targetRotationX - currentRotationX) * 0.08;
  currentRotationY += (targetRotationY - currentRotationY) * 0.08;
  currentBaseZRotation += (targetBaseZRotation - currentBaseZRotation) * 0.08;
  currentBaseY += (targetBaseY - currentBaseY) * 0.08;

  swordSpinGroup.rotation.x = currentRotationX;
  swordSpinGroup.rotation.y = currentRotationY;
  swordSpinGroup.rotation.z = 0;
  swordGroup.rotation.x = 0;
  swordGroup.rotation.y = 0;
  swordGroup.rotation.z = currentBaseZRotation;

  const floatSpeed = activeItem?.type === 'grimoire' ? 0.72 : 1.15;
  const floatAmount = activeItem?.type === 'grimoire' ? 0.025 : 0.035;
  swordGroup.position.y = (window.innerWidth < 768 ? -0.18 : currentBaseY) + Math.sin(time * floatSpeed) * floatAmount;

  modelItems.forEach((item) => {
    if (item.aura) {
      updateGrimoireAura(item.aura, time, item === activeItem || transitionState?.incoming === item);
    }
  });
}

function applySwordMaterial(model, item) {
  model.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    child.material = makeSwordMaterial(child.material, item, child);
  });
}

function makeSwordMaterial(sourceMaterial, item, mesh) {
  const source = Array.isArray(sourceMaterial) ? sourceMaterial[0] : sourceMaterial;
  const name = source?.name?.toLowerCase() || '';

  if (item.id === 'sword1') {
    return makeClassicSwordOneMaterial(source);
  }

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z);
  const mid = [size.x, size.y, size.z].sort((a, b) => b - a)[1] || 0.001;
  const isLongMetal = longest > mid * 1.45;
  const isBlade = name.includes('material') || name.includes('sword') || name.includes('blade') || name.includes('metal') || isLongMetal;
  const isHandle = name.includes('handle') || name.includes('guard') || name.includes('cross');
  const map = source?.map || null;
  const preset = getSwordMaterialPreset(item, isBlade, isHandle);
  const color = item.id === 'sword2' && source?.color
    ? `#${source.color.getHexString()}`
    : preset.color;

  const material = new THREE.MeshStandardMaterial({
    map,
    color,
    metalness: preset.metalness,
    roughness: preset.roughness,
    emissive: preset.emissive,
    emissiveIntensity: preset.emissiveIntensity,
    envMapIntensity: preset.envMapIntensity,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  });

  material.needsUpdate = true;
  return material;
}

function makeClassicSwordOneMaterial(source) {
  const name = source?.name?.toLowerCase() || '';
  const isBlade = name.includes('material');
  const isHandle = name.includes('handle');
  const isDivider = name.includes('divider');

  const material = new THREE.MeshStandardMaterial({
    map: source?.map || null,
    color: isBlade ? '#4a463f' : isHandle ? '#232024' : isDivider ? '#141316' : '#302d31',
    metalness: isBlade ? 0.42 : 0.48,
    roughness: isBlade ? 0.46 : 0.44,
    emissive: isBlade ? '#080606' : '#030202',
    envMapIntensity: 1.15,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  });

  material.needsUpdate = true;
  return material;
}

function getSwordMaterialPreset(item, isBlade, isHandle) {
  if (item.id === 'sword2') {
    return {
      color: isBlade ? '#716b62' : isHandle ? '#21191b' : '#332b2d',
      metalness: isBlade ? 0.55 : 0.48,
      roughness: isBlade ? 0.38 : 0.43,
      emissive: isBlade ? '#0b0303' : '#040101',
      emissiveIntensity: isBlade ? 0.1 : 0.08,
      envMapIntensity: 1.24
    };
  }

  return {
    color: isBlade ? '#5f5a52' : isHandle ? '#1b171b' : '#312d31',
    metalness: isBlade ? 0.62 : 0.5,
    roughness: isBlade ? 0.34 : 0.4,
    emissive: isBlade ? '#100404' : '#050202',
    emissiveIntensity: isBlade ? 0.18 : 0.12,
    envMapIntensity: 1.34
  };
}

function applyGrimoireMaterial(model) {
  model.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    const source = Array.isArray(child.material) ? child.material[0] : child.material;
    const material = new THREE.MeshStandardMaterial({
      map: source?.map || null,
      color: '#6c665e',
      roughness: 0.82,
      metalness: 0.02,
      emissive: '#080202',
      emissiveIntensity: 0.08,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1
    });
    child.material = material;
  });
}

function createGrimoireAura() {
  const auraGroup = new THREE.Group();
  auraGroup.position.set(0, 0.02, -0.22);

  const backGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 3.05),
    new THREE.MeshBasicMaterial({
      map: createPaintCloudTexture('#ff1515', '#490000', '#070000'),
      color: '#ffffff',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    })
  );
  backGlow.position.set(-0.08, 0.02, -0.72);
  auraGroup.add(backGlow);

  const paintLayers = [];
  const layerSettings = [
    { x: -0.42, y: 0.18, z: -0.68, w: 1.75, h: 2.35, color: '#090101', opacity: 0.72, speed: -0.12, phase: 0.3 },
    { x: 0.36, y: -0.1, z: -0.66, w: 1.65, h: 2.15, color: '#190000', opacity: 0.52, speed: 0.1, phase: 1.4 },
    { x: -0.08, y: -0.34, z: -0.64, w: 2.15, h: 1.35, color: '#ff1010', opacity: 0.34, speed: 0.16, phase: 2.1 },
    { x: 0.02, y: 0.35, z: -0.63, w: 2.0, h: 1.45, color: '#070000', opacity: 0.58, speed: -0.09, phase: 3.2 }
  ];

  layerSettings.forEach((setting, index) => {
    const layer = new THREE.Mesh(
      new THREE.PlaneGeometry(setting.w, setting.h),
      new THREE.MeshBasicMaterial({
        map: createInkSplashTexture(index % 2 === 0),
        color: setting.color,
        transparent: true,
        opacity: 0,
        blending: index === 2 ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        depthTest: false
      })
    );
    layer.position.set(setting.x, setting.y, setting.z);
    layer.rotation.z = setting.phase;
    layer.userData.base = { ...setting };
    paintLayers.push(layer);
    auraGroup.add(layer);
  });

  auraGroup.userData.backGlow = backGlow;
  auraGroup.userData.paintLayers = paintLayers;
  return auraGroup;
}

function updateGrimoireAura(aura, time, active) {
  if (!aura.visible && !active) {
    return;
  }

  const backGlow = aura.userData.backGlow;
  aura.rotation.z = Math.sin(time * 0.42) * 0.018;
  backGlow.rotation.z = time * 0.05;
  backGlow.scale.setScalar(1.02 + Math.sin(time * 1.15) * 0.045);
  aura.userData.paintLayers.forEach((layer, index) => {
    const base = layer.userData.base;
    const wave = Math.sin(time * (0.7 + index * 0.14) + base.phase);
    layer.position.x = base.x + wave * 0.045;
    layer.position.y = base.y + Math.cos(time * 0.58 + base.phase) * 0.035;
    layer.rotation.z += base.speed * 0.01;
    layer.scale.set(1 + wave * 0.06, 1 - wave * 0.035, 1);
  });
}

function centerModel(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const localCenter = model.parent ? model.parent.worldToLocal(center.clone()) : center;
  model.position.sub(localCenter);
  model.updateMatrixWorld(true);
}

function orientModelAlongYAxis(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z);

  if (longest === size.x) {
    model.rotation.z = Math.PI / 2;
  } else if (longest === size.z) {
    model.rotation.x = Math.PI / 2;
  }

  model.rotation.z += Math.PI;
  centerModel(model);
}

function orientGrimoireModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const thinnest = Math.min(size.x, size.y, size.z);

  if (thinnest === size.x) {
    model.rotation.y = Math.PI / 2;
  } else if (thinnest === size.y) {
    model.rotation.x = Math.PI / 2;
  }

  model.rotation.z += -0.08;
  centerModel(model);
}

function fitModelToViewport(item) {
  item.model.scale.setScalar(1);
  item.model.position.set(0, 0, 0);
  centerModel(item.model);
  const box = new THREE.Box3().setFromObject(item.model);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z);
  const targetHeight = window.innerWidth < 768 ? item.mobileHeight : item.targetHeight;
  const scale = targetHeight / longest;

  item.model.scale.setScalar(scale);
  centerModel(item.model);
  if (item.aura) {
    item.aura.scale.setScalar(window.innerWidth < 768 ? 0.9 : 1);
  }
}

function setupInteraction() {
  canvas.addEventListener('pointerdown', (event) => {
    if (isTransitioning || !activeItem) {
      return;
    }
    isDragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    startAnimation();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!isDragging || isTransitioning) {
      return;
    }

    const deltaX = event.clientX - lastPointerX;
    const deltaY = event.clientY - lastPointerY;

    targetRotationY += deltaX * 0.008;
    targetRotationX += deltaY * 0.006;
    targetRotationX = THREE.MathUtils.clamp(targetRotationX, -0.75, 0.75);

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    startAnimation();
  });

  canvas.addEventListener('pointerup', (event) => {
    isDragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  });

  canvas.addEventListener('pointercancel', () => {
    isDragging = false;
  });
}

function handleResize() {
  const { width, height } = getViewportSize();
  const isMobile = width < 768;

  camera.aspect = width / height;
  camera.position.z = isMobile ? 7.2 : 6.2;
  camera.position.y = isMobile ? 0.22 : 0.35;
  camera.lookAt(0, 0.05, 0);
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(getBalancedPixelRatio(width));
  renderer.shadowMap.enabled = !isMobile && !reducedMotion;
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
  bloomPass.setSize(width, height);
  bloomPass.enabled = !isMobile && !reducedMotion;
  bloomPass.strength = isMobile ? 0 : 0.38;

  modelItems.forEach(fitModelToViewport);
  renderSwordFrame();
}

function scheduleResize() {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    handleResize();
  });
}

function activateSwordScene() {
  isSceneActive = true;
  handleResize();
  startAnimation();
}

function deactivateSwordScene() {
  isSceneActive = false;
  if (!isTransitioning && !isDragging) {
    stopAnimation();
  }
}

function startAnimation() {
  if (animationFrame || !isSceneActive || document.hidden) return;
  animationFrame = requestAnimationFrame(animate);
}

function stopAnimation() {
  if (!animationFrame) return;
  cancelAnimationFrame(animationFrame);
  animationFrame = null;
}

function renderSwordFrame(time = clock.getElapsedTime()) {
  if (!renderer || !composer) return;

  updateTransition(time);
  updateActiveModel(time);

  if (cloverGlowOuter && cloverGlowInner && redPointLight && floorRedLight) {
    cloverGlowOuter.material.opacity = 0.045 + Math.sin(time * 2.2) * 0.012;
    cloverGlowInner.material.opacity = 0.075 + Math.sin(time * 1.8) * 0.012;
    redPointLight.intensity = 2.0 + Math.sin(time * 2) * 0.2;
    floorRedLight.intensity = 1.15 + Math.sin(time * 1.7) * 0.1;
    if (floorGlow) {
      floorGlow.material.opacity = 0.095 + Math.sin(time * 1.35) * 0.012;
    }
  }

  composer.render();
}

function animate() {
  animationFrame = null;
  if (!isSceneActive || document.hidden) return;

  renderSwordFrame();
  if (isSceneActive) {
    animationFrame = requestAnimationFrame(animate);
  }
}

function createMotionStreak() {
  const streak = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.14),
    new THREE.MeshBasicMaterial({
      color: '#ff1515',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  streak.visible = false;
  streak.position.set(0, 0.05, 1.2);
  return streak;
}

function setModelOpacity(item, opacity) {
  item.model.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = opacity;
      material.needsUpdate = true;
    });
  });
}

function setAuraOpacity(aura, opacity) {
  aura.traverse((child) => {
    if (child.isMesh && child.material) {
      const layerBase = child.userData.base?.opacity;
      const base = child === aura.userData.backGlow ? 0.48 : layerBase || 0.42;
      child.material.opacity = base * opacity;
    }
  });
}

function createDustyCloverTexture() {
  const size = 256;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  context.clearRect(0, 0, size, size);
  context.translate(size / 2, size / 2);
  context.scale(size * 0.34, -size * 0.34);
  context.fillStyle = '#ffffff';
  const shape = createCloverShape();
  const points = shape.getPoints(90);
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });
  context.closePath();
  context.fill();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = 'destination-out';
  context.fillStyle = 'rgba(0,0,0,0.45)';
  for (let i = 0; i < 90; i += 1) {
    const x = (Math.sin(i * 17.23) * 0.5 + 0.5) * size;
    const y = (Math.cos(i * 11.91) * 0.5 + 0.5) * size;
    const radius = 2 + (i % 7);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPaintCloudTexture(primary, secondary, darkCore) {
  const size = 512;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.48);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(0.38, secondary);
  gradient.addColorStop(0.72, darkCore);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  context.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 75; i += 1) {
    const x = size * (0.5 + Math.sin(i * 13.71) * 0.32);
    const y = size * (0.5 + Math.cos(i * 9.43) * 0.34);
    const radius = 18 + (i % 10) * 5;
    const blob = context.createRadialGradient(x, y, 0, x, y, radius);
    blob.addColorStop(0, i % 3 === 0 ? primary : secondary);
    blob.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = blob;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 90; i += 1) {
    const x = (Math.sin(i * 19.17) * 0.5 + 0.5) * size;
    const y = (Math.cos(i * 7.31) * 0.5 + 0.5) * size;
    const radius = 9 + (i % 9) * 3;
    const cut = context.createRadialGradient(x, y, 0, x, y, radius);
    cut.addColorStop(0, 'rgba(0,0,0,0.42)');
    cut.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = cut;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createInkSplashTexture(inverted) {
  const size = 512;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  context.clearRect(0, 0, size, size);
  context.globalCompositeOperation = 'source-over';

  for (let i = 0; i < 56; i += 1) {
    const angle = i * 2.399;
    const radiusFromCenter = (i % 17) / 17 * size * 0.34;
    const x = size / 2 + Math.cos(angle) * radiusFromCenter + Math.sin(i * 4.7) * 32;
    const y = size / 2 + Math.sin(angle) * radiusFromCenter + Math.cos(i * 5.1) * 28;
    const radius = 22 + (i % 13) * 5;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255,255,255,0.88)');
    gradient.addColorStop(0.58, 'rgba(255,255,255,0.44)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x, y, radius * (inverted ? 1.25 : 0.82), radius * (inverted ? 0.75 : 1.18), angle, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 42; i += 1) {
    const x = (Math.sin(i * 10.11) * 0.5 + 0.5) * size;
    const y = (Math.cos(i * 8.73) * 0.5 + 0.5) * size;
    const radius = 8 + (i % 8) * 3;
    context.fillStyle = 'rgba(0,0,0,0.28)';
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function butteryEase(value) {
  return 1 - Math.pow(1 - value, 4);
}

function smoothRange(value, min, max) {
  const progress = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

function createSubtleCracks() {
  const crackMaterial = new THREE.MeshBasicMaterial({
    color: '#060506',
    transparent: true,
    opacity: 0.62
  });

  const cracks = [
    { x: -2.24, y: 1.48, z: -1.845, length: 0.42, angle: -0.8 },
    { x: -2.03, y: 1.32, z: -1.84, length: 0.24, angle: 0.42 },
    { x: 1.86, y: 1.08, z: -1.845, length: 0.36, angle: 0.74 },
    { x: 2.08, y: 0.9, z: -1.84, length: 0.23, angle: -0.4 },
    { x: -0.42, y: -0.72, z: -1.84, length: 0.32, angle: -0.2 }
  ];

  cracks.forEach((crack) => {
    const mesh = makeBar(crack.length, 0.012, crackMaterial);
    mesh.position.set(crack.x, crack.y, crack.z);
    mesh.rotation.z = crack.angle;
    backgroundGroup.add(mesh);
  });
}

function makeBar(width, height, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.025), material);
}
