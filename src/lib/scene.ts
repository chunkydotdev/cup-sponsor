/**
 * Everything that pins the 3D mug onto the photo lives here.
 *
 * The photo is a plane facing the camera and filling the frame exactly. The
 * mug is a real object floating just in front of it, placed along the ray that
 * already passes through the spot where the photographed mug sits — so it
 * lands on the same pixels at every viewport size.
 *
 * Photo coordinates are normalised: u = 0..1 left→right, v = 0..1 top→bottom.
 *
 * The photo changes every morning, so these numbers are meant to be re-dialled
 * daily. /calibrate does it with sliders and hands back a block to paste here.
 */
import * as THREE from "three";

export type SceneConfig = {
  /** Photo width / height. */
  photoAspect: number;
  fovDeg: number;
  distance: number;
  /** How far above the rim plane the camera sits — read off the rim ellipse. */
  elevationDeg: number;
  /** How far in front of the photo the mug floats. Screen position is unchanged. */
  mugDepth: number;
  /** Centre of the photographed mug's rim, in photo coordinates. */
  centerU: number;
  rimV: number;
  /** Outer rim diameter as a fraction of the photo's width. */
  widthFrac: number;
  /** A held mug is never perfectly upright. */
  rollDeg: number;
  /** The printable band, in units of the rim radius below the rim. */
  printTop: number;
  printBottom: number;
};

export const PHOTO_SRC = "/photo/today.jpg";

export const SCENE: SceneConfig = {
  photoAspect: 1932 / 2576,
  fovDeg: 26,
  distance: 10,
  elevationDeg: 13.4,
  mugDepth: 1.6,
  centerU: 0.681,
  rimV: 0.708,
  widthFrac: 0.302,
  rollDeg: 2.5,
  printTop: -0.5,
  printBottom: -1.95,
};

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Half-height of the visible frame at a given distance from the camera. */
export function halfHeightAt(cfg: SceneConfig, distance: number) {
  return distance * Math.tan(rad(cfg.fovDeg) / 2);
}

export function cameraPosition(cfg: SceneConfig) {
  const e = rad(cfg.elevationDeg);
  return new THREE.Vector3(0, Math.sin(e) * cfg.distance, Math.cos(e) * cfg.distance);
}

/** Size of the photo plane so that it exactly fills the frame. */
export function photoPlaneSize(cfg: SceneConfig) {
  const height = halfHeightAt(cfg, cfg.distance) * 2;
  return { width: height * cfg.photoAspect, height };
}

/** The photo plane is square-on to the camera, so it tips back with elevation. */
export function photoPlaneRotationX(cfg: SceneConfig) {
  return -rad(cfg.elevationDeg);
}

/** World position of a point on the photo, given its normalised coordinates. */
export function photoPointToWorld(cfg: SceneConfig, u: number, v: number) {
  const { width, height } = photoPlaneSize(cfg);
  const e = rad(cfg.elevationDeg);
  const right = new THREE.Vector3(1, 0, 0);
  const up = new THREE.Vector3(0, Math.cos(e), -Math.sin(e));
  return right.multiplyScalar((u - 0.5) * width).add(up.multiplyScalar((0.5 - v) * height));
}

/**
 * Pull a point on the photo towards the camera along the viewing ray. It keeps
 * the same screen position and simply gets closer, and so bigger.
 */
export function liftTowardsCamera(cfg: SceneConfig, point: THREE.Vector3, depth: number) {
  const cam = cameraPosition(cfg);
  return cam.clone().add(point.clone().sub(cam).multiplyScalar((cfg.distance - depth) / cfg.distance));
}

/** World size an object needs to cover `frac` of the frame width at `distance`. */
export function worldWidthForFraction(cfg: SceneConfig, frac: number, distance: number) {
  return frac * halfHeightAt(cfg, distance) * 2 * cfg.photoAspect;
}

/** Where the mug goes, and how big it is, derived from the photo measurements. */
export function mugPlacement(cfg: SceneConfig) {
  const onPhoto = photoPointToWorld(cfg, cfg.centerU, cfg.rimV);
  const position = liftTowardsCamera(cfg, onPhoto, cfg.mugDepth);
  const outerDiameter = worldWidthForFraction(cfg, cfg.widthFrac, cfg.distance - cfg.mugDepth);
  return { position, radius: outerDiameter / 2 };
}

/** The paste-back block that /calibrate produces. */
export function formatConfig(cfg: SceneConfig) {
  const keys: (keyof SceneConfig)[] = [
    "photoAspect",
    "fovDeg",
    "distance",
    "elevationDeg",
    "mugDepth",
    "centerU",
    "rimV",
    "widthFrac",
    "rollDeg",
    "printTop",
    "printBottom",
  ];
  const body = keys
    .map((k) => `  ${k}: ${k === "photoAspect" ? cfg[k].toFixed(6) : cfg[k]},`)
    .join("\n");
  return `export const SCENE: SceneConfig = {\n${body}\n};`;
}
