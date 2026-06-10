
You are a senior creative frontend developer and Three.js specialist.

I need you to build one premium 3D website section using only HTML, CSS, JavaScript, and Three.js. This section must match the provided reference image as closely as possible.

Project context:
- The website is already built using vanilla HTML, CSS, and JavaScript.
- Do not use React, Next.js, Vue, Spline, Webflow, or any framework.
- Use vanilla Three.js with ES modules.
- I have provided a folder named `xyz`.
- Inside the folder, you will find:
  1. A reference design image showing the exact visual direction.
  2. A sword 3D model in GLB format.
- For now, do not use wall or floor textures. Build the wall, floor, clover, panels, lighting, and atmosphere using Three.js geometry and materials only.
- Later I will add textures, but the first version must be clean, buildable, and visually close using simple materials.

Main goal:
Create a full-screen 3D section where:
- A large dark metallic sword floats in the center foreground.
- The sword is fully visible from handle to tip.
- The sword is slightly diagonal, similar to the reference image.
- The sword can be rotated/interacted with using mouse drag or touch drag.
- Only the sword should rotate/interact.
- The background wall, floor, clover, camera, and environment must stay fixed.
- Behind the sword there must be a dark semi-realistic anime-style wall made in Three.js.
- A small glowing red five-leaf clover emblem must be centered on the wall behind the sword.
- The clover must behave like a red light source.
- Red light from the clover must visibly affect the sword, especially as red rim light on the blade edges and hilt.
- A little floor must be visible below, so the sword feels suspended in a 3D space above the ground.
- The visual mood should be dark, minimal, cinematic, premium, and semi-realistic anime inspired.
- The final result should feel like the reference image: dark stone-like wall, subtle side panels, floor, red glowing clover, floating sword, red reflection/glow below sword.

Very important:
Do not create a busy fantasy temple.
Do not add characters.
Do not add text.
Do not add UI cards.
Do not add random particles everywhere.
Do not make the camera rotate.
Do not use OrbitControls for the whole scene.
Do not move the background on mouse movement.
Do not use image background.
The wall and floor must be Three.js geometry.
For now, do not use texture maps. Use simple materials only.
```

---

# Expected File Structure

```txt
xyz/
├── index.html
├── style.css
├── script.js
├── assets/
│   └── reference.png
├── models/
│   └── sword.glb
```

Agar sword file ka naam different ho, code mein correct path update karna:

```txt
./models/sword.glb
```

---

# Technical Stack

```txt
Use:
- HTML
- CSS
- JavaScript
- Three.js
- GLTFLoader
- EffectComposer
- RenderPass
- UnrealBloomPass

Do not use:
- React
- Next.js
- Tailwind
- Webflow
- Spline
- external 3D scene builders
```

Use Three.js CDN imports inside `script.js`:

```js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
```

---

# HTML Requirements

Create a single section like this:

```html
<section class="sword-hero-section">
  <canvas id="swordScene"></canvas>
  <div class="vignette-overlay"></div>
</section>
```

Requirements:

```txt
- The canvas fills the whole section.
- The section should be full viewport height.
- The vignette overlay should darken edges like the reference image.
- No heading, no text, no buttons for now.
```

---

# CSS Requirements

The section should feel cinematic and full-screen.

Use this structure:

```css
html,
body {
  margin: 0;
  padding: 0;
  background: #030303;
  overflow-x: hidden;
}

.sword-hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 720px;
  overflow: hidden;
  background: #030303;
}

#swordScene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

#swordScene:active {
  cursor: grabbing;
}

.vignette-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background:
    radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,0.75) 100%),
    linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.48));
}

@media (max-width: 768px) {
  .sword-hero-section {
    height: 85vh;
    min-height: 560px;
  }
}
```

---

# Three.js Scene Requirements

The scene must be built with these core parts:

```txt
1. Fixed camera
2. Fixed background group
3. Dark wall geometry
4. Side architectural panels
5. Floor plane
6. Circular floor mark / glow below sword
7. Glowing red five-leaf clover
8. Red light from clover position
9. Loaded sword GLB
10. Sword-only drag rotation
11. Bloom post-processing
12. Subtle fog / depth
```

---

# Camera Setup

The camera must be fixed and must not respond to user interaction.

Suggested starting values:

```js
const camera = new THREE.PerspectiveCamera(
  38,
  width / height,
  0.1,
  100
);

camera.position.set(0, 0.35, 6.2);
camera.lookAt(0, 0.05, 0);
```

Visual goal:

```txt
- The wall should appear slightly behind the sword.
- A little floor should be visible.
- Sword should dominate the center.
- Clover should be visible behind upper/middle sword area.
```

---

# Renderer Setup

Use cinematic tone mapping:

```js
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});

renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

---

# Scene Background And Fog

Use dark background and subtle fog:

```js
scene.background = new THREE.Color('#030303');
scene.fog = new THREE.Fog('#030303', 6, 14);
```

Fog should be subtle, not too strong.

---

# 3D Background Composition

Create one `backgroundGroup`. This group must stay fixed forever.

```js
const backgroundGroup = new THREE.Group();
scene.add(backgroundGroup);
```

Do not rotate or animate this group except maybe very subtle clover light pulse.
Wall and floor must not move with mouse.

---

## Back Wall

Create a large dark wall behind the sword.

Suggested geometry:

```js
const wall = new THREE.Mesh(
  new THREE.BoxGeometry(9.5, 5.4, 0.22),
  wallMaterial
);
wall.position.set(0, 0.55, -2.1);
```

Material should be dark charcoal/black:

```js
const wallMaterial = new THREE.MeshStandardMaterial({
  color: '#171313',
  roughness: 0.9,
  metalness: 0.02
});
```

The wall should look like simple dark stone/concrete even without texture.

---

## Center Wall Panel

In the reference image, the wall has a central vertical panel behind the clover. Make a subtle center panel.

```js
const centerPanel = new THREE.Mesh(
  new THREE.BoxGeometry(3.65, 4.65, 0.06),
  new THREE.MeshStandardMaterial({
    color: '#121010',
    roughness: 0.85,
    metalness: 0.04
  })
);

centerPanel.position.set(0, 0.55, -1.94);
backgroundGroup.add(centerPanel);
```

This panel should be subtle, not bright.

---

## Wall Panel Lines

Add thin vertical seams like the reference image.

Use small box geometries:

```txt
- One vertical seam at x = -1.45
- One vertical seam at x = 1.45
- One lower horizontal ledge
```

Material:

```js
const seamMaterial = new THREE.MeshBasicMaterial({
  color: '#070707'
});
```

Example:

```js
const seam1 = new THREE.Mesh(
  new THREE.BoxGeometry(0.018, 4.8, 0.04),
  seamMaterial
);
seam1.position.set(-1.45, 0.55, -1.88);

const seam2 = seam1.clone();
seam2.position.x = 1.45;
```

These seams help the wall look close to the reference even without textures.

---

## Side Panels / Pillars

The reference has subtle left/right dark architectural vertical elements. Add simple side panels.

Create a reusable function:

```txt
createSidePanel(x)
```

Each side panel should include:

```txt
- A tall vertical rectangular pillar
- A thin inset line
- A base block near floor
- Optional small decorative thin vertical line
```

Suggested positions:

```txt
Left side x = -3.65
Right side x = 3.65
z around -1.8
```

Material should be very dark:

```js
const trimMaterial = new THREE.MeshStandardMaterial({
  color: '#0b0b0d',
  roughness: 0.75,
  metalness: 0.1
});
```

Important:

```txt
- Keep side panels subtle.
- Do not make them too decorative.
- They should support the scene, not distract from sword.
```

---

## Lower Wall Ledge

Add a horizontal ledge where wall meets floor.

```js
const lowerLedge = new THREE.Mesh(
  new THREE.BoxGeometry(8.4, 0.16, 0.28),
  trimMaterial
);
lowerLedge.position.set(0, -1.55, -1.72);
```

This gives depth like the reference.

---

# Floor

Create a dark floor plane.

```js
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 7),
  floorMaterial
);

floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -1.92, 0.35);
```

Material:

```js
const floorMaterial = new THREE.MeshStandardMaterial({
  color: '#121010',
  roughness: 0.64,
  metalness: 0.08
});
```

The floor should be visible only at the bottom portion.
It should not dominate the section.

---

# Floor Circular Mark And Red Glow

The reference image has a circular mark and red light reflection below the sword. Add both.

## Circular ring

```js
const ring = new THREE.Mesh(
  new THREE.RingGeometry(0.95, 1.02, 96),
  new THREE.MeshBasicMaterial({
    color: '#ff1515',
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide
  })
);

ring.rotation.x = -Math.PI / 2;
ring.position.set(0, -1.905, 0.05);
backgroundGroup.add(ring);
```

## Red floor glow

```js
const floorGlow = new THREE.Mesh(
  new THREE.CircleGeometry(1.35, 64),
  new THREE.MeshBasicMaterial({
    color: '#ff1111',
    transparent: true,
    opacity: 0.30,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);

floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.set(0, -1.895, 0.05);
backgroundGroup.add(floorGlow);
```

The floor glow should feel soft and red, not like a solid disk.
If it looks too flat, reduce opacity to `0.18`.

---

# Five-Leaf Clover Requirement

This is very important.

Create the clover using Three.js geometry, not image.

The clover must:

```txt
- Have exactly five rounded heart-like leaves/petals.
- Be red.
- Be centered on the back wall.
- Be behind the sword.
- Look like a glowing emblem.
- Behave visually like a red light source.
- Cast red feel onto the wall, floor, and sword.
```

Position:

```js
cloverGroup.position.set(0, 1.25, -1.58);
```

Scale should be small/medium, not huge.

Visual target:

```txt
- Similar to reference image.
- The clover should be above the sword center.
- It should not cover the whole wall.
- It should be readable even when sword overlaps it.
```

Implementation approach:

```txt
Create one heart/petal shape with THREE.Shape.
Create five petals from that shape.
Rotate each petal around center.
Use MeshBasicMaterial red for petals.
Add additive transparent circular glow behind it.
Add red PointLight at clover position.
Use Bloom pass to make it glow.
```

Petal material:

```js
const cloverMaterial = new THREE.MeshBasicMaterial({
  color: '#ff1a1a',
  transparent: true,
  opacity: 0.95
});
```

Glow material:

```js
const cloverGlowMaterial = new THREE.MeshBasicMaterial({
  color: '#ff1616',
  transparent: true,
  opacity: 0.22,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
```

Clover glow should pulse very subtly:

```txt
Do not make it flashy.
Only subtle breathing glow.
```

---

# Lighting Requirements

Lighting is critical. The sword must look dark metallic but visible.
The red clover must create red rim light.

Use these lights:

## Ambient Light

```js
const ambientLight = new THREE.AmbientLight('#ffffff', 0.13);
scene.add(ambientLight);
```

Low ambient only.

## White Key Light

This creates silver highlights on sword.

```js
const keyLight = new THREE.DirectionalLight('#ffffff', 1.35);
keyLight.position.set(-2.5, 2.6, 4.2);
keyLight.castShadow = true;
scene.add(keyLight);
```

## Red Clover Point Light

This is the main red glow source.

```js
const redPointLight = new THREE.PointLight('#ff1616', 8.8, 8.5, 1.8);
redPointLight.position.set(0, 1.25, -1.25);
scene.add(redPointLight);
```

## Red Rim Light

This helps sword edge glow red like the reference.

```js
const redRimLight = new THREE.DirectionalLight('#ff1212', 2.6);
redRimLight.position.set(1.8, 1.1, -2.2);
scene.add(redRimLight);
```

## Floor Red Light

This supports red reflection under sword.

```js
const floorRedLight = new THREE.PointLight('#ff1717', 2.5, 4.5);
floorRedLight.position.set(0, -1.25, 0.15);
scene.add(floorRedLight);
```

---

# Sword GLB Loading Requirements

Load the sword GLB from:

```txt
./models/sword.glb
```

Use `GLTFLoader`.

After loading:

```txt
- Add sword to a dedicated `swordGroup`.
- Center the model using Box3.
- Set material properties for metallic look.
- Enable castShadow and receiveShadow.
- Scale sword until it matches reference composition.
- Position sword in front of wall.
- Apply default diagonal rotation.
```

Important:

```js
const swordGroup = new THREE.Group();
scene.add(swordGroup);
```

After loading:

```js
const box = new THREE.Box3().setFromObject(swordModel);
const center = box.getCenter(new THREE.Vector3());
swordModel.position.sub(center);
```

Suggested initial values:

```js
swordModel.scale.setScalar(1.55);

swordGroup.position.set(0, -0.28, 0.25);
swordGroup.rotation.set(0.18, -0.12, -0.58);
```

But adjust based on actual GLB size.

The sword should appear:

```txt
- Centered
- Floating above floor
- Fully visible
- Tip near lower-right area
- Handle toward upper-left
- Similar diagonal angle to reference
```

Important note:
The exact GLB might have a different orientation. If sword appears horizontal, upside down, too small, or too large, adjust rotation and scale until it matches the reference image.

Most important angle value:

```js
swordGroup.rotation.z = -0.58;
```

Tuning:

```txt
-0.45 = less diagonal
-0.58 = reference-like diagonal
-0.70 = more diagonal
```

---

# Sword Material Requirements

For every mesh inside sword:

```js
child.castShadow = true;
child.receiveShadow = true;

if (child.material) {
  child.material.metalness = Math.max(child.material.metalness || 0.75, 0.82);
  child.material.roughness = Math.min(child.material.roughness || 0.48, 0.42);
  child.material.needsUpdate = true;
}
```

Visual goal:

```txt
- Dark grey/black metal
- Sharp silver highlights
- Red rim light on one edge
- Not too bright
- Not fully black
```

If sword is too dark:

```txt
Increase keyLight intensity.
Increase ambientLight slightly from 0.13 to 0.18.
Reduce toneMappingExposure if overblown.
```

If sword is too shiny:

```txt
Increase roughness to 0.55.
Reduce metalness to 0.65.
```

---

# Interaction Requirements

This is very important.

User should be able to drag/rotate the sword only.

```txt
- Mouse drag left/right rotates sword around Y axis.
- Mouse drag up/down rotates sword around X axis slightly.
- Background must not move.
- Camera must not move.
- Clover must not move.
- Floor and wall must not move.
- Sword should retain its diagonal Z angle.
- Add smooth lerp so rotation feels premium.
```

Do not use OrbitControls.

Use custom pointer events on canvas.

Rotation behavior:

```js
targetRotationY += deltaX * 0.008;
targetRotationX += deltaY * 0.006;
targetRotationX = Math.max(-0.75, Math.min(0.75, targetRotationX));
```

In animation loop:

```js
currentRotationX += (targetRotationX - currentRotationX) * 0.08;
currentRotationY += (targetRotationY - currentRotationY) * 0.08;

swordGroup.rotation.x = currentRotationX;
swordGroup.rotation.y = currentRotationY;
swordGroup.rotation.z = -0.58;
```

Also add a subtle floating animation:

```js
swordGroup.position.y = -0.28 + Math.sin(time * 1.15) * 0.035;
```

The sword should feel suspended in air.

---

# Post Processing Requirements

Use `EffectComposer` with `UnrealBloomPass`.

Bloom is necessary for:

```txt
- Red clover glow
- Red rim light
- Cinematic glow on floor
```

Suggested values:

```js
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.72,
  0.48,
  0.16
);
```

If glow is too strong:

```txt
strength: 0.45
radius: 0.35
threshold: 0.2
```

If glow is too weak:

```txt
strength: 0.85
radius: 0.55
threshold: 0.12
```

---

# Animation Requirements

Animation should be subtle.

Allowed animation:

```txt
- Sword subtle floating up/down.
- Clover glow subtle breathing/pulsing.
- Red light intensity subtle pulsing.
```

Not allowed:

```txt
- Camera moving.
- Background moving.
- Wall rotating.
- Excessive particles.
- Clover spinning.
- Sword auto spinning fast.
```

Clover pulse example:

```js
cloverGlow1.material.opacity = 0.24 + Math.sin(time * 2.2) * 0.04;
cloverGlow2.material.opacity = 0.10 + Math.sin(time * 1.8) * 0.03;
redPointLight.intensity = 8.2 + Math.sin(time * 2.0) * 0.55;
```

---

# Responsiveness Requirements

Desktop:

```txt
- Section height: 100vh
- Min-height: 720px
- Sword large and centered
```

Mobile:

```txt
- Section height: 85vh
- Min-height: 560px
- Sword should still be fully visible
- Reduce sword scale if needed
- Camera z can be increased slightly
```

On resize:

```js
camera.aspect = width / height;
camera.updateProjectionMatrix();

renderer.setSize(width, height);
composer.setSize(width, height);
bloomPass.setSize(width, height);
```

Optional mobile adjustment:

```js
if (window.innerWidth < 768) {
  camera.position.z = 7.2;
  swordGroup.scale.setScalar(0.82);
}
```

Only add this if needed.

---

# Visual Matching Checklist

The final result must match the reference image in feel and composition.

Before finishing, compare with the reference image and check:

```txt
[ ] Full-screen dark cinematic section
[ ] No text
[ ] No UI panels
[ ] Wall is fixed and behind sword
[ ] Floor is visible at bottom
[ ] Sword is centered and fully visible
[ ] Sword is diagonal like reference
[ ] Sword floats above floor
[ ] Five-leaf red clover is centered on back wall
[ ] Clover glows red
[ ] Red light spills on wall/floor
[ ] Sword gets red rim light
[ ] Floor has subtle red glow under sword
[ ] Side wall panels exist but are subtle
[ ] Background does not move on mouse drag
[ ] Only sword rotates on mouse drag
[ ] Bloom/vignette gives cinematic look
[ ] Scene remains minimal, not cluttered
```

---

# Do Not Do These

```txt
Do not use a static background image.
Do not use textures in first version.
Do not use OrbitControls.
Do not let the user rotate the whole scene.
Do not make wall/floor interactive.
Do not add random fantasy props.
Do not add characters.
Do not add text.
Do not make the clover green.
Do not make the clover too large.
Do not make the environment bright.
Do not use a realistic daylight setup.
Do not make the floor huge or distracting.
Do not use too many lights that destroy the dark mood.
```

---

# Deliverables

Create these files:

```txt
index.html
style.css
script.js
```

The section should run with a local server.

Example:

```bash
npx serve
```

or VS Code Live Server.

The final code must be clean, organized, and commented.

Use functions for:

```txt
- createWall()
- createSidePanel()
- createFloor()
- createClover()
- loadSword()
- setupLights()
- setupInteraction()
- handleResize()
```

This makes the code easy to modify later when textures are added.

---

# First Version Acceptance Criteria

The first version is considered successful if:

```txt
1. The whole scene is built in Three.js.
2. Background wall and floor are actual 3D geometry.
3. The sword GLB loads successfully.
4. The sword is centered, diagonal, floating, and fully visible.
5. User can drag to rotate only the sword.
6. The background remains fixed.
7. The red five-leaf clover is glowing on the wall.
8. Clover light creates red highlights on sword.
9. The overall feel is close to the provided reference image.
10. The scene is dark, minimal, cinematic, and premium.
```

---

# Tuning Guide After First Build

After building the first version, tune these values to match the reference:

## Sword too small or too big

```js
swordModel.scale.setScalar(1.55);
```

Change to:

```txt
1.25 = smaller
1.75 = bigger
2.0 = much bigger
```

## Sword not diagonal enough

```js
swordGroup.rotation.z = -0.58;
```

Change to:

```txt
-0.45 = less diagonal
-0.65 = more diagonal
```

## Clover too high or low

```js
cloverGroup.position.set(0, 1.25, -1.58);
```

Change Y:

```txt
1.05 = lower
1.45 = higher
```

## Red light not visible on sword

Increase:

```js
redPointLight.intensity = 10;
redRimLight.intensity = 3.2;
bloom strength = 0.85;
```

## Scene too bright

Decrease:

```js
ambientLight intensity
keyLight intensity
toneMappingExposure
```

## Scene too dark

Increase:

```js
ambientLight from 0.13 to 0.18
keyLight from 1.35 to 1.65
toneMappingExposure from 1.05 to 1.15
```

## Floor too visible

Move camera slightly up or darken floor material:

```js
floorMaterial.color = new THREE.Color('#0d0b0b');
```

## Clover glow too strong

Reduce:

```js
cloverGlow opacity
redPointLight intensity
bloom strength
```

---

# Later Texture Upgrade Plan

Do not implement this now, but keep code ready for it.

Later we will add:

```txt
- dark stone wall color map
- wall normal map
- wall roughness map
- dark floor color map
- floor normal map
- floor roughness map
- subtle crack decals
```

So write materials in a way that texture maps can be added later easily.

Example:

```js
const wallMaterial = new THREE.MeshStandardMaterial({
  color: '#171313',
  roughness: 0.9,
  metalness: 0.02
});
```

Later this can become:

```js
const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallColorMap,
  normalMap: wallNormalMap,
  roughnessMap: wallRoughnessMap,
  color: '#171313',
  roughness: 0.9,
  metalness: 0.02
});
```

---

# Final Instruction

Make the section visually match the provided reference image as closely as possible, but build it procedurally in Three.js without using background images or textures for now.

The most important feeling is:

```txt
A dark anime-inspired 3D wall chamber.
A glowing red five-leaf clover on the wall.
A dark metallic sword floating in front.
Red light from the clover reflecting on sword.
A little floor visible below.
Only the sword is interactive.
Everything else is fixed.
Minimal, cinematic, premium, and buildable.
```

````

---

## Agent Ko Saath Mein Ye Short Note Bhi De Dena

Is detailed prompt ke saath ye short note bhi paste kar dena:

```txt
Important: Reference image is the visual target. Do not copy it as a background image. Recreate the scene using Three.js geometry. First create a clean non-textured version. Focus on composition, sword placement, red lighting, clover glow, and sword-only interaction. Textures will be added later.
````

---

## Folder Mein Agent Ko Ye Resources Do

```txt
xyz/
├── reference/
│   └── selected-design.png
├── models/
│   └── sword.glb
├── index.html
├── style.css
└── script.js
```

Agar abhi files blank hain, agent ko bolna ki woh `index.html`, `style.css`, aur `script.js` create kare.

---

## सबसे Important Line Jo Agent Ko Clear Karni Hai

```txt
The whole scene should be 3D, but interaction should affect only the sword, not the environment.
```

Ye line sabse important hai, kyunki agar agent ne OrbitControls laga diya toh पूरा scene घूमने लगेगा, jo tum nahi chahte.

---
