import * as THREE from "three";
import { LEVEL_HEIGHT, START_LEVEL, levelY } from "./world.js";

const UP = new THREE.Vector3(0, 1, 0);

function material(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function mesh(geometry, surface, y = 0) {
  const result = new THREE.Mesh(geometry, surface);
  result.position.y = y;
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function createCharacter() {
  const character = new THREE.Group();
  const torso = mesh(
    new THREE.CapsuleGeometry(0.42, 0.82, 6, 10),
    material(0x7c3f35),
    1.52,
  );
  torso.scale.z = 0.68;
  character.add(torso);

  const hips = mesh(new THREE.BoxGeometry(0.72, 0.32, 0.4), material(0x32383b), 0.92);
  character.add(hips);
  character.add(mesh(new THREE.SphereGeometry(0.32, 16, 12), material(0xb98262), 2.42));

  const hair = mesh(
    new THREE.SphereGeometry(0.325, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    material(0x29231f),
    2.5,
  );
  character.add(hair);

  const backpack = mesh(new THREE.BoxGeometry(0.64, 0.82, 0.3), material(0x4d564d), 1.55);
  backpack.position.z = 0.36;
  backpack.rotation.x = -0.08;
  character.add(backpack);

  const limbMaterial = material(0x343c40);
  const armMaterial = material(0x795044);
  const armGeometry = new THREE.CapsuleGeometry(0.12, 0.72, 4, 8);
  const legGeometry = new THREE.CapsuleGeometry(0.15, 0.78, 4, 8);
  const limbs = {};

  for (const side of [-1, 1]) {
    const arm = mesh(armGeometry, armMaterial, 1.62);
    arm.position.x = side * 0.56;
    arm.rotation.z = side * 0.08;
    character.add(arm);
    limbs[side < 0 ? "leftArm" : "rightArm"] = arm;

    const leg = mesh(legGeometry, limbMaterial, 0.37);
    leg.position.x = side * 0.23;
    character.add(leg);
    limbs[side < 0 ? "leftLeg" : "rightLeg"] = leg;
  }

  return { character, limbs };
}

export class Player {
  constructor(scene, camera, canvas, world) {
    const model = createCharacter();
    this.object = model.character;
    this.limbs = model.limbs;
    this.camera = camera;
    this.canvas = canvas;
    this.world = world;
    this.spawn = world.spawn.clone();
    this.position = this.spawn.clone();
    this.object.position.copy(this.position);
    scene.add(this.object);

    this.keys = new Set();
    this.jumpQueued = false;
    this.yaw = 0;
    this.pitch = -0.15;
    this.verticalVelocity = 0;
    this.grounded = true;
    this.lastSafe = this.spawn.clone();
    this.walkTime = 0;
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.move = new THREE.Vector3();

    addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (event.code === "Space") {
        if (!event.repeat) this.jumpQueued = true;
        event.preventDefault();
      }
      if (event.code === "KeyR") this.respawn();
    });
    addEventListener("keyup", (event) => this.keys.delete(event.code));
    addEventListener("blur", () => this.keys.clear());
    addEventListener("mousemove", (event) => {
      if (document.pointerLockElement !== canvas) return;
      this.yaw -= event.movementX * 0.0024;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch - event.movementY * 0.0018,
        -0.55,
        0.4,
      );
    });
  }

  respawn() {
    this.position.copy(this.lastSafe);
    this.verticalVelocity = 0;
    this.grounded = true;
    this.jumpQueued = false;
  }

  update(delta) {
    const forwardInput =
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) -
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
    const sideInput =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));

    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.move
      .set(0, 0, 0)
      .addScaledVector(this.forward, forwardInput)
      .addScaledVector(this.right, sideInput);

    const moving = this.move.lengthSq() > 0;
    if (moving) this.move.normalize();
    const sprinting = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const speed = sprinting ? 10.5 : 6.2;
    const candidate = this.position.clone().addScaledVector(this.move, speed * delta);
    const radius = Math.hypot(candidate.x, candidate.z);
    const candidateGround = this.world.groundHeight(candidate, this.position.y);

    if (radius < 73.2 && (!this.grounded || candidateGround !== null)) {
      this.position.x = candidate.x;
      this.position.z = candidate.z;
    }

    if (this.grounded && this.jumpQueued) {
      this.verticalVelocity = 7.2;
      this.grounded = false;
    }
    this.jumpQueued = false;

    this.verticalVelocity -= 18 * delta;
    this.position.y += this.verticalVelocity * delta;
    const ground = this.world.groundHeight(this.position, this.position.y);

    if (
      ground !== null &&
      this.verticalVelocity <= 0 &&
      this.position.y - ground <= 0.55
    ) {
      this.position.y = ground;
      this.verticalVelocity = 0;
      this.grounded = true;
      this.lastSafe.copy(this.position);
    } else {
      this.grounded = false;
    }

    if (this.position.y < levelY(144) - 20 || this.position.y < this.lastSafe.y - 30) {
      this.respawn();
    }

    if (moving) {
      const targetRotation = Math.atan2(this.move.x, this.move.z);
      this.object.rotation.y = THREE.MathUtils.lerp(
        this.object.rotation.y,
        targetRotation,
        1 - Math.exp(-12 * delta),
      );
      this.walkTime += delta * (sprinting ? 12 : 8);
    }

    const stride = moving && this.grounded ? Math.sin(this.walkTime) * 0.58 : 0;
    this.limbs.leftArm.rotation.x = stride;
    this.limbs.rightArm.rotation.x = -stride;
    this.limbs.leftLeg.rotation.x = -stride;
    this.limbs.rightLeg.rotation.x = stride;
    this.object.position.copy(this.position);

    const target = this.position.clone().add(new THREE.Vector3(0, 1.65, 0));
    const distance = 6.4;
    const ideal = target
      .clone()
      .addScaledVector(this.forward, -distance * Math.cos(this.pitch))
      .addScaledVector(UP, 2.75 + Math.sin(this.pitch) * distance);
    const nearbyGround = this.world.groundHeight(this.position, this.position.y);
    const baseHeight = nearbyGround ?? this.position.y;
    ideal.y = THREE.MathUtils.clamp(ideal.y, baseHeight + 1.4, baseHeight + 5.85);
    const cameraRadius = Math.hypot(ideal.x, ideal.z);
    if (cameraRadius > 72) {
      ideal.x *= 72 / cameraRadius;
      ideal.z *= 72 / cameraRadius;
    }
    this.camera.position.lerp(ideal, 1 - Math.exp(-11 * delta));
    const lookTarget = target.clone().addScaledVector(this.forward, 3.2);
    lookTarget.y += Math.sin(this.pitch) * 3.2;
    this.camera.lookAt(lookTarget);

    return THREE.MathUtils.clamp(
      Math.round(START_LEVEL - this.position.y / LEVEL_HEIGHT),
      1,
      144,
    );
  }
}
