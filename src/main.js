import * as THREE from "three";
import { Player } from "./player.js";
import { createWorld, levelY } from "./world.js";

const canvas = document.querySelector("#game");
const enterButton = document.querySelector("#enter");
const levelLabel = document.querySelector("#level");
const status = document.querySelector("#status");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202321);
scene.fog = new THREE.FogExp2(0x202321, 0.008);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.08, 280);
camera.position.set(34, levelY(72) + 5, 8);

scene.add(new THREE.HemisphereLight(0xc9d5ce, 0x282018, 1.65));
scene.add(new THREE.AmbientLight(0x9caaa2, 0.68));

const sun = new THREE.DirectionalLight(0xffe2b6, 2.2);
sun.position.set(32, levelY(72) + 48, 28);
scene.add(sun);

const world = createWorld(scene);
const player = new Player(scene, camera, canvas, world);

window.__siloRun = { camera, player, scene, world };

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
}

addEventListener("resize", resize);

enterButton.addEventListener("click", () => canvas.requestPointerLock());
canvas.addEventListener("click", () => {
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
});
document.addEventListener("pointerlockchange", () => {
  enterButton.classList.toggle("hidden", document.pointerLockElement === canvas);
});

let previous = performance.now();
function frame(now) {
  const delta = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  const level = player.update(delta);
  world.update(level);
  levelLabel.textContent = `LEVEL ${level}`;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
