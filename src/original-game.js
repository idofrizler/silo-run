import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

const LEVEL_HEIGHT = 7.6;
const START_LEVEL = 67;
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const PLAYER_RADIUS = 0.38;
const PLAYER_HEIGHT = 1.9;
const COLLISION_CELL_SIZE = 6;
const STAIR_MIN_RADIUS = 4.05;
const STAIR_MAX_RADIUS = 5.7;
const SOLID_INSTANCE_NAME =
  /^shell-(box|cyl|column|bigPipe|door|rack|bench)(#\d+)?$/;

function waitForOriginalApp() {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const check = () => {
      if (window.app && window.__LAX_READY__) {
        resolve(window.app);
      } else if (performance.now() - started > 90000) {
        reject(new Error("The original Silo scene did not finish loading."));
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

function createCharacter() {
  const character = new THREE.Group();
  character.name = "silo-run-player";

  const standard = (color, roughness = 0.75) =>
    new THREE.MeshStandardMaterial({ color, roughness });
  const add = (parent, geometry, surface, position) => {
    const object = new THREE.Mesh(geometry, surface);
    object.position.copy(position);
    object.castShadow = true;
    parent.add(object);
    return object;
  };

  const skin = standard(0xb98262, 0.68);
  const jacket = standard(0x71382f, 0.82);
  const jacketDark = standard(0x382d2a, 0.88);
  const trousers = standard(0x293235, 0.86);
  const leather = standard(0x242321, 0.72);
  const canvas = standard(0x465046, 0.9);

  const torso = add(
    character,
    new THREE.CapsuleGeometry(0.34, 0.62, 8, 12),
    jacket,
    new THREE.Vector3(0, 1.22, 0),
  );
  torso.scale.z = 0.7;
  add(
    character,
    new THREE.BoxGeometry(0.58, 0.25, 0.34),
    trousers,
    new THREE.Vector3(0, 0.72, 0),
  );
  add(
    character,
    new THREE.BoxGeometry(0.5, 0.06, 0.38),
    leather,
    new THREE.Vector3(0, 0.85, 0),
  );
  add(
    character,
    new THREE.BoxGeometry(0.09, 0.1, 0.04),
    standard(0xa88a52, 0.5),
    new THREE.Vector3(0, 0.85, 0.21),
  );

  add(
    character,
    new THREE.CylinderGeometry(0.13, 0.15, 0.16, 10),
    skin,
    new THREE.Vector3(0, 1.72, 0),
  );
  const head = add(
    character,
    new THREE.SphereGeometry(0.25, 20, 14),
    skin,
    new THREE.Vector3(0, 1.94, 0),
  );
  head.scale.set(0.92, 1.08, 0.96);
  add(
    character,
    new THREE.SphereGeometry(0.255, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    standard(0x25211f, 0.9),
    new THREE.Vector3(0, 2.02, 0),
  );
  for (const side of [-1, 1]) {
    add(
      character,
      new THREE.SphereGeometry(0.04, 8, 6),
      skin,
      new THREE.Vector3(side * 0.235, 1.95, 0),
    );
    add(
      character,
      new THREE.SphereGeometry(0.025, 8, 6),
      standard(0x201b18, 0.55),
      new THREE.Vector3(side * 0.082, 1.99, 0.225),
    );
  }
  add(
    character,
    new THREE.ConeGeometry(0.035, 0.09, 8),
    skin,
    new THREE.Vector3(0, 1.93, 0.25),
  ).rotation.x = Math.PI / 2;

  add(
    character,
    new THREE.BoxGeometry(0.28, 0.08, 0.05),
    jacketDark,
    new THREE.Vector3(0, 1.53, 0.25),
  );
  for (const side of [-1, 1]) {
    const collar = add(
      character,
      new THREE.BoxGeometry(0.18, 0.2, 0.04),
      jacketDark,
      new THREE.Vector3(side * 0.11, 1.55, 0.25),
    );
    collar.rotation.z = side * 0.55;
  }

  const backpack = add(
    character,
    new THREE.BoxGeometry(0.5, 0.68, 0.24),
    canvas,
    new THREE.Vector3(0, 1.2, -0.29),
  );
  backpack.rotation.x = -0.08;
  for (const side of [-1, 1]) {
    add(
      character,
      new THREE.BoxGeometry(0.06, 0.68, 0.05),
      leather,
      new THREE.Vector3(side * 0.25, 1.25, 0.18),
    );
  }

  const limbs = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.43, 1.52, 0);
    character.add(arm);
    add(
      arm,
      new THREE.CapsuleGeometry(0.095, 0.3, 5, 8),
      jacket,
      new THREE.Vector3(0, -0.23, 0),
    );
    arm.rotation.z = side * 0.08;
    const forearm = add(
      arm,
      new THREE.CapsuleGeometry(0.08, 0.28, 5, 8),
      jacketDark,
      new THREE.Vector3(0, -0.59, 0.025),
    );
    forearm.rotation.x = -0.08;
    add(
      arm,
      new THREE.SphereGeometry(0.09, 10, 8),
      skin,
      new THREE.Vector3(0, -0.84, 0.045),
    );
    limbs[side < 0 ? "leftArm" : "rightArm"] = arm;

    const leg = new THREE.Group();
    leg.position.set(side * 0.17, 0.74, 0);
    character.add(leg);
    add(
      leg,
      new THREE.CapsuleGeometry(0.115, 0.3, 5, 8),
      trousers,
      new THREE.Vector3(0, -0.24, 0),
    );
    add(
      leg,
      new THREE.CapsuleGeometry(0.1, 0.28, 5, 8),
      trousers,
      new THREE.Vector3(0, -0.58, 0),
    );
    const boot = add(
      leg,
      new THREE.BoxGeometry(0.2, 0.16, 0.32),
      leather,
      new THREE.Vector3(0, -0.82, 0.07),
    );
    boot.rotation.x = -0.05;
    limbs[side < 0 ? "leftLeg" : "rightLeg"] = leg;
  }

  return { character, limbs };
}

async function loadProfessionalCharacter(model) {
  const loader = new FBXLoader();
  const modelUrl = new URL("./game/models/adventurer.fbx", document.baseURI);
  const humanoid = await loader.loadAsync(modelUrl.href);
  const primitiveChildren = [...model.character.children];

  humanoid.name = "quaternius-adventurer";
  humanoid.scale.setScalar(0.0115);
  humanoid.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
  });
  model.character.add(humanoid);
  primitiveChildren.forEach((child) => {
    child.visible = false;
  });

  const findClip = (name) =>
    humanoid.animations.find((clip) => clip.name.endsWith(`|${name}`));
  const mixer = new THREE.AnimationMixer(humanoid);
  const actions = Object.fromEntries(
    ["Idle", "Walk", "Run"].map((name) => {
      const clip = findClip(name);
      return [name.toLowerCase(), clip ? mixer.clipAction(clip) : null];
    }),
  );

  let activeAction = actions.idle;
  activeAction?.play();
  model.humanoid = humanoid;
  model.mixer = mixer;
  model.setAnimation = (state) => {
    const nextAction = actions[state];
    if (!nextAction || nextAction === activeAction) return;
    nextAction.reset().fadeIn(0.18).play();
    activeAction?.fadeOut(0.18);
    activeAction = nextAction;
  };
  return humanoid;
}

function stylePlayerAsJuliette(model, humanoid) {
  const headMesh = humanoid.getObjectByName("Adventurer_Head");
  const headMaterials = Array.isArray(headMesh?.material)
    ? headMesh.material
    : [headMesh?.material].filter(Boolean);
  const originalHair = headMaterials.find(
    (material) => material.name.toLowerCase() === "hair",
  );
  if (originalHair) originalHair.visible = false;

  const hair = new THREE.Group();
  hair.name = "juliette-hair";
  const blonde = new THREE.MeshStandardMaterial({
    color: 0x8d713e,
    roughness: 0.88,
  });
  const blondeDark = new THREE.MeshStandardMaterial({
    color: 0x6f542d,
    roughness: 0.9,
  });
  const addHair = (geometry, position, scale = null, material = blonde) => {
    const strand = new THREE.Mesh(geometry, material);
    strand.position.copy(position);
    if (scale) strand.scale.copy(scale);
    strand.castShadow = false;
    hair.add(strand);
    return strand;
  };

  addHair(
    new THREE.SphereGeometry(0.21, 20, 14, 0, TAU, 0, Math.PI * 0.64),
    new THREE.Vector3(0, 2.035, -0.008),
    new THREE.Vector3(0.94, 1, 0.9),
  );
  for (let index = -2; index <= 2; index += 1) {
    const strand = addHair(
      new THREE.CapsuleGeometry(0.038, 0.28 + (2 - Math.abs(index)) * 0.025, 6, 9),
      new THREE.Vector3(index * 0.052, 1.82, -0.155 + Math.abs(index) * 0.012),
      null,
      index % 2 === 0 ? blonde : blondeDark,
    );
    strand.rotation.z = index * 0.035;
  }
  for (const side of [-1, 1]) {
    const strand = addHair(
      new THREE.CapsuleGeometry(0.035, 0.25, 6, 10),
      new THREE.Vector3(side * 0.165, 1.82, -0.02),
    );
    strand.rotation.z = side * 0.08;
  }

  model.character.add(hair);
  model.hair = hair;
}

function stabilizeLighting(app) {
  app.scene.traverse((object) => {
    if (object.isHemisphereLight) object.intensity = Math.max(object.intensity, 0.9);
  });

  const navigationLight = new THREE.PointLight(0xffe8c7, 8, 22, 2);
  navigationLight.name = "silo-run-navigation-light";
  navigationLight.castShadow = false;
  app.scene.add(navigationLight);
  return navigationLight;
}

function lockToSilo18(app) {
  const root = document.documentElement;
  let restoring = false;

  const enforce = () => {
    const buttons = [...document.querySelectorAll("button")];
    const silo17Button = buttons.find(
      (button) => button.textContent.trim() === "Silo 17",
    );
    if (silo17Button) {
      silo17Button.disabled = true;
      silo17Button.setAttribute("aria-disabled", "true");
      silo17Button.title = "Silo 17 is unavailable in Silo Run";
    }

    if (
      !restoring &&
      (root.classList.contains("silo17") ||
        silo17Button?.classList.contains("active"))
    ) {
      restoring = true;
      app.silo.set("18");
      queueMicrotask(() => {
        restoring = false;
        enforce();
      });
    }
  };

  enforce();
  new MutationObserver(enforce).observe(root, {
    attributeFilter: ["class"],
    attributes: true,
  });
  const ui = document.querySelector("#ui");
  if (ui) {
    new MutationObserver(enforce).observe(ui, {
      childList: true,
      subtree: true,
    });
  }
}

function createNpcSystem(app, source, wallCollisions, playerPosition) {
  const npcGroup = new THREE.Group();
  npcGroup.name = "silo-run-npcs";
  app.groups.dynamic.add(npcGroup);

  const idleClip = source.animations.find((clip) => clip.name.endsWith("|Idle"));
  const walkClip = source.animations.find((clip) => clip.name.endsWith("|Walk"));
  const levelOffsets = [0, 0, 0, 0, 1, 1, -1, -1, 2, -2];
  const startingAngles = [
    -1.7,
    -1.35,
    -0.8,
    -0.25,
    0.5,
    2.2,
    -2.8,
    1.4,
    2.9,
    -0.45,
  ];
  const laneRadii = [21.3, 22.1, 22.9, 23.7, 24.5];
  const hueOffsets = [-0.12, -0.04, 0.06, 0.14, 0.24, 0.38, 0.52, 0.65];
  const npcs = [];
  let anchorLevel = START_LEVEL;

  function recolorClothing(visual, index) {
    visual.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      const variants = materials.map((material) => {
        const variant = material.clone();
        const name = variant.name.toLowerCase();
        if (
          variant.color &&
          !name.includes("skin") &&
          !name.includes("eye") &&
          !name.includes("hair") &&
          !name.includes("eyebrow")
        ) {
          variant.color.offsetHSL(
            hueOffsets[index % hueOffsets.length],
            0.04,
            (index % 3) * 0.035,
          );
        }
        return variant;
      });
      object.material = Array.isArray(object.material) ? variants : variants[0];
    });
  }

  function placeNpc(npc, preferredAngle = npc.angle) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const angle = preferredAngle + attempt * 0.23;
      const radius =
        laneRadii[(npc.index + Math.floor(attempt / 6)) % laneRadii.length];
      npc.position.set(
        Math.cos(angle) * radius,
        -npc.level * LEVEL_HEIGHT,
        Math.sin(angle) * radius,
      );
      if (!wallCollisions.blocksCylinder(npc.position, 0.34, 1.85)) {
        npc.angle = angle;
        npc.radius = radius;
        npc.group.position.copy(npc.position);
        npc.group.visible = true;
        return;
      }
    }
    npc.group.visible = false;
  }

  for (let index = 0; index < levelOffsets.length; index += 1) {
    const group = new THREE.Group();
    group.name = `silo-resident-${index + 1}`;
    const visual = cloneSkeleton(source);
    recolorClothing(visual, index);
    group.add(visual);
    npcGroup.add(group);

    const mixer = new THREE.AnimationMixer(visual);
    const stationary = index === 0;
    const animationClip = stationary ? idleClip : walkClip;
    const animation = animationClip ? mixer.clipAction(animationClip) : null;
    if (animation) {
      animation.timeScale = stationary ? 1 : 0.84 + (index % 4) * 0.06;
      animation.play();
      animation.time = (index * 0.17) % animationClip.duration;
    }
    const npc = {
      angle: startingAngles[index],
      direction: index % 2 === 0 ? 1 : -1,
      group,
      index,
      level: THREE.MathUtils.clamp(
        anchorLevel + levelOffsets[index],
        1,
        144,
      ),
      mixer,
      name: stationary ? "Mara" : `Resident ${index + 1}`,
      position: new THREE.Vector3(),
      radius: laneRadii[index % laneRadii.length],
      speed: 1.15 + (index % 5) * 0.1,
      stationary,
    };
    placeNpc(npc);
    npcs.push(npc);
  }

  function update(delta, playerLevel) {
    if (Math.abs(playerLevel - anchorLevel) >= 3) {
      const levelShift = playerLevel - anchorLevel;
      anchorLevel = playerLevel;
      for (const npc of npcs) {
        if (npc.stationary) continue;
        npc.level = THREE.MathUtils.clamp(npc.level + levelShift, 1, 144);
        placeNpc(npc);
      }
    }

    for (const npc of npcs) {
      npc.mixer.update(delta);
      if (!npc.group.visible || npc.stationary) continue;
      const nextAngle =
        npc.angle + (npc.direction * npc.speed * delta) / npc.radius;
      const candidate = new THREE.Vector3(
        Math.cos(nextAngle) * npc.radius,
        -npc.level * LEVEL_HEIGHT,
        Math.sin(nextAngle) * npc.radius,
      );
      const nearPlayer =
        Math.abs(candidate.y - playerPosition.y) < 1 &&
        candidate.distanceToSquared(playerPosition) < 1.3 * 1.3;
      if (
        nearPlayer ||
        wallCollisions.blocksCylinder(candidate, 0.34, 1.85)
      ) {
        npc.direction *= -1;
        continue;
      }

      const tangentX = -Math.sin(nextAngle) * npc.direction;
      const tangentZ = Math.cos(nextAngle) * npc.direction;
      npc.angle = nextAngle;
      npc.position.copy(candidate);
      npc.group.position.copy(candidate);
      npc.group.rotation.y = Math.atan2(tangentX, tangentZ);
    }
  }

  return { group: npcGroup, npcs, update };
}

function createQuestMarker() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    depthTest: false,
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(0, 2.9, 0);
  sprite.scale.setScalar(0.72);
  sprite.renderOrder = 1000;

  function setSymbol(symbol) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = symbol === "?" ? "#82c99a" : "#e9bd62";
    context.beginPath();
    context.arc(64, 64, 46, 0, TAU);
    context.fill();
    context.lineWidth = 6;
    context.strokeStyle = "#fff7df";
    context.stroke();
    context.fillStyle = "#1f2220";
    context.font = '900 72px "Segoe UI", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(symbol, 64, 67);
    texture.needsUpdate = true;
  }

  setSymbol("!");
  return { setSymbol, sprite };
}

function createFirstQuest(app, npcSystem, playerPosition) {
  const questGiver = npcSystem.npcs[0];
  const tracker = document.querySelector("#quest-tracker");
  const trackerTitle = tracker?.querySelector("strong");
  const objective = document.querySelector("#quest-objective");
  const prompt = document.querySelector("#quest-prompt");
  const dialogue = document.querySelector("#quest-dialogue");
  const speaker = document.querySelector("#quest-speaker");
  const dialogueText = document.querySelector("#quest-dialogue-text");
  const toast = document.querySelector("#quest-toast");
  if (
    !tracker ||
    !trackerTitle ||
    !objective ||
    !prompt ||
    !dialogue ||
    !speaker ||
    !dialogueText ||
    !toast
  ) {
    throw new Error("The quest interface is missing from the page.");
  }

  const marker = createQuestMarker();
  questGiver.group.add(marker.sprite);

  const relic = new THREE.Group();
  relic.name = "last-green-token";
  relic.position.set(-48.45, -66 * LEVEL_HEIGHT + 0.08, -35.28);

  const brass = new THREE.MeshStandardMaterial({
    color: 0xa9782c,
    emissive: 0x5c3a08,
    emissiveIntensity: 0.32,
    metalness: 0.82,
    roughness: 0.3,
  });
  const darkBrass = new THREE.MeshStandardMaterial({
    color: 0x47300f,
    metalness: 0.55,
    roughness: 0.45,
  });
  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.045, 32),
    brass,
  );
  coin.castShadow = true;
  relic.add(coin);

  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.012, 0.1),
    darkBrass,
  );
  trunk.position.y = 0.03;
  relic.add(trunk);
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 12, 8),
    darkBrass,
  );
  crown.scale.z = 0.65;
  crown.position.set(0, 0.03, -0.055);
  relic.add(crown);

  const glint = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.055),
    new THREE.MeshBasicMaterial({
      color: 0xffe2a0,
      transparent: true,
      opacity: 0.9,
    }),
  );
  glint.position.set(0.08, 0.18, 0);
  relic.add(glint);
  relic.visible = false;

  app.groups.dynamic.add(relic);

  const tape = new THREE.Group();
  tape.name = "good-supply-tape";
  tape.position.set(-54.55, -110 * LEVEL_HEIGHT + 0.32, -19.42);
  const tapeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9bd56,
    emissive: 0x5a4708,
    emissiveIntensity: 0.25,
    metalness: 0.08,
    roughness: 0.72,
  });
  const tapeCore = new THREE.MeshStandardMaterial({
    color: 0xe4d7a7,
    roughness: 0.92,
  });
  const roll = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.065, 12, 28),
    tapeMaterial,
  );
  roll.rotation.x = Math.PI / 2;
  tape.add(roll);
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.025, 24),
    tapeCore,
  );
  tape.add(core);
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 128;
  labelCanvas.height = 128;
  const labelContext = labelCanvas.getContext("2d");
  labelContext.fillStyle = "#eadb9d";
  labelContext.beginPath();
  labelContext.arc(64, 64, 58, 0, TAU);
  labelContext.fill();
  labelContext.fillStyle = "#3b3219";
  labelContext.font = '900 30px "Segoe UI", sans-serif';
  labelContext.textAlign = "center";
  labelContext.textBaseline = "middle";
  labelContext.fillText("GOOD", 64, 65);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.CircleGeometry(0.095, 24),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true }),
  );
  label.position.y = 0.018;
  label.rotation.x = -Math.PI / 2;
  tape.add(label);
  const tapeGlint = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.05),
    new THREE.MeshBasicMaterial({
      color: 0xffec9b,
      transparent: true,
      opacity: 0.9,
    }),
  );
  tapeGlint.position.set(0.1, 0.22, 0);
  tape.add(tapeGlint);
  tape.visible = false;
  app.groups.dynamic.add(tape);

  const introDialogue = [
    "A porter once showed me a brass token from before the Rebellion. Said he hid it where the Silo still remembers sunlight.",
    "He called the hiding place a room where the Silo pretends the outside still exists. That was all he would tell me.",
  ];
  const returnDialogue = [
    "A tree under an open sky… so the stories weren’t invented here.",
    "Keep it. Just don’t let Judicial see you carrying it.",
  ];
  const supplyDialogue = [
    "Mechanical needs a roll of tape that won’t split the first time it gets warm. Supply keeps insisting they’re good in Supply.",
    "Find the roll marked GOOD somewhere in their warehouse on Level 110. With all those racks, it may take some looking.",
  ];

  let state = "talk";
  let dialoguePages = null;
  let dialogueIndex = 0;
  let toastTime = 4.5;
  let searchTime = 0;

  trackerTitle.textContent = "THE LAST GREEN TOKEN";
  tracker.classList.add("show");
  objective.textContent = "Talk to Mara, the resident with the gold quest marker.";
  toast.textContent = "QUEST STARTED · THE LAST GREEN TOKEN";
  toast.classList.add("show");

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    toastTime = 4;
  }

  function closeDialogue() {
    dialogue.classList.remove("show");
    dialoguePages = null;
    prompt.classList.remove("show");
    prompt.textContent = "";
  }

  function finishDialogue() {
    closeDialogue();
    if (state === "talk") {
      state = "search";
      marker.sprite.visible = false;
      relic.visible = true;
      searchTime = 0;
      objective.textContent = "Find the brass token using Mara’s clues.";
      showToast("NEW OBJECTIVE · FIND THE BRASS TOKEN");
    } else if (state === "return") {
      state = "supplyOffer";
      marker.setSymbol("!");
      marker.sprite.visible = true;
      trackerTitle.textContent = "THEY’RE GOOD IN SUPPLY";
      objective.textContent = "Talk to Mara about another job.";
      showToast("QUEST COMPLETE · THE LAST GREEN TOKEN");
    } else if (state === "supplyOffer") {
      state = "supplySearch";
      marker.sprite.visible = false;
      tape.visible = true;
      searchTime = 0;
      objective.textContent =
        "Search Supply’s Level 110 warehouse for the roll marked GOOD.";
      showToast("QUEST STARTED · THEY’RE GOOD IN SUPPLY");
    }
  }

  function openDialogue(pages) {
    dialoguePages = pages;
    dialogueIndex = 0;
    speaker.textContent = "MARA · LEVEL 67";
    dialogueText.textContent = dialoguePages[dialogueIndex];
    dialogue.classList.add("show");
    prompt.classList.remove("show");
  }

  function advanceDialogue() {
    dialogueIndex += 1;
    if (dialogueIndex >= dialoguePages.length) {
      finishDialogue();
      return;
    }
    dialogueText.textContent = dialoguePages[dialogueIndex];
  }

  function near(point, distance) {
    return playerPosition.distanceToSquared(point) <= distance * distance;
  }

  function interact() {
    if (dialoguePages) {
      advanceDialogue();
      return true;
    }

    if (
      (state === "talk" || state === "return" || state === "supplyOffer") &&
      near(questGiver.position, 3.2)
    ) {
      openDialogue(
        state === "talk"
          ? introDialogue
          : state === "return"
            ? returnDialogue
            : supplyDialogue,
      );
      return true;
    }

    if (state === "search" && near(relic.position, 2.1)) {
      state = "return";
      relic.visible = false;
      marker.setSymbol("?");
      marker.sprite.visible = true;
      prompt.classList.remove("show");
      prompt.textContent = "";
      objective.textContent = "Bring the brass token back to Mara.";
      showToast(
        "RELIC FOUND · A brass token stamped with a tree beneath an open sky.",
      );
      return true;
    }

    if (state === "supplySearch" && near(tape.position, 2.1)) {
      state = "supplyComplete";
      tape.visible = false;
      tracker.classList.add("complete");
      objective.textContent = "Quest complete · They’re Good in Supply";
      prompt.classList.remove("show");
      prompt.textContent = "";
      showToast("QUEST COMPLETE · FOUND THE GOOD TAPE");
      return true;
    }

    return false;
  }

  function update(delta) {
    toastTime -= delta;
    if (toastTime <= 0) toast.classList.remove("show");

    if (state === "search" || state === "supplySearch") searchTime += delta;

    if (state === "search" && searchTime > 75) {
      objective.textContent =
        "Hint: Seek the place where the Silo manufactures daylight.";
    } else if (state === "supplySearch" && searchTime > 90) {
      objective.textContent =
        "Hint: Check the deeper rack rows, beside the stacked spools.";
    }

    const relicDistance = playerPosition.distanceTo(relic.position);
    const glintVisible = state === "search" && relicDistance < 7;
    glint.visible = glintVisible;
    if (glintVisible) {
      glint.rotation.y += delta * 2.8;
      const pulse = 0.75 + Math.sin(performance.now() * 0.006) * 0.25;
      glint.scale.setScalar(pulse);
    }
    const tapeDistance = playerPosition.distanceTo(tape.position);
    const tapeGlintVisible = state === "supplySearch" && tapeDistance < 6;
    tapeGlint.visible = tapeGlintVisible;
    if (tapeGlintVisible) {
      tapeGlint.rotation.y += delta * 2.8;
      const pulse = 0.75 + Math.sin(performance.now() * 0.006) * 0.25;
      tapeGlint.scale.setScalar(pulse);
    }

    if (dialoguePages) {
      prompt.classList.remove("show");
      return;
    }

    let message = "";
    if (
      (state === "talk" || state === "return" || state === "supplyOffer") &&
      near(questGiver.position, 3.2)
    ) {
      message = "E · Talk to Mara";
    } else if (state === "search" && near(relic.position, 2.1)) {
      message = "E · Inspect the brass glint";
    } else if (state === "supplySearch" && near(tape.position, 2.1)) {
      message = "E · Inspect the roll marked GOOD";
    }

    prompt.textContent = message;
    prompt.classList.toggle("show", Boolean(message));
  }

  return {
    get dialogueOpen() {
      return Boolean(dialoguePages);
    },
    get state() {
      return state;
    },
    interact,
    questGiver,
    relic,
    tape,
    update,
  };
}

function createGapTraversal(playerPosition, onArrive) {
  const prompt = document.querySelector("#quest-prompt");
  const status = document.querySelector("#game-status");
  const top = new THREE.Vector3(4.3, -90 * LEVEL_HEIGHT, -1.1);
  const bottom = new THREE.Vector3(4.3, -92 * LEVEL_HEIGHT, 1.1);
  const start = new THREE.Vector3();
  const destination = new THREE.Vector3();
  let elapsed = 0;
  let traveling = false;

  function nearEndpoint(point) {
    const horizontalDistance = Math.hypot(
      playerPosition.x - point.x,
      playerPosition.z - point.z,
    );
    return horizontalDistance < 5.5 && Math.abs(playerPosition.y - point.y) < 2.8;
  }

  function interact() {
    if (traveling) return true;
    const atTop = nearEndpoint(top);
    const atBottom = nearEndpoint(bottom);
    if (!atTop && !atBottom) return false;

    start.copy(playerPosition);
    destination.copy(atTop ? bottom : top);
    elapsed = 0;
    traveling = true;
    prompt?.classList.remove("show");
    if (status) {
      status.textContent = atTop
        ? "Climbing the Gap scaffold down to Level 92…"
        : "Climbing the Gap scaffold up to Level 90…";
    }
    return true;
  }

  function update(delta) {
    if (traveling) {
      elapsed += delta;
      const progress = THREE.MathUtils.clamp(elapsed / 3.2, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      playerPosition.lerpVectors(start, destination, eased);
      if (progress >= 1) {
        traveling = false;
        if (status) status.textContent = "";
        onArrive(destination);
      }
      return;
    }

    if (!prompt) return;
    if (nearEndpoint(top)) {
      prompt.textContent = "E · Climb the scaffold down to Level 92";
      prompt.classList.add("show");
    } else if (nearEndpoint(bottom)) {
      prompt.textContent = "E · Climb the scaffold up to Level 90";
      prompt.classList.add("show");
    }
  }

  return {
    get traveling() {
      return traveling;
    },
    bottom,
    interact,
    top,
    update,
  };
}

function createCollisionGrid(roots) {
  const cells = new Map();
  const obstacles = [];
  const instanceMatrix = new THREE.Matrix4();
  const worldMatrix = new THREE.Matrix4();

  const cellKey = (x, z) =>
    `${Math.floor(x / COLLISION_CELL_SIZE)},${Math.floor(z / COLLISION_CELL_SIZE)}`;
  const addToCells = (obstacle) => {
    const minCellX = Math.floor(obstacle.worldBounds.min.x / COLLISION_CELL_SIZE);
    const maxCellX = Math.floor(obstacle.worldBounds.max.x / COLLISION_CELL_SIZE);
    const minCellZ = Math.floor(obstacle.worldBounds.min.z / COLLISION_CELL_SIZE);
    const maxCellZ = Math.floor(obstacle.worldBounds.max.z / COLLISION_CELL_SIZE);
    for (let x = minCellX; x <= maxCellX; x += 1) {
      for (let z = minCellZ; z <= maxCellZ; z += 1) {
        const key = `${x},${z}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(obstacle);
      }
    }
  };

  for (const root of roots) {
    root.updateMatrixWorld(true);
    root.traverse((mesh) => {
      if (
        !mesh.isInstancedMesh ||
        mesh.count === 0 ||
        !SOLID_INSTANCE_NAME.test(mesh.name)
      ) {
        return;
      }
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();

      for (let index = 0; index < mesh.count; index += 1) {
        mesh.getMatrixAt(index, instanceMatrix);
        worldMatrix.multiplyMatrices(mesh.matrixWorld, instanceMatrix);
        const worldBounds = mesh.geometry.boundingBox
          .clone()
          .applyMatrix4(worldMatrix);
        const elements = worldMatrix.elements;
        const scaleX = Math.hypot(elements[0], elements[1], elements[2]);
        const scaleZ = Math.hypot(elements[8], elements[9], elements[10]);
        if (scaleX < 0.001 || scaleZ < 0.001) continue;

        const obstacle = {
          inverse: worldMatrix.clone().invert(),
          localBounds: mesh.geometry.boundingBox,
          scaleX,
          scaleZ,
          worldBounds,
        };
        obstacles.push(obstacle);
        addToCells(obstacle);
      }
    });
  }

  function nearby(point) {
    return cells.get(cellKey(point.x, point.z)) || [];
  }

  function blocksCylinder(point, radius = PLAYER_RADIUS, height = PLAYER_HEIGHT) {
    const top = point.y + height;
    const localPoint = new THREE.Vector3();
    for (const obstacle of nearby(point)) {
      const bounds = obstacle.worldBounds;
      if (top <= bounds.min.y + 0.08 || point.y + 0.08 >= bounds.max.y) continue;

      localPoint
        .set(point.x, THREE.MathUtils.clamp(point.y + height * 0.5, bounds.min.y, bounds.max.y), point.z)
        .applyMatrix4(obstacle.inverse);
      const localBounds = obstacle.localBounds;
      const dx = Math.max(
        localBounds.min.x - localPoint.x,
        0,
        localPoint.x - localBounds.max.x,
      );
      const dz = Math.max(
        localBounds.min.z - localPoint.z,
        0,
        localPoint.z - localBounds.max.z,
      );
      const normalizedX = (dx * obstacle.scaleX) / radius;
      const normalizedZ = (dz * obstacle.scaleZ) / radius;
      if (normalizedX * normalizedX + normalizedZ * normalizedZ < 1) return true;
    }
    return false;
  }

  function blocksSphere(point, radius) {
    const localPoint = new THREE.Vector3();
    for (const obstacle of nearby(point)) {
      const bounds = obstacle.worldBounds;
      if (point.y + radius <= bounds.min.y || point.y - radius >= bounds.max.y) {
        continue;
      }
      localPoint.copy(point).applyMatrix4(obstacle.inverse);
      const localBounds = obstacle.localBounds;
      const dx = Math.max(
        localBounds.min.x - localPoint.x,
        0,
        localPoint.x - localBounds.max.x,
      );
      const dz = Math.max(
        localBounds.min.z - localPoint.z,
        0,
        localPoint.z - localBounds.max.z,
      );
      const normalizedX = (dx * obstacle.scaleX) / radius;
      const normalizedZ = (dz * obstacle.scaleZ) / radius;
      if (normalizedX * normalizedX + normalizedZ * normalizedZ < 1) return true;
    }
    return false;
  }

  return { blocksCylinder, blocksSphere, obstacleCount: obstacles.length };
}

function createCameraCollisionProxies(objects) {
  const proxies = [];
  const instanceMatrix = new THREE.Matrix4();
  const worldMatrix = new THREE.Matrix4();

  for (const object of objects) {
    object.updateMatrixWorld(true);
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const count = object.isInstancedMesh ? object.count : 1;
    for (let index = 0; index < count; index += 1) {
      if (object.isInstancedMesh) {
        object.getMatrixAt(index, instanceMatrix);
        worldMatrix.multiplyMatrices(object.matrixWorld, instanceMatrix);
      } else {
        worldMatrix.copy(object.matrixWorld);
      }
      const proxy = new THREE.Mesh(object.geometry, object.material);
      proxy.matrixAutoUpdate = false;
      proxy.matrixWorld.copy(worldMatrix);
      proxies.push({
        mesh: proxy,
        bounds: object.geometry.boundingBox.clone().applyMatrix4(worldMatrix),
      });
    }
  }
  return proxies;
}

function completeSilo(app) {
  const shell = app.groups.world.getObjectByName("shell");
  if (!shell) throw new Error("The original shell group was not found.");

  const cutFace = shell.getObjectByName("shell-wall-section");
  if (cutFace) cutFace.visible = false;

  let completedHalf = app.groups.world.getObjectByName("shell-complete-half");
  if (!completedHalf) {
    completedHalf = shell.clone(true);
    completedHalf.name = "shell-complete-half";
    completedHalf.rotation.y = Math.PI;
    completedHalf.traverse((object) => {
      if (object.name === "shell-wall-section") object.visible = false;
    });
    app.groups.world.add(completedHalf);
  }

  return completedHalf;
}

function upwardHit(raycaster, objects) {
  const normalMatrix = new THREE.Matrix3();
  for (const hit of raycaster.intersectObjects(objects, false)) {
    if (!hit.face) continue;
    normalMatrix.getNormalMatrix(hit.object.matrixWorld);
    const normal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
    if (normal.dot(UP) > 0.35) return hit;
  }
  return null;
}

async function startGame() {
  const app = await waitForOriginalApp();
  const sceneTitle = document.querySelector(".brand-title");
  const sceneSubtitle = document.querySelector(".brand-sub");
  if (sceneTitle) sceneTitle.textContent = "SILO RUN";

  app.silo.set("18");
  app.cancelFlight();
  app.flyTo = async () => {};
  app.controls.enabled = false;
  app.controls.enableDamping = false;
  app.tour?.clear();
  app.renderer.shadowMap.enabled = false;
  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  app.resize();
  lockToSilo18(app);
  const navigationLight = stabilizeLighting(app);

  const completedHalf = completeSilo(app);
  app.scene.updateMatrixWorld(true);
  const originalShell = app.groups.world.getObjectByName("shell");
  const wallCollisions = createCollisionGrid([originalShell, completedHalf]);

  const colliderNames = [
    "shell-slabs",
    "helix0",
    "helix1",
    "helixL1",
    "gallery0",
    "gallery1",
    "gallery144",
  ];
  const colliders = colliderNames
    .map((name) => app.groups.world.getObjectByName(name))
    .filter(Boolean);
  const shaft = app.groups.world.getObjectByName("shaft");
  for (const child of shaft?.children || []) {
    if (child.name.startsWith("bridges")) colliders.push(child);
  }
  const completedSlabs = completedHalf.getObjectByName("shell-slabs");
  if (completedSlabs) colliders.push(completedSlabs);
  const innerColliders = colliders.filter(
    (object) =>
      object.name.startsWith("gallery") || object.name.startsWith("bridges"),
  );
  const gapGroundMeshes = [
    ...colliders,
    "gapStubTop",
    "gapStubBottom",
    "gapRubble",
    "gapScaffold",
  ]
    .map((object) =>
      typeof object === "string" ? shaft?.getObjectByName(object) : object,
    )
    .filter(Boolean);
  const cameraCollisionMeshes = [
    "helix0",
    "helix1",
    "helixL1",
    "column",
    "bridges0",
    "bridges1",
    "bridges2",
    "bridges3",
    "bridges4",
    "bridges5",
  ]
    .map((name) => shaft?.getObjectByName(name))
    .filter(Boolean);
  const cameraCollisionProxies = createCameraCollisionProxies(
    cameraCollisionMeshes,
  );

  const model = createCharacter();
  app.groups.dynamic.add(model.character);

  const canvas = app.canvas;
  const enterButton = document.querySelector("#game-enter");
  const levelLabel = document.querySelector("#game-level");
  const status = document.querySelector("#game-status");
  const keys = new Set();
  const raycaster = new THREE.Raycaster();
  const cameraRaycaster = new THREE.Raycaster();
  const position = new THREE.Vector3(0, -START_LEVEL * LEVEL_HEIGHT, -22);
  const lastSafe = position.clone();
  const forward = new THREE.Vector3();
  const viewForward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const movement = new THREE.Vector3();
  const cameraRigPosition = new THREE.Vector3();
  const cameraLookTarget = new THREE.Vector3();
  let npcSystem = null;
  let questSystem = null;
  let gapSystem = null;
  let cameraRigReady = false;
  let yaw = -Math.PI / 2;
  let pitch = -0.12;
  let cameraDistance = 5.2;
  let targetCameraDistance = cameraDistance;
  let verticalVelocity = 0;
  let grounded = false;
  let jumpQueued = false;
  let walkTime = 0;
  let running = false;
  model.character.rotation.y = Math.PI / 2;

  try {
    const humanoid = await loadProfessionalCharacter(model);
    npcSystem = createNpcSystem(app, humanoid, wallCollisions, position);
    stylePlayerAsJuliette(model, humanoid);
    questSystem = createFirstQuest(app, npcSystem, position);
  } catch (error) {
    console.error("Unable to initialize residents and quests.", error);
  }

  function regularGround(point, referenceY = point.y) {
    const radius = Math.hypot(point.x, point.z);
    const candidates = [];
    const approximateLevel = Math.round(-referenceY / LEVEL_HEIGHT);
    const inGap = approximateLevel >= 90 && approximateLevel <= 92;

    if (!inGap && radius >= 19.2 && radius <= 74.5) {
      for (let offset = -1; offset <= 1; offset += 1) {
        const level = approximateLevel + offset;
        if (level >= 1 && level <= 144) candidates.push(-level * LEVEL_HEIGHT);
      }
    }

    if (
      !inGap &&
      radius >= STAIR_MIN_RADIUS - PLAYER_RADIUS &&
      radius <= STAIR_MAX_RADIUS + PLAYER_RADIUS
    ) {
      const angle = THREE.MathUtils.euclideanModulo(
        Math.atan2(point.z, point.x),
        TAU,
      );
      const angleFraction = angle / TAU;
      const depth = -referenceY / LEVEL_HEIGHT;
      const baseStep = Math.round(depth * 2 + angleFraction);
      for (let offset = -2; offset <= 2; offset += 1) {
        const stairDepth =
          (baseStep + offset) / 2 - angleFraction / 2;
        if (stairDepth >= 1 && stairDepth <= 144) {
          candidates.push(-stairDepth * LEVEL_HEIGHT);
        }
      }
    }

    return (
      candidates
        .filter(
          (height) =>
            height <= referenceY + 0.45 && height >= referenceY - 3,
        )
        .sort((a, b) => b - a)[0] ?? null
    );
  }

  function irregularGroundBelow(point, lift = 1.2, distance = 3.2) {
    const radius = Math.hypot(point.x, point.z);
    const depth = -point.y / LEVEL_HEIGHT;
    const inGap = depth >= 89.5 && depth <= 92.5;
    if (inGap) {
      if (radius < 1.8 || radius > 74.5) return null;
    } else if (radius < 5.6 || radius > 20.2) {
      return null;
    }
    raycaster.set(
      new THREE.Vector3(point.x, point.y + lift, point.z),
      new THREE.Vector3(0, -1, 0),
    );
    raycaster.near = 0;
    raycaster.far = distance + lift;
    return upwardHit(raycaster, inGap ? gapGroundMeshes : innerColliders);
  }

  function groundBelow(point, lift = 1.2, distance = 3.2) {
    const regularHeight = regularGround(point, point.y);
    if (regularHeight !== null) {
      return {
        distance: point.y + lift - regularHeight,
        point: new THREE.Vector3(point.x, regularHeight, point.z),
      };
    }
    return irregularGroundBelow(point, lift, distance);
  }

  function containOnStair(candidate) {
    const currentRadius = Math.hypot(position.x, position.z);
    const candidateRadius = Math.hypot(candidate.x, candidate.z);
    if (
      currentRadius < STAIR_MIN_RADIUS - PLAYER_RADIUS ||
      currentRadius > STAIR_MAX_RADIUS + PLAYER_RADIUS ||
      candidateRadius < STAIR_MIN_RADIUS - PLAYER_RADIUS * 2 ||
      candidateRadius > STAIR_MAX_RADIUS + PLAYER_RADIUS * 2
    ) {
      return;
    }
    if (
      candidateRadius >= STAIR_MIN_RADIUS &&
      candidateRadius <= STAIR_MAX_RADIUS
    ) {
      return;
    }
    if (
      candidateRadius - currentRadius > 0.015 &&
      irregularGroundBelow(candidate, 1, 2.2)
    ) {
      return;
    }

    const containedRadius = THREE.MathUtils.clamp(
      candidateRadius,
      STAIR_MIN_RADIUS,
      STAIR_MAX_RADIUS,
    );
    if (candidateRadius > 0.001) {
      const scale = containedRadius / candidateRadius;
      candidate.x *= scale;
      candidate.z *= scale;
    }
  }

  const spawnHit = groundBelow(position, 2.5, 6);
  if (spawnHit) {
    position.y = spawnHit.point.y;
    lastSafe.copy(position);
    grounded = true;
  }

  function respawn() {
    position.copy(lastSafe);
    verticalVelocity = 0;
    grounded = true;
    jumpQueued = false;
  }

  gapSystem = createGapTraversal(position, (destination) => {
    position.copy(destination);
    lastSafe.copy(destination);
    verticalVelocity = 0;
    grounded = true;
    jumpQueued = false;
  });

  const controlledKeys = new Set([
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "KeyA",
    "KeyD",
    "KeyE",
    "KeyR",
    "KeyS",
    "KeyW",
    "ShiftLeft",
    "ShiftRight",
    "Space",
  ]);

  addEventListener("keydown", (event) => {
    if (controlledKeys.has(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    if (
      event.code === "KeyE" &&
      !event.repeat &&
      (questSystem?.interact() || gapSystem?.interact())
    ) {
      keys.clear();
      return;
    }
    if (
      !event.repeat &&
      (event.code === "ShiftLeft" || event.code === "ShiftRight")
    ) {
      running = !running;
    }
    keys.add(event.code);
    if (event.code === "Space") {
      if (!event.repeat) jumpQueued = true;
    }
    if (event.code === "KeyR") respawn();
  }, { capture: true });
  addEventListener("keyup", (event) => {
    if (controlledKeys.has(event.code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    keys.delete(event.code);
  }, { capture: true });
  addEventListener("blur", () => keys.clear());
  function applyLookDelta(deltaX, deltaY) {
    yaw -= deltaX * 0.0024;
    pitch = THREE.MathUtils.clamp(pitch - deltaY * 0.0018, -0.48, 0.35);
  }

  addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== canvas) return;
    applyLookDelta(event.movementX, event.movementY);
  });
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      targetCameraDistance = THREE.MathUtils.clamp(
        targetCameraDistance + Math.sign(event.deltaY) * 0.75,
        2.4,
        10,
      );
    },
    { passive: false },
  );

  canvas.tabIndex = 0;
  function capturePointer() {
    canvas.focus();
    try {
      const request = canvas.requestPointerLock();
      request?.catch(() => {
        status.textContent = "Click the game view once more to capture the mouse.";
      });
    } catch {
      status.textContent = "Click the game view once more to capture the mouse.";
    }
  }
  enterButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    capturePointer();
  });
  canvas.addEventListener("pointerdown", () => {
    if (document.pointerLockElement !== canvas) capturePointer();
  });
  document.addEventListener("pointerlockchange", () => {
    enterButton.classList.toggle("hidden", document.pointerLockElement === canvas);
    if (document.pointerLockElement === canvas) status.textContent = "";
  });

  app.camera.fov = 58;
  app.camera.updateProjectionMatrix();
  document.body.classList.add("game-ready");

  app.onLate(() => {
    if (!cameraRigReady) return;
    app.camera.position.copy(cameraRigPosition);
    app.controls.target.copy(cameraLookTarget);
    app.camera.lookAt(cameraLookTarget);
    app.camera.updateMatrixWorld();
    navigationLight.position.copy(cameraRigPosition);
  });

  app.onUpdate((delta) => {
    delta = Math.min(delta, 0.05);
    gapSystem?.update(delta);
    const canMove = !questSystem?.dialogueOpen && !gapSystem?.traveling;
    viewForward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    forward.copy(viewForward);
    right.crossVectors(forward, UP).normalize();
    const forwardInput = canMove
      ? Number(keys.has("KeyW") || keys.has("ArrowUp")) -
        Number(keys.has("KeyS") || keys.has("ArrowDown"))
      : 0;
    const sideInput = canMove
      ? Number(keys.has("KeyD") || keys.has("ArrowRight")) -
        Number(keys.has("KeyA") || keys.has("ArrowLeft"))
      : 0;
    movement
      .set(0, 0, 0)
      .addScaledVector(forward, forwardInput)
      .addScaledVector(right, sideInput);

    const moving = movement.lengthSq() > 0;
    if (moving) movement.normalize();
    const sprinting = running;
    const speed = sprinting ? 8.5 : 4.8;
    const displacement = movement.clone().multiplyScalar(speed * delta);
    const steps = Math.max(1, Math.ceil(displacement.length() / 0.2));
    displacement.multiplyScalar(1 / steps);

    function canOccupy(candidate) {
      const radius = Math.hypot(candidate.x, candidate.z);
      if (radius >= 74.2 || radius <= 1.8) return false;
      if (wallCollisions.blocksCylinder(candidate)) return false;
      const candidateGround = groundBelow(candidate, 1, 2.2);
      return (
        !grounded ||
        Boolean(candidateGround && candidateGround.point.y <= position.y + 0.42)
      );
    }

    for (let step = 0; step < steps; step += 1) {
      const candidate = position.clone().add(displacement);
      containOnStair(candidate);
      if (canOccupy(candidate)) {
        position.x = candidate.x;
        position.z = candidate.z;
        continue;
      }
      const slideX = position.clone();
      slideX.x += displacement.x;
      const slideZ = position.clone();
      slideZ.z += displacement.z;
      containOnStair(slideX);
      containOnStair(slideZ);
      if (Math.abs(displacement.x) >= Math.abs(displacement.z)) {
        if (canOccupy(slideX)) position.x = slideX.x;
        else if (canOccupy(slideZ)) position.z = slideZ.z;
      } else {
        if (canOccupy(slideZ)) position.z = slideZ.z;
        else if (canOccupy(slideX)) position.x = slideX.x;
      }
    }

    if (!gapSystem?.traveling) {
      if (grounded && jumpQueued) {
        verticalVelocity = 6.2;
        grounded = false;
      }
      jumpQueued = false;

      verticalVelocity -= 17 * delta;
      position.y += verticalVelocity * delta;
      const ground = groundBelow(position, 1, 3);
      if (
        ground &&
        verticalVelocity <= 0 &&
        position.y - ground.point.y <= 0.45
      ) {
        position.y = ground.point.y;
        verticalVelocity = 0;
        grounded = true;
        lastSafe.copy(position);
      } else {
        grounded = false;
      }
    }

    if (position.y < -1160 || position.y < lastSafe.y - 24) respawn();

    if (moving) {
      const targetRotation = Math.atan2(movement.x, movement.z);
      model.character.rotation.y = THREE.MathUtils.lerp(
        model.character.rotation.y,
        targetRotation,
        1 - Math.exp(-12 * delta),
      );
      walkTime += delta * (sprinting ? 12 : 8);
    }
    const stride = moving && grounded ? Math.sin(walkTime) * 0.55 : 0;
    if (model.mixer) {
      model.setAnimation(moving ? (sprinting ? "run" : "walk") : "idle");
      model.mixer.update(delta);
    } else {
      model.limbs.leftArm.rotation.x = stride;
      model.limbs.rightArm.rotation.x = -stride;
      model.limbs.leftLeg.rotation.x = -stride;
      model.limbs.rightLeg.rotation.x = stride;
    }
    model.character.position.copy(position);

    cameraDistance = THREE.MathUtils.lerp(
      cameraDistance,
      targetCameraDistance,
      1 - Math.exp(-10 * delta),
    );
    const target = position.clone().add(new THREE.Vector3(0, 1.35, 0));
    const ideal = target
      .clone()
      .addScaledVector(viewForward, -cameraDistance * Math.cos(pitch))
      .addScaledVector(UP, 2.25 + Math.sin(pitch) * cameraDistance);
    const floorHeight = regularGround(position, position.y) ?? position.y;
    ideal.y = THREE.MathUtils.clamp(
      ideal.y,
      floorHeight + 1.15,
      floorHeight + 6.6,
    );

    const cameraOffset = ideal.clone().sub(target);
    const idealDistance = cameraOffset.length();
    const cameraDirection = cameraOffset.normalize();
    let allowedDistance = idealDistance;
    const segmentBounds = new THREE.Box3().setFromPoints([target, ideal]).expandByScalar(0.3);
    const nearbyCameraMeshes = cameraCollisionProxies
      .filter((entry) => entry.bounds.intersectsBox(segmentBounds))
      .map((entry) => entry.mesh);
    if (nearbyCameraMeshes.length > 0) {
      cameraRaycaster.set(target, cameraDirection);
      cameraRaycaster.near = 0.45;
      cameraRaycaster.far = idealDistance;
      const obstruction = cameraRaycaster.intersectObjects(
        nearbyCameraMeshes,
        false,
      )[0];
      if (obstruction) allowedDistance = Math.min(allowedDistance, obstruction.distance - 0.28);
    }
    for (let distance = 0.6; distance < allowedDistance; distance += 0.18) {
      const cameraSample = target
        .clone()
        .addScaledVector(cameraDirection, distance);
      const sampleRadius = Math.hypot(cameraSample.x, cameraSample.z);
      if (
        sampleRadius > 74.25 ||
        sampleRadius < 1.7 ||
        wallCollisions.blocksSphere(cameraSample, 0.28)
      ) {
        allowedDistance = distance - 0.22;
        break;
      }
    }
    allowedDistance = THREE.MathUtils.clamp(allowedDistance, 0.8, idealDistance);
    const safeCameraPosition = target
      .clone()
      .addScaledVector(cameraDirection, allowedDistance);
    cameraRigPosition.copy(safeCameraPosition);
    cameraLookTarget.copy(target).addScaledVector(viewForward, 2.5);
    cameraLookTarget.y += Math.sin(pitch) * 2.5;
    cameraRigReady = true;

    const level = THREE.MathUtils.clamp(
      Math.round(-position.y / LEVEL_HEIGHT),
      1,
      144,
    );
    npcSystem?.update(delta, level);
    questSystem?.update(delta);
    gapSystem?.update(0);
    levelLabel.textContent = `LEVEL ${level}`;
    if (sceneSubtitle) {
      sceneSubtitle.textContent =
        `LEVEL ${level} · 144 LEVELS · CUT OPEN · INTERACTIVE`;
    }
  });

  window.__siloRun = {
    app,
    colliders,
    completedHalf,
    wallCollisions,
    keys,
    model,
    get npcSystem() {
      return npcSystem;
    },
    get questSystem() {
      return questSystem;
    },
    get gapSystem() {
      return gapSystem;
    },
    groundBelow(x, y, z, lift = 1, distance = 3) {
      return groundBelow(new THREE.Vector3(x, y, z), lift, distance);
    },
    position,
    respawn,
    get running() {
      return running;
    },
    setYaw(value) {
      yaw = value;
    },
    lookBy(deltaX, deltaY) {
      applyLookDelta(deltaX, deltaY);
    },
    teleport(x, y, z) {
      position.set(x, y, z);
      lastSafe.copy(position);
      verticalVelocity = 0;
      grounded = Boolean(groundBelow(position, 1, 2));
      model.character.position.copy(position);
    },
  };
}

startGame().catch((error) => {
  console.error(error);
  const status = document.querySelector("#game-status");
  if (status) status.textContent = error.message;
});
