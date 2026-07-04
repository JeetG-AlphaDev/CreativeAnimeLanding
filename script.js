import * as THREE from "three";

window.THREE = THREE;

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/+*-";

function shuffleIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = indexes[index];
    indexes[index] = indexes[randomIndex];
    indexes[randomIndex] = current;
  }

  return indexes;
}

function buildPixelTransitionBlocks(grid) {
  const columnCount = 20;
  const blockSize = window.innerWidth * 0.05;
  const viewportHeight = Math.max(window.innerHeight, document.documentElement.clientHeight || 0, window.screen?.height || 0);
  const blockCount = Math.ceil(viewportHeight / blockSize) + 4;
  const pixelPalette = [
    "var(--ink)",
    "var(--muted-ink)",
    "#030303",
    "var(--deep-red)",
    "var(--red)",
    "var(--paper)",
  ];

  grid.innerHTML = "";

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const column = document.createElement("div");
    const shuffledIndexes = shuffleIndexes(blockCount);

    column.className = "pixel-transition-column";

    for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
      const block = document.createElement("span");
      const randomIndex = shuffledIndexes[blockIndex];
      const delay = randomIndex * 0.03;
      const colorIndex = (columnIndex * 3 + blockIndex + randomIndex) % pixelPalette.length;

      block.className = "pixel-transition-block";
      block.style.setProperty("--pixel-color", pixelPalette[colorIndex]);
      block.dataset.forwardDelay = String(delay);
      block.dataset.forwardClearDelay = String(delay);
      block.dataset.reverseDelay = String(delay);
      block.dataset.reverseClearDelay = String(delay);
      column.appendChild(block);
    }

    grid.appendChild(column);
  }

  return Array.from(grid.querySelectorAll(".pixel-transition-block"));
}

function debounce(callback, delay = 120) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), delay);
  };
}

function scramblePart(element, finalText, duration = 850, delay = 0) {
  const start = performance.now() + delay;
  const length = finalText.length;

  function frame(now) {
    if (now < start) {
      requestAnimationFrame(frame);
      return;
    }

    const progress = Math.min((now - start) / duration, 1);
    const lockCount = Math.floor(progress * length);
    let output = "";

    for (let index = 0; index < length; index += 1) {
      if (index < lockCount || progress === 1) {
        output += finalText[index];
      } else {
        const randomIndex = Math.floor(Math.random() * scrambleChars.length);
        output += scrambleChars[randomIndex];
      }
    }

    element.textContent = output;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

window.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector(".mega-title");
  const left = document.querySelector(".mega-title__part--left");
  const right = document.querySelector(".mega-title__part--right");

  if (title && left && right) {
    title.classList.add("is-scrambling");
    scramblePart(left, "AS", 760, 90);
    scramblePart(right, "TA", 820, 220);

    window.setTimeout(() => {
      left.textContent = "AS";
      right.textContent = "TA";
      title.classList.remove("is-scrambling");
    }, 1120);
  }

  initDecorativeLoops();
  initHeroAmbientText();
  initInfoCardTilt();
  initCharacterMaskReveal();
  initStackedCinematicScroll();
  loadSwordSceneModule();
});

function loadSwordSceneModule() {
  if (!document.querySelector("#swordScene") || document.querySelector('script[data-sword-scene-module="true"]')) return;

  const load = () => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "site-3d/script.js?v=dungeon-red-20260628";
    script.dataset.swordSceneModule = "true";
    document.body.appendChild(script);
  };

  window.setTimeout(load, 350);
}

function initDecorativeLoops() {
  if (!window.gsap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.defaults({ ease: "sine.inOut" });

  gsap.to(".side-rail span", {
    opacity: 0.28,
    scale: 1.45,
    duration: 1.8,
    repeat: -1,
    yoyo: true,
    transformOrigin: "center center",
  });

  gsap.to(".side-rail b", {
    opacity: 0.34,
    boxShadow: "0 0 10px rgba(255, 30, 60, 0.42)",
    duration: 2.2,
    repeat: -1,
    yoyo: true,
    stagger: 0.42,
  });

  gsap.to(".side-rail em", {
    rotation: 90,
    scale: 0.9,
    opacity: 0.72,
    duration: 4.8,
    repeat: -1,
    yoyo: true,
    transformOrigin: "center center",
  });

  gsap.to(".side-rail__line", {
    opacity: 0.45,
    duration: 2.6,
    repeat: -1,
    yoyo: true,
  });

  gsap.to(".mini-box", {
    opacity: 0.42,
    scale: 1.18,
    boxShadow: "0 0 10px rgba(255, 30, 60, 0.48)",
    duration: 1.7,
    repeat: -1,
    yoyo: true,
    transformOrigin: "center center",
  });

  gsap.to(".barcode", {
    opacity: 0.58,
    x: 4,
    duration: 2.4,
    repeat: -1,
    yoyo: true,
  });

  gsap.to(".plus", {
    rotation: 180,
    scale: 1.12,
    duration: 5.2,
    repeat: -1,
    yoyo: true,
    transformOrigin: "center center",
  });

  gsap.to(".hairline", {
    opacity: 0.42,
    scaleX: 0.92,
    duration: 2.8,
    repeat: -1,
    yoyo: true,
    transformOrigin: "right center",
  });

  gsap.to(".hairline i", {
    opacity: 0.28,
    scale: 1.6,
    duration: 1.55,
    repeat: -1,
    yoyo: true,
  });
}

function scrambleToText(element, finalText, options = {}) {
  const chars = options.chars || "アイウエオカキクケコサシスセソタチツテトナニヌネノ魔法剣限界未来運命王";
  const duration = options.duration || 760;
  const start = performance.now();
  const maxLength = Math.max(element.textContent.length, finalText.length);

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const lockCount = Math.floor(progress * finalText.length);
    let output = "";

    for (let index = 0; index < maxLength; index += 1) {
      if (index < lockCount || progress === 1) {
        output += finalText[index] || "";
      } else if (index < finalText.length) {
        output += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    element.textContent = output;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function initHeroAmbientText() {
  const seriesTag = document.querySelector(".series-tag");
  const quoteTitle = document.querySelector(".quote-panel h2");

  if (seriesTag && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.setInterval(() => {
      seriesTag.classList.add("is-glitching");
      window.setTimeout(() => seriesTag.classList.remove("is-glitching"), 620);
    }, 4300);
  }

  if (!quoteTitle) return;

  const quotes = [
    "未来は自分で切り開く。",
    "限界を超えて進め。",
    "運命はこの手で掴む。",
  ];
  let quoteIndex = 0;

  window.setInterval(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    scrambleToText(quoteTitle, quotes[quoteIndex], { duration: 820 });
  }, 5200);
}

function initInfoCardTilt() {
  const card = document.querySelector(".info-card");

  if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const reset = () => {
    card.style.setProperty("--card-tilt-x", "0deg");
    card.style.setProperty("--card-tilt-y", "0deg");
    card.style.setProperty("--card-glare-x", "50%");
    card.style.setProperty("--card-glare-y", "50%");
  };

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const glareX = ((event.clientX - rect.left) / rect.width) * 100;
    const glareY = ((event.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty("--card-tilt-x", `${(x * 15).toFixed(2)}deg`);
    card.style.setProperty("--card-tilt-y", `${(-y * 12).toFixed(2)}deg`);
    card.style.setProperty("--card-glare-x", `${glareX.toFixed(1)}%`);
    card.style.setProperty("--card-glare-y", `${glareY.toFixed(1)}%`);
  });

  card.addEventListener("pointerleave", reset);
}

function initCharacterMaskReveal() {
  const stack = document.querySelector(".character-stack");
  const canvas = document.querySelector(".framer-reveal-canvas");
  const devil = document.querySelector(".character--devil");

  if (!stack || !canvas || !devil || !window.THREE) return;

  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });
  const getPixelRatio = () => Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.5);
  renderer.setPixelRatio(getPixelRatio());
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const clock = new THREE.Clock();
  const uniforms = {
    time: { value: 0 },
    dTime: { value: 0 },
    aspect: { value: 1 },
    pointer: { value: new THREE.Vector2(10, 10) },
    pointerRadius: { value: 0.33 },
    pointerDuration: { value: 1.0 },
    prevFrame: { value: null },
    revealMap: { value: null },
  };

  let width = 1;
  let height = 1;
  let rtOutput;
  let rtPrevious;
  let blobScene;
  let blobCamera;
  let revealMesh;
  let animationFrame;
  let isReady = false;
  let isVisible = true;
  let shouldAnimate = false;
  let settleTimer;

  const blobMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time, dTime, aspect, pointerRadius, pointerDuration;
      uniform vec2 pointer;
      uniform sampler2D prevFrame;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        float rVal = texture2D(prevFrame, vUv).r;
        rVal -= clamp(dTime / pointerDuration, 0.0, 0.05);
        rVal = clamp(rVal, 0.0, 1.0);

        vec2 uv = (vUv - 0.5) * 2.0 * vec2(aspect, 1.0);
        vec2 mouse = pointer * vec2(aspect, 1.0);
        vec2 toMouse = uv - mouse;
        float angle = atan(toMouse.y, toMouse.x);
        float dist = length(toMouse);

        float noiseVal = noise(vec2(angle * 3.0 + time * 0.5, dist * 5.0));
        float noiseVal2 = noise(vec2(angle * 5.0 - time * 0.3, dist * 3.0 + time));
        float radiusVariation = 0.72 + noiseVal * 0.42 + noiseVal2 * 0.24;
        float organicRadius = pointerRadius * radiusVariation;
        float f = 1.0 - smoothstep(organicRadius * 0.05, organicRadius * 1.2, dist);
        f *= 0.78 + noiseVal * 0.22;

        rVal += f * 0.25;
        rVal = clamp(rVal, 0.0, 1.0);
        gl_FragColor = vec4(vec3(rVal), 1.0);
      }
    `,
  });

  const revealMaterial = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      varying vec4 vPosProj;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vPosProj = gl_Position;
      }
    `,
    fragmentShader: `
      uniform sampler2D prevFrame;
      uniform sampler2D revealMap;
      varying vec2 vUv;
      varying vec4 vPosProj;

      void main() {
        vec2 blobUv = ((vPosProj.xy / vPosProj.w) + 1.0) * 0.5;
        float blob = texture2D(prevFrame, blobUv).r;
        float alpha = smoothstep(0.03, 0.42, blob);
        vec4 texColor = texture2D(revealMap, vUv);
        gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
      }
    `,
  });

  const makeTarget = () =>
    new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

  const disposeTargets = () => {
    if (rtOutput) rtOutput.dispose();
    if (rtPrevious) rtPrevious.dispose();
  };

  const resize = () => {
    const rect = stack.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));

    renderer.setPixelRatio(getPixelRatio());
    renderer.setSize(width, height, false);
    uniforms.aspect.value = width / height;

    camera.left = width / -2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / -2;
    camera.updateProjectionMatrix();

    disposeTargets();
    rtOutput = makeTarget();
    rtPrevious = makeTarget();
    uniforms.prevFrame.value = rtPrevious.texture;

    if (revealMesh) {
      const styles = getComputedStyle(stack);
      const x = parseFloat(styles.getPropertyValue("--devil-x")) / 100 || 0;
      const y = parseFloat(styles.getPropertyValue("--devil-y")) / 100 || 0;
      const scale = parseFloat(styles.getPropertyValue("--devil-scale")) || 1;
      const bottomLockY = (scale - 1) / 2;
      revealMesh.geometry.dispose();
      revealMesh.geometry = new THREE.PlaneGeometry(width * scale, height * scale);
      revealMesh.position.x = width * x;
      revealMesh.position.y = height * bottomLockY - height * y;
    }

    startAnimation();
  };

  const renderBlob = () => {
    renderer.setRenderTarget(rtOutput);
    renderer.render(blobScene, blobCamera);
    renderer.setRenderTarget(null);

    const temp = rtPrevious;
    rtPrevious = rtOutput;
    rtOutput = temp;
    uniforms.prevFrame.value = rtPrevious.texture;
  };

  const canRender = () => isReady && isVisible && !document.hidden;

  const animate = () => {
    animationFrame = null;
    if (!canRender()) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.time.value += dt;
    uniforms.dTime.value = dt;

    renderBlob();
    renderer.clear();
    renderer.render(scene, camera);

    if (shouldAnimate) {
      animationFrame = requestAnimationFrame(animate);
    }
  };

  function startAnimation() {
    if (animationFrame || !canRender()) return;
    clock.getDelta();
    animationFrame = requestAnimationFrame(animate);
  }

  const stopAnimation = () => {
    if (!animationFrame) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  };

  const settleAnimation = () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      shouldAnimate = false;
    }, 1200);
  };

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(devil.getAttribute("src"), (texture) => {
    uniforms.revealMap.value = texture;

    blobScene = new THREE.Scene();
    blobCamera = new THREE.Camera();
    blobScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blobMaterial));

    revealMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), revealMaterial);
    scene.add(revealMesh);

    resize();
    isReady = true;
    shouldAnimate = true;
    settleAnimation();
    startAnimation();
  });

  const movePointer = (event) => {
    if (!isReady) return;
    const rect = stack.getBoundingClientRect();
    uniforms.pointer.value.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    uniforms.pointer.value.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    shouldAnimate = true;
    window.clearTimeout(settleTimer);
    startAnimation();
  };

  const hidePointer = () => {
    uniforms.pointer.value.set(10, 10);
    settleAnimation();
    startAnimation();
  };

  stack.addEventListener("pointermove", movePointer);
  stack.addEventListener("pointerleave", hidePointer);
  window.addEventListener("resize", resize);

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && shouldAnimate) {
      startAnimation();
    } else if (!isVisible) {
      stopAnimation();
    }
  }, { threshold: 0.01 });
  observer.observe(stack);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAnimation();
    } else if (shouldAnimate) {
      startAnimation();
    }
  });
}

function initStackedCinematicScroll() {
  const transition = document.querySelector(".landing-transition");
  const stack = document.querySelector(".landing-stack");
  const hero = document.querySelector(".landing-stack .hero");
  const nextSection = document.querySelector(".cinematic-video");
  const media = document.querySelector(".cinematic-video__media");
  const video = document.querySelector(".cinematic-video__asset");
  const mangaSection = document.querySelector(".manga-story");
  const mangaStage = document.querySelector(".manga-story__stage");
  const mangaFrames = Array.from(document.querySelectorAll(".manga-story__frame"));
  const mangaCopies = Array.from(document.querySelectorAll(".manga-story__copy"));
  const swordSection = document.querySelector(".sword-hero-section");
  const pixelStage = document.querySelector(".pixel-transition-stage");
  const pixelGrid = document.querySelector(".pixel-transition-grid");
  const finalSection = document.querySelector(".landing-stack > .final-ending");
  const finalTrack = finalSection?.querySelector(".final-chapter-track");
  const finalTitleScene = finalSection?.querySelector(".final-title-scene");
  const finalTitle = finalSection?.querySelector(".final-title-scene__title");
  const finalMediaScene = finalSection?.querySelector(".final-image-reveal-scene");
  const finalMedia = finalSection?.querySelector(".final-image-reveal-scene__media");
  const finalAsset = finalSection?.querySelector(".final-image-reveal-scene__asset");
  const finalFooter = finalSection?.querySelector(".site-footer-ending");

  if (!transition || !stack || !hero || !nextSection || !media || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  let pixelBlocks = pixelGrid ? buildPixelTransitionBlocks(pixelGrid) : [];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const storyStepCount = Math.max(mangaFrames.length - 1, 1);
  const hasPixelHandoff = Boolean(swordSection && pixelStage && pixelBlocks.length && mangaSection);
  const hasFinalHandoff = Boolean(finalSection && finalTrack && finalMedia && swordSection && pixelStage && pixelBlocks.length);
  const storyStartUnit = 2.32;
  const storyStepUnit = 1.62;
  const storyCompleteUnit = mangaFrames.length ? storyStartUnit + storyStepCount * storyStepUnit : 1;
  const storyPostRevealNudgeUnits = hasPixelHandoff ? 0.1 : 0;
  const storyTimelineUnits = storyCompleteUnit + storyPostRevealNudgeUnits;
  const pixelHandoffTimelineUnits = hasPixelHandoff ? 0.16 : 0;
  const swordHoldTimelineUnits = hasFinalHandoff ? 0.36 : 0;
  const finalHandoffTimelineUnits = hasFinalHandoff ? 0.16 : 0;
  const finalTimelineUnits = hasFinalHandoff ? 1.12 : 0;
  const timelineUnits = storyTimelineUnits + pixelHandoffTimelineUnits + swordHoldTimelineUnits + finalHandoffTimelineUnits + finalTimelineUnits;
  const getTotalScroll = () => Math.round(window.innerHeight * timelineUnits);
  const pixelTriggerProgress = hasPixelHandoff ? Math.min(0.985, (storyCompleteUnit + 0.04) / timelineUnits) : Number.POSITIVE_INFINITY;
  const finalTriggerProgress = hasFinalHandoff ? Math.min(0.992, (storyTimelineUnits + pixelHandoffTimelineUnits + swordHoldTimelineUnits) / timelineUnits) : Number.POSITIVE_INFINITY;
  const getFinalFooterGap = () => 0;
  const getFinalFooterTargetY = () => {
    const footerHeight = finalFooter?.offsetHeight || window.innerHeight * 0.2;
    return -Math.round(window.innerHeight + getFinalFooterGap() + footerHeight);
  };
  const finalRevealStartOffset = 0.24;
  const scheduleRefresh = debounce(() => {
    syncSceneHeight();
    ScrollTrigger.refresh();
  }, 140);

  const syncSceneHeight = () => {
    const sceneHeight = Math.max(hero.offsetHeight, window.innerHeight);
    transition.style.setProperty("--scene-height", `${sceneHeight}px`);
    transition.style.setProperty("--transition-scroll", `${getTotalScroll()}px`);
  };

  syncSceneHeight();

  gsap.set(nextSection, { yPercent: 100, autoAlpha: 1 });
  gsap.set(media, {
    autoAlpha: 1,
    scale: 0.72,
    width: "min(76vw, 1180px)",
    height: "auto",
    borderRadius: 0,
    clipPath: "inset(18% 24% round 0px)",
  });

  if (mangaSection && mangaFrames.length) {
    gsap.set(mangaSection, { yPercent: 100, autoAlpha: 1 });
    if (mangaStage) {
      gsap.set(mangaStage, {
        y: 0,
        height: "calc(100% - 5vw)",
      });
    }
    mangaFrames.forEach((frame, index) => {
      gsap.set(frame, {
        zIndex: index + 1,
        autoAlpha: 1,
        scale: index === 0 ? 1 : 1.012,
        clipPath: index === 0 ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)",
      });
      const image = frame.querySelector("img");
      if (image) gsap.set(image, { scale: index === 0 ? 1.008 : 1.018 });
    });
    mangaCopies.forEach((copy, index) => {
      gsap.set(copy, {
        autoAlpha: 1,
        y: index === 0 ? 0 : "64vh",
      });
    });
  }

  if (swordSection) {
    gsap.set(swordSection, {
      yPercent: 0,
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none",
      scale: 1.015,
      transformOrigin: "center center",
    });
  }

  if (pixelStage && pixelBlocks.length) {
    gsap.set(pixelStage, { autoAlpha: 0, visibility: "hidden" });
    gsap.set(pixelBlocks, { autoAlpha: 0 });
  }

  if (finalSection) {
    gsap.set(finalSection, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none",
    });
  }

  if (finalTitleScene) {
    gsap.set(finalTitleScene, { autoAlpha: 1 });
  }

  if (finalTrack) {
    gsap.set(finalTrack, { y: 0 });
  }

  if (finalTitle) {
    gsap.set(finalTitle, { autoAlpha: 1 });
  }

  if (finalMediaScene) {
    gsap.set(finalMediaScene, { autoAlpha: 1 });
  }

  if (finalMedia) {
    gsap.set(finalMedia, {
      xPercent: -50,
      yPercent: -50,
      autoAlpha: 1,
      top: "50%",
      scale: prefersReducedMotion ? 1 : 0.72,
      width: prefersReducedMotion ? "100vw" : "min(76vw, 1180px)",
      height: prefersReducedMotion ? "100%" : "auto",
      clipPath: prefersReducedMotion ? "inset(0% 0% round 0px)" : "inset(18% 24% round 0px)",
    });
  }

  if (finalAsset) {
    gsap.set(finalAsset, { scale: prefersReducedMotion ? 1 : 1.08 });
  }

  if (finalFooter) {
    gsap.set(finalFooter, { autoAlpha: 1 });
  }

  let isPixelHandoffAnimating = false;
  let pixelHandoffState = "manga";
  let finalHandoffState = "sword";
  let pixelScrollLockTimer = 0;
  const finalMangaFrame = mangaFrames[mangaFrames.length - 1];
  const finalMangaCopy = mangaCopies[mangaCopies.length - 1];
  const finalMangaImage = finalMangaFrame?.querySelector("img");

  const preventPixelScroll = (event) => {
    if (!isPixelHandoffAnimating) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const lockPixelScroll = () => {
    window.clearTimeout(pixelScrollLockTimer);
    window.addEventListener("wheel", preventPixelScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", preventPixelScroll, { passive: false, capture: true });
    pixelScrollLockTimer = window.setTimeout(() => {
      isPixelHandoffAnimating = false;
      unlockPixelScroll();
    }, 1800);
  };

  const unlockPixelScroll = () => {
    window.clearTimeout(pixelScrollLockTimer);
    window.removeEventListener("wheel", preventPixelScroll, { capture: true });
    window.removeEventListener("touchmove", preventPixelScroll, { capture: true });
  };

  const setFinalMangaVisualState = () => {
    if (!mangaSection || !finalMangaFrame) return;

    gsap.set(mangaSection, {
      yPercent: 0,
      autoAlpha: 1,
      visibility: "visible",
      pointerEvents: "auto",
    });

    if (mangaStage) {
      gsap.set(mangaStage, {
        y: "-5vw",
        height: "100%",
      });
    }

    mangaCopies.slice(0, -1).forEach((copy) => {
      gsap.set(copy, { y: "-72vh" });
    });

    gsap.set(finalMangaFrame, {
      autoAlpha: 1,
      clipPath: "inset(0% 0 0 0)",
      scale: 1,
    });

    if (finalMangaImage) {
      gsap.set(finalMangaImage, { scale: 1 });
    }

    if (finalMangaCopy) {
      gsap.set(finalMangaCopy, {
        autoAlpha: 1,
        y: 0,
      });
    }
  };

  const showMangaHandoffState = () => {
    gsap.set(pixelStage, { autoAlpha: 0, visibility: "hidden" });
    gsap.set(pixelBlocks, { autoAlpha: 0 });
    gsap.set(swordSection, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none",
      scale: 1.015,
    });
    if (finalSection) {
      gsap.set(finalSection, {
        autoAlpha: 0,
        visibility: "hidden",
        pointerEvents: "none",
      });
    }
    setFinalMangaVisualState();
    pixelHandoffState = "manga";
    finalHandoffState = "sword";
    window.dispatchEvent(new Event("swordScene:deactivate"));
  };

  const showSwordHandoffState = () => {
    gsap.set(pixelStage, { autoAlpha: 0, visibility: "hidden" });
    gsap.set(pixelBlocks, { autoAlpha: 0 });
    gsap.set(mangaSection, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none",
    });
    gsap.set(swordSection, {
      autoAlpha: 1,
      visibility: "visible",
      pointerEvents: "auto",
      scale: 1,
    });
    if (finalSection) {
      gsap.set(finalSection, {
        autoAlpha: 0,
        visibility: "hidden",
        pointerEvents: "none",
      });
    }
    pixelHandoffState = "sword";
    finalHandoffState = "sword";
    window.dispatchEvent(new Event("swordScene:activate"));
  };

  const createPixelHandoffTimeline = (direction) => {
    if (!hasPixelHandoff) return null;

    const isForward = direction === "forward";
    const coverDelayKey = isForward ? "forwardDelay" : "reverseDelay";
    const clearDelayKey = isForward ? "forwardClearDelay" : "reverseClearDelay";
    const coverEnd = pixelBlocks.reduce((maxDelay, block) => {
      return Math.max(maxDelay, Number(block.dataset[coverDelayKey] || 0));
    }, 0) + 0.001;
    const revealStart = coverEnd + 0.08;
    const clearEnd = pixelBlocks.reduce((maxDelay, block) => {
      return Math.max(maxDelay, Number(block.dataset[clearDelayKey] || 0));
    }, 0) + revealStart + 0.001;

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "none" },
      onStart: () => {
        isPixelHandoffAnimating = true;
        pixelHandoffState = isForward ? "forward" : "backward";
        lockPixelScroll();
      },
      onComplete: () => {
        isPixelHandoffAnimating = false;
        pixelHandoffState = isForward ? "sword" : "manga";
        unlockPixelScroll();
      },
    });

    timeline
      .set(pixelStage, { autoAlpha: 1, visibility: "visible" }, 0)
      .set(pixelBlocks, { autoAlpha: 0 }, 0);

    pixelBlocks.forEach((block) => {
      timeline.to(block, {
        autoAlpha: 1,
        duration: 0,
      }, Number(block.dataset[coverDelayKey] || 0));
    });

    timeline
      .set(isForward ? swordSection : mangaSection, {
        autoAlpha: 1,
        visibility: "visible",
        pointerEvents: "auto",
        scale: isForward ? 1.008 : 1,
      }, coverEnd)
      .set(isForward ? mangaSection : swordSection, {
        autoAlpha: 0,
        visibility: "hidden",
        pointerEvents: "none",
      }, coverEnd)
      .call(() => {
        if (isForward) {
          window.dispatchEvent(new Event("resize"));
          window.dispatchEvent(new Event("swordScene:activate"));
        } else {
          window.dispatchEvent(new Event("swordScene:deactivate"));
          setFinalMangaVisualState();
        }
      }, null, coverEnd + 0.01);

    if (isForward) {
      timeline.to(swordSection, {
        scale: 1,
        duration: 0.32,
        ease: "power3.out",
      }, coverEnd);
    }

    pixelBlocks.forEach((block) => {
      timeline.to(block, {
        autoAlpha: 0,
        duration: 0,
      }, revealStart + Number(block.dataset[clearDelayKey] || 0));
    });

    timeline
      .set(pixelBlocks, { autoAlpha: 0 }, clearEnd)
      .set(pixelStage, { autoAlpha: 0, visibility: "hidden" }, clearEnd);

    return timeline;
  };

  const pixelForwardTimeline = createPixelHandoffTimeline("forward");
  const pixelBackwardTimeline = createPixelHandoffTimeline("backward");

  const createFinalHandoffTimeline = (direction) => {
    if (!hasFinalHandoff) return null;

    const isForward = direction === "forward";
    const coverDelayKey = isForward ? "forwardDelay" : "reverseDelay";
    const clearDelayKey = isForward ? "forwardClearDelay" : "reverseClearDelay";
    const coverEnd = pixelBlocks.reduce((maxDelay, block) => {
      return Math.max(maxDelay, Number(block.dataset[coverDelayKey] || 0));
    }, 0) + 0.001;
    const revealStart = coverEnd + 0.08;
    const clearEnd = pixelBlocks.reduce((maxDelay, block) => {
      return Math.max(maxDelay, Number(block.dataset[clearDelayKey] || 0));
    }, 0) + revealStart + 0.001;

    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "none" },
      onStart: () => {
        isPixelHandoffAnimating = true;
        finalHandoffState = isForward ? "forward" : "backward";
        lockPixelScroll();
      },
      onComplete: () => {
        isPixelHandoffAnimating = false;
        finalHandoffState = isForward ? "final" : "sword";
        pixelHandoffState = "sword";
        unlockPixelScroll();
      },
    });

    timeline
      .set(pixelStage, { autoAlpha: 1, visibility: "visible" }, 0)
      .set(pixelBlocks, { autoAlpha: 0 }, 0);

    pixelBlocks.forEach((block) => {
      timeline.to(block, {
        autoAlpha: 1,
        duration: 0,
      }, Number(block.dataset[coverDelayKey] || 0));
    });

    timeline
      .set(isForward ? finalSection : swordSection, {
        autoAlpha: 1,
        visibility: "visible",
        pointerEvents: "auto",
        scale: 1,
      }, coverEnd)
      .set(isForward ? swordSection : finalSection, {
        autoAlpha: 0,
        visibility: "hidden",
        pointerEvents: "none",
      }, coverEnd)
      .call(() => {
        if (isForward) {
          window.dispatchEvent(new Event("swordScene:deactivate"));
        } else {
          window.dispatchEvent(new Event("resize"));
          window.dispatchEvent(new Event("swordScene:activate"));
        }
      }, null, coverEnd + 0.01);

    pixelBlocks.forEach((block) => {
      timeline.to(block, {
        autoAlpha: 0,
        duration: 0,
      }, revealStart + Number(block.dataset[clearDelayKey] || 0));
    });

    timeline
      .set(pixelBlocks, { autoAlpha: 0 }, clearEnd)
      .set(pixelStage, { autoAlpha: 0, visibility: "hidden" }, clearEnd);

    return timeline;
  };

  const finalForwardTimeline = createFinalHandoffTimeline("forward");
  const finalBackwardTimeline = createFinalHandoffTimeline("backward");

  const playPixelForward = () => {
    if (!pixelForwardTimeline || isPixelHandoffAnimating || pixelHandoffState !== "manga") return;
    pixelBackwardTimeline?.pause(0);
    setFinalMangaVisualState();
    pixelForwardTimeline.play(0);
  };

  const playPixelBackward = () => {
    if (!pixelBackwardTimeline || isPixelHandoffAnimating || pixelHandoffState !== "sword" || finalHandoffState === "final") return;
    pixelForwardTimeline?.pause(0);
    pixelBackwardTimeline.play(0);
  };

  const playFinalForward = () => {
    if (!finalForwardTimeline || isPixelHandoffAnimating || finalHandoffState !== "sword") return;
    if (pixelHandoffState !== "sword") {
      pixelForwardTimeline?.pause(0);
      pixelBackwardTimeline?.pause(0);
      setFinalMangaVisualState();
      if (mangaSection) {
        gsap.set(mangaSection, {
          autoAlpha: 0,
          visibility: "hidden",
          pointerEvents: "none",
        });
      }
      if (swordSection) {
        gsap.set(swordSection, {
          autoAlpha: 1,
          visibility: "visible",
          pointerEvents: "auto",
          scale: 1,
        });
        window.dispatchEvent(new Event("resize"));
        window.dispatchEvent(new Event("swordScene:activate"));
      }
      pixelHandoffState = "sword";
    }
    finalBackwardTimeline?.pause(0);
    finalForwardTimeline.play(0);
  };

  const playFinalBackward = () => {
    if (!finalBackwardTimeline || isPixelHandoffAnimating || finalHandoffState !== "final") return;
    finalForwardTimeline?.pause(0);
    finalBackwardTimeline.play(0);
  };

  let isVideoPlaying = false;

  const playVideo = () => {
    if (!video || isVideoPlaying) return;
    isVideoPlaying = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.play().catch(() => {
      isVideoPlaying = false;
    });
  };

  const pauseVideo = (shouldReset = false) => {
    if (!video) return;
    video.pause();
    isVideoPlaying = false;
    if (shouldReset) {
      video.currentTime = 0;
    }
  };

  const master = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: stack,
      start: "bottom bottom",
      end: () => `+=${getTotalScroll()}`,
      pin: stack,
      pinSpacing: false,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefreshInit: syncSceneHeight,
      onEnter: playVideo,
      onEnterBack: playVideo,
      onUpdate: (self) => {
        if (self.progress > 0.04 && self.progress < 0.62) {
          playVideo();
        } else if (self.progress >= 0.68) {
          pauseVideo();
        }
        if (self.progress >= finalTriggerProgress) {
          playFinalForward();
        } else if (self.progress < finalTriggerProgress - 0.003) {
          playFinalBackward();
        }
        if (self.progress >= pixelTriggerProgress && self.progress < finalTriggerProgress) {
          playPixelForward();
        } else if (self.progress < pixelTriggerProgress - 0.003) {
          playPixelBackward();
        }
      },
      onLeave: pauseVideo,
      onLeaveBack: () => pauseVideo(true),
    },
  });

  const timelineDurationHold = { value: 0 };
  master.to(timelineDurationHold, {
    value: 1,
    duration: timelineUnits,
  }, 0);

  master
    // Section overlap: the dark scene moves upward over the pinned hero.
    .to(nextSection, {
      yPercent: 0,
      duration: 1,
    }, 0)
    // Media reveal: the video block expands from a smaller cinematic frame.
    .to(media, {
      scale: 1,
      clipPath: "inset(0% 0% round 0px)",
      borderRadius: 0,
      width: "100vw",
      height: "100%",
      duration: 0.62,
    }, 0.38);

  if (mangaSection && mangaFrames.length) {
    const storyStart = storyStartUnit;

    const firstImage = mangaFrames[0].querySelector("img");

    master
      // Manga section overlap: the storytelling section rises over the video scene.
      .to(mangaSection, {
        yPercent: 0,
        duration: 1,
      }, 1.02);

    if (mangaStage) {
      master.to(mangaStage, {
        y: "-5vw",
        height: "100%",
        duration: 0.52,
      }, 1.9);
    }

    if (firstImage) {
      master.to(firstImage, {
        scale: 1,
        duration: 0.7,
      }, 1.82);
    }

    let cursor = storyStart;

    for (let index = 0; index < mangaFrames.length - 1; index += 1) {
      const currentCopy = mangaCopies[index];
      const nextFrame = mangaFrames[index + 1];
      const nextCopy = mangaCopies[index + 1];
      const nextImage = nextFrame.querySelector("img");

      if (currentCopy) {
        master.to(currentCopy, {
          y: "-72vh",
          duration: 1.05,
        }, cursor);
      }

      master.to(nextFrame, {
        clipPath: "inset(0% 0 0 0)",
        scale: 1,
        duration: 0.98,
      }, cursor + 0.62);

      if (nextImage) {
        master.to(nextImage, {
          scale: 1,
          duration: 0.98,
        }, cursor + 0.62);
      }

    if (nextCopy) {
      master.to(nextCopy, {
        y: 0,
        duration: 0.98,
      }, cursor + 0.62);
    }

    cursor += storyStepUnit;
  }

    if (hasPixelHandoff) {
      const handoffHold = { value: 0 };
      master.call(setFinalMangaVisualState, null, cursor);
      master.to(handoffHold, {
        value: 1,
        duration: 0.2,
      }, cursor + 0.08);
    }

  }

  if (hasFinalHandoff) {
    const finalStart = storyTimelineUnits + pixelHandoffTimelineUnits + swordHoldTimelineUnits + finalHandoffTimelineUnits;

    if (prefersReducedMotion) {
      master
        .set(finalTrack, { y: getFinalFooterTargetY }, finalStart)
        .set(finalMedia, {
          xPercent: -50,
          yPercent: -50,
          autoAlpha: 1,
          top: "50%",
          scale: 1,
          clipPath: "inset(0% 0% round 0px)",
          width: "100vw",
          height: "100%",
        }, finalStart)
        .set(finalAsset, { scale: 1 }, finalStart)
        .set(finalFooter, { autoAlpha: 1 }, finalStart);
    } else {
      master
        .set(finalTrack, { y: 0 }, finalStart)
        .to(finalTrack, {
          y: () => -window.innerHeight,
          duration: 1,
        }, finalStart)
        .to(finalMedia, {
          top: "50%",
          yPercent: -50,
          width: "100vw",
          scale: 1,
          duration: 0.36,
        }, finalStart + finalRevealStartOffset)
        .to(finalMedia, {
          clipPath: "inset(0% 0% round 0px)",
          height: "100%",
          duration: 0.62,
        }, finalStart + finalRevealStartOffset)
        .to(finalAsset, {
          scale: 1,
          duration: 0.62,
        }, finalStart + finalRevealStartOffset)
        .to(finalTrack, {
          y: getFinalFooterTargetY,
          duration: 0.12,
        }, finalStart + 1);
    }
  }

  if (video) {
    video.addEventListener("loadedmetadata", () => {
      scheduleRefresh();
    }, { once: true });
  }

  mangaFrames.forEach((frame) => {
    const image = frame.querySelector("img");
    if (image) {
      image.addEventListener("load", scheduleRefresh, { once: true });
    }
  });

  if (finalAsset) {
    finalAsset.addEventListener("load", scheduleRefresh, { once: true });
  }

  window.addEventListener("resize", scheduleRefresh);
  window.addEventListener("load", scheduleRefresh, { once: true });
}
