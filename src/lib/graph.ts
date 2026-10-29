/* src/lib/graph.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

// A small 3D force layout for the relationship map. Deterministic: no
// randomness, so the server render and the browser start from the same picture

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export interface Projected {
  x: number;
  y: number;
  // 0 is the back of the scene, 1 the front
  depth: number;
  scale: number;
}

const ITERATIONS = 400;
const REST_LENGTH = 120;
const SPRING = 0.04;
const REPULSION = 60000;
const GRAVITY = 0.06;
const START_RADIUS = 220;
const CAMERA = 900;

/** Spreads the starting points evenly over a sphere (a Fibonacci lattice) */
function sphere(count: number): Point3[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    const y = count === 1 ? 0 : 1 - (index / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const angle = golden * index;
    return {
      x: Math.cos(angle) * ring * START_RADIUS,
      y: y * START_RADIUS,
      z: Math.sin(angle) * ring * START_RADIUS,
    };
  });
}

/**
 * Linked nodes pull together, every node pushes every other away, and a weak
 * pull to the centre keeps separate couples from drifting off. Returns points
 * centred on the origin and scaled to fit `radius`.
 */
export function layout(count: number, links: [number, number][], radius: number): Point3[] {
  const points = sphere(count);

  for (let step = 0; step < ITERATIONS; step++) {
    // Big moves early, settling later
    const cooling = 1 - step / ITERATIONS;
    const force = points.map(() => ({ x: 0, y: 0, z: 0 }));

    for (let a = 0; a < count; a++) {
      for (let b = a + 1; b < count; b++) {
        const dx = points[a]!.x - points[b]!.x;
        const dy = points[a]!.y - points[b]!.y;
        const dz = points[a]!.z - points[b]!.z;
        const distanceSq = Math.max(dx * dx + dy * dy + dz * dz, 1);
        const push = REPULSION / distanceSq / Math.sqrt(distanceSq);
        force[a]!.x += dx * push;
        force[a]!.y += dy * push;
        force[a]!.z += dz * push;
        force[b]!.x -= dx * push;
        force[b]!.y -= dy * push;
        force[b]!.z -= dz * push;
      }
    }

    for (const [a, b] of links) {
      const dx = points[b]!.x - points[a]!.x;
      const dy = points[b]!.y - points[a]!.y;
      const dz = points[b]!.z - points[a]!.z;
      const distance = Math.max(Math.hypot(dx, dy, dz), 1);
      const pull = (SPRING * (distance - REST_LENGTH)) / distance;
      force[a]!.x += dx * pull;
      force[a]!.y += dy * pull;
      force[a]!.z += dz * pull;
      force[b]!.x -= dx * pull;
      force[b]!.y -= dy * pull;
      force[b]!.z -= dz * pull;
    }

    points.forEach((point, index) => {
      const f = force[index]!;
      point.x += (f.x - point.x * GRAVITY) * cooling;
      point.y += (f.y - point.y * GRAVITY) * cooling;
      point.z += (f.z - point.z * GRAVITY) * cooling;
    });
  }

  // Centre, then scale so the furthest node sits on `radius`
  const centre = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x / count,
      y: sum.y + point.y / count,
      z: sum.z + point.z / count,
    }),
    { x: 0, y: 0, z: 0 },
  );
  const furthest = Math.max(
    1,
    ...points.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y, p.z - centre.z)),
  );
  const fit = radius / furthest;

  return points.map((point) => ({
    x: (point.x - centre.x) * fit,
    y: (point.y - centre.y) * fit,
    z: (point.z - centre.z) * fit,
  }));
}

/** Rotates by yaw (round the vertical axis) then pitch, and projects with perspective */
export function project(point: Point3, yaw: number, pitch: number, radius: number): Projected {
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const x1 = point.x * cosYaw - point.z * sinYaw;
  const z1 = point.x * sinYaw + point.z * cosYaw;

  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const y2 = point.y * cosPitch - z1 * sinPitch;
  const z2 = point.y * sinPitch + z1 * cosPitch;

  const scale = CAMERA / (CAMERA + z2);
  return {
    x: x1 * scale,
    y: y2 * scale,
    depth: 1 - (z2 + radius) / (2 * radius),
    scale,
  };
}
