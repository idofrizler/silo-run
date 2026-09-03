import * as THREE from "three";

export const LEVELS = 144;
export const LEVEL_HEIGHT = 7;
export const START_LEVEL = 72;
export const INNER_RADIUS = 22;
export const OUTER_RADIUS = 75;

const WALKABLE_OUTER_RADIUS = 72.5;
const STAIR_RADIUS = 18;
const STAIR_WIDTH = 4.6;
const STAIR_TURNS_PER_LEVEL = 2;
const STEPS_PER_LEVEL = 66;
const VISIBLE_LEVEL_RADIUS = 3;
const VISIBLE_LEVELS = VISIBLE_LEVEL_RADIUS * 2 + 1;
const ROOMS_PER_LEVEL = 16;
const LIGHTS_PER_LEVEL = 6;
const TAU = Math.PI * 2;
const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

export function levelY(level) {
  return (START_LEVEL - level) * LEVEL_HEIGHT;
}

function clampLevel(level) {
  return THREE.MathUtils.clamp(level, 1, LEVELS);
}

function zoneColor(level) {
  if (level <= 20) return new THREE.Color(0x7f8f86);
  if (level <= 50) return new THREE.Color(0x826e59);
  if (level <= 95) return new THREE.Color(0x657660);
  if (level <= 124) return new THREE.Color(0x77716a);
  return new THREE.Color(0x725a4b);
}

function setTransform(mesh, index, position, rotationY = 0, scale = null) {
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    rotationY,
  );
  matrix.compose(position, quaternion, scale || new THREE.Vector3(1, 1, 1));
  mesh.setMatrixAt(index, matrix);
}

function createFloors(scene) {
  const geometry = new THREE.RingGeometry(INNER_RADIUS, OUTER_RADIUS, 72);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x716f67,
      emissive: 0x171612,
      emissiveIntensity: 0.14,
      roughness: 0.92,
      metalness: 0.04,
      side: THREE.DoubleSide,
    }),
    VISIBLE_LEVELS,
  );
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function createApartments(scene) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(8, 5.8, 4),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x17120e,
      emissiveIntensity: 0.12,
      roughness: 0.82,
      metalness: 0.08,
      vertexColors: true,
    }),
    VISIBLE_LEVELS * ROOMS_PER_LEVEL,
  );
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function createLevelLights(scene) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2.6, 0.12, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xffd99a }),
    VISIBLE_LEVELS * LIGHTS_PER_LEVEL,
  );
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function createStairs(scene) {
  const angleStep = (STAIR_TURNS_PER_LEVEL * TAU) / STEPS_PER_LEVEL;
  const stepDepth = STAIR_RADIUS * angleStep * 1.08;
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(STAIR_WIDTH, 0.2, stepDepth),
    new THREE.MeshStandardMaterial({
      color: 0x77736b,
      emissive: 0x11100e,
      emissiveIntensity: 0.1,
      roughness: 0.76,
      metalness: 0.22,
    }),
    (VISIBLE_LEVELS + 1) * STEPS_PER_LEVEL,
  );
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function createLandings(scene) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(5.2, 0.28, STAIR_WIDTH),
    new THREE.MeshStandardMaterial({
      color: 0x868078,
      emissive: 0x151310,
      emissiveIntensity: 0.12,
      roughness: 0.78,
      metalness: 0.16,
    }),
    VISIBLE_LEVELS,
  );
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function createRails(scene) {
  const geometry = new THREE.TorusGeometry(
    INNER_RADIUS,
    0.12,
    6,
    64,
    TAU - 0.36,
  );
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x8d8d84,
      roughness: 0.4,
      metalness: 0.7,
    }),
    VISIBLE_LEVELS,
  );
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function validGround(candidates, referenceY) {
  return candidates
    .filter((height) => height <= referenceY + 0.6 && height >= referenceY - 5)
    .sort((a, b) => b - a)[0] ?? null;
}

function groundHeight(position, referenceY = position.y) {
  const radius = Math.hypot(position.x, position.z);
  const candidates = [];
  const approximateLevel = Math.round(START_LEVEL - referenceY / LEVEL_HEIGHT);

  if (radius >= INNER_RADIUS - 0.15 && radius <= WALKABLE_OUTER_RADIUS) {
    for (let offset = -1; offset <= 1; offset += 1) {
      const level = approximateLevel + offset;
      if (level >= 1 && level <= LEVELS) candidates.push(levelY(level));
    }
  }

  const onLanding =
    position.x >= STAIR_RADIUS + STAIR_WIDTH / 2 - 0.6 &&
    position.x <= INNER_RADIUS + 2.8 &&
    Math.abs(position.z) <= STAIR_WIDTH / 2;
  if (onLanding) {
    for (let offset = -1; offset <= 1; offset += 1) {
      const level = approximateLevel + offset;
      if (level >= 1 && level <= LEVELS) candidates.push(levelY(level));
    }
  }

  if (
    radius >= STAIR_RADIUS - STAIR_WIDTH / 2 &&
    radius <= STAIR_RADIUS + STAIR_WIDTH / 2
  ) {
    const angle = THREE.MathUtils.euclideanModulo(
      Math.atan2(position.z, position.x),
      TAU,
    );
    const topY = levelY(1);
    const referenceProgress = (topY - referenceY) / LEVEL_HEIGHT;
    const baseTurn = Math.round(
      STAIR_TURNS_PER_LEVEL * referenceProgress - angle / TAU,
    );

    for (let offset = -2; offset <= 2; offset += 1) {
      const progress =
        (angle / TAU + baseTurn + offset) / STAIR_TURNS_PER_LEVEL;
      if (progress >= 0 && progress <= LEVELS - 1) {
        candidates.push(topY - progress * LEVEL_HEIGHT);
      }
    }
  }

  return validGround(candidates, referenceY);
}

export function createWorld(scene) {
  const floors = createFloors(scene);
  const apartments = createApartments(scene);
  const levelLights = createLevelLights(scene);
  const stairs = createStairs(scene);
  const landings = createLandings(scene);
  const rails = createRails(scene);
  const shellHeight = (VISIBLE_LEVELS + 4) * LEVEL_HEIGHT;

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(
      OUTER_RADIUS + 2,
      OUTER_RADIUS + 2,
      shellHeight,
      72,
      1,
      true,
    ),
    new THREE.MeshStandardMaterial({
      color: 0x555853,
      emissive: 0x121411,
      emissiveIntensity: 0.12,
      roughness: 0.96,
      side: THREE.BackSide,
    }),
  );
  wall.receiveShadow = true;
  scene.add(wall);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 13, shellHeight, 48, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x4d504b,
      emissive: 0x11120f,
      emissiveIntensity: 0.1,
      roughness: 0.94,
      side: THREE.DoubleSide,
    }),
  );
  core.receiveShadow = true;
  scene.add(core);

  let renderedCenterLevel = null;

  function update(centerLevel) {
    const roundedCenter = clampLevel(Math.round(centerLevel));
    if (roundedCenter === renderedCenterLevel) return;
    renderedCenterLevel = roundedCenter;
    const firstLevel = roundedCenter - VISIBLE_LEVEL_RADIUS;
    const unitScale = new THREE.Vector3(1, 1, 1);

    for (let slot = 0; slot < VISIBLE_LEVELS; slot += 1) {
      const level = firstLevel + slot;
      if (level < 1 || level > LEVELS) {
        floors.setMatrixAt(slot, ZERO_MATRIX);
        landings.setMatrixAt(slot, ZERO_MATRIX);
        rails.setMatrixAt(slot, ZERO_MATRIX);
        for (let room = 0; room < ROOMS_PER_LEVEL; room += 1) {
          apartments.setMatrixAt(slot * ROOMS_PER_LEVEL + room, ZERO_MATRIX);
        }
        for (let light = 0; light < LIGHTS_PER_LEVEL; light += 1) {
          levelLights.setMatrixAt(slot * LIGHTS_PER_LEVEL + light, ZERO_MATRIX);
        }
        continue;
      }

      const y = levelY(level);
      setTransform(floors, slot, new THREE.Vector3(0, y, 0));
      setTransform(landings, slot, new THREE.Vector3(21.2, y - 0.14, 0));
      setTransform(rails, slot, new THREE.Vector3(0, y + 1.05, 0));
      const color = zoneColor(level);

      for (let room = 0; room < ROOMS_PER_LEVEL; room += 1) {
        const theta = (room / ROOMS_PER_LEVEL) * TAU;
        const index = slot * ROOMS_PER_LEVEL + room;
        setTransform(
          apartments,
          index,
          new THREE.Vector3(
            Math.cos(theta) * (OUTER_RADIUS - 2),
            y + 3.05,
            Math.sin(theta) * (OUTER_RADIUS - 2),
          ),
          -theta,
          unitScale,
        );
        apartments.setColorAt(index, color);
      }

      for (let light = 0; light < LIGHTS_PER_LEVEL; light += 1) {
        const theta = (light / LIGHTS_PER_LEVEL) * TAU;
        setTransform(
          levelLights,
          slot * LIGHTS_PER_LEVEL + light,
          new THREE.Vector3(
            Math.cos(theta) * 52,
            y + 5.8,
            Math.sin(theta) * 52,
          ),
          -theta,
          unitScale,
        );
      }
    }

    const firstStep = Math.max(0, (firstLevel - 1) * STEPS_PER_LEVEL);
    const maxStep = (LEVELS - 1) * STEPS_PER_LEVEL;
    const topY = levelY(1);
    for (let slot = 0; slot < stairs.count; slot += 1) {
      const globalStep = firstStep + slot;
      if (globalStep > maxStep) {
        stairs.setMatrixAt(slot, ZERO_MATRIX);
        continue;
      }
      const progress = globalStep / STEPS_PER_LEVEL;
      const theta = progress * STAIR_TURNS_PER_LEVEL * TAU;
      setTransform(
        stairs,
        slot,
        new THREE.Vector3(
          Math.cos(theta) * STAIR_RADIUS,
          topY - progress * LEVEL_HEIGHT - 0.1,
          Math.sin(theta) * STAIR_RADIUS,
        ),
        -theta,
        unitScale,
      );
    }

    for (const mesh of [floors, apartments, levelLights, stairs, landings, rails]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
    apartments.instanceColor.needsUpdate = true;
    wall.position.y = levelY(roundedCenter);
    core.position.y = levelY(roundedCenter);
  }

  update(START_LEVEL);

  return {
    groundHeight,
    update,
    spawn: new THREE.Vector3(29, levelY(START_LEVEL), 0),
  };
}
