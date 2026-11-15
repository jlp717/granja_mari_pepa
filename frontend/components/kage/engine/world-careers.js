/** Careers environmental adaptation. Kage camera/math/post remain in kage-engine.js.
 * One continuous interior the camera actually travels through:
 * dock gate → crew table → corridor of doors → packing line → stair of light →
 * interview table. Work is shown through real objects, never invented claims.
 */
export function buildCareersWorld(ctx) {
  const {
    THREE,
    scene,
    WORLD,
    surface,
    lib,
    texWood,
    texFloor,
    texStone,
    tx,
    texGlow,
  } = ctx;

  let seed = 20261112;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const accent = new THREE.Color().setHSL(190 / 360, 0.95, 0.4);
  const warm = new THREE.Color(0xff8a3c);
  const dummy = new THREE.Object3D();
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xe7dfd0,
    roughness: 0.92,
  });
  const lampGlows = [];
  const lampLights = [];
  const lampGroups = [];
  const doorPanes = [];

  const timber = surface(
    lib("careersTimber", () => texWood(11, { boards: 3 })),
    [2, 1],
    { color: 0x6d5b47, normal: 1.3 },
  );
  const beamWood = surface(
    lib("careersBeam", () => texWood(29, { boards: 0 })),
    [1, 5],
    { color: 0x453a2f, normal: 1.4 },
  );
  const steel = new THREE.MeshStandardMaterial({
    color: 0x5d686c,
    roughness: 0.42,
    metalness: 0.66,
  });
  /* door frames want to stay near-black: polished steel at forty metres
     collapses into a pale slab once the bloom gets hold of it */
  const frame = new THREE.MeshStandardMaterial({
    color: 0x2b3437,
    roughness: 0.62,
    metalness: 0.28,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x11171a,
    roughness: 0.88,
    metalness: 0.1,
  });
  const stone = surface(
    lib("careersStone", () => texStone(31)),
    [3, 3],
    { color: 0x606c70, normal: 0.35 },
  );

  const floorData = lib("careersFloor", texFloor);
  const floorMat = new THREE.MeshStandardMaterial({
    map: tx(floorData.map),
    normalMap: tx(floorData.normal, { srgb: false }),
    color: 0x5f6d70,
    roughness: 0.58,
    metalness: 0.2,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), floorMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -26);
  ground.receiveShadow = true;
  scene.add(ground);
  WORLD.floor = ground;
  WORLD.floorMat = floorMat;

  /* the stride line: one light seam that pulls the eye through the whole build */
  const seam = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.012, 46),
    new THREE.MeshBasicMaterial({
      color: accent.clone().multiplyScalar(1.1),
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  seam.position.set(0, 0.016, -10);
  scene.add(seam);

  const addBox = (group, size, at, material, ry = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...at);
    mesh.rotation.y = ry;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const addGlow = (group, w, h, at, inner, mid, opacity, color) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        map: tx(texGlow(inner, mid)),
        color: color || 0xffffff,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
    mesh.position.set(...at);
    group.add(mesh);
    return mesh;
  };

  /* ── 00 · crates: one instanced field feeds the gate, the aisle and the hall ── */
  const CRATES = 168;
  const crateField = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    timber,
    CRATES,
  );
  crateField.castShadow = true;
  crateField.receiveShadow = true;
  let ci = 0;
  const crate = (x, y, z, s = 1, ry = 0) => {
    if (ci >= CRATES) return;
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, ry, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    crateField.setMatrixAt(ci++, dummy.matrix);
  };

  const gate = new THREE.Group();
  scene.add(gate);
  [-1, 1].forEach((side) => {
    for (let row = 0; row < 9; row++) {
      const n = row > 6 ? 2 : 3;
      for (let col = 0; col < n; col++) {
        crate(
          side * (9.3 + col * 1.06) + (rand() - 0.5) * 0.06,
          0.54 + row * 1.03,
          -4.8 + (row % 2) * 0.24 + (rand() - 0.5) * 0.08,
          1,
          (rand() - 0.5) * 0.05,
        );
      }
    }
  });
  addBox(gate, [22.4, 0.46, 1.2], [0, 9.5, -4.8], beamWood);
  addBox(gate, [22.4, 0.3, 1.0], [0, 10.1, -4.8], dark);
  const gateLine = new THREE.Mesh(
    new THREE.BoxGeometry(14.4, 0.035, 0.035),
    new THREE.MeshBasicMaterial({
      color: accent.clone().multiplyScalar(1.25),
      transparent: true,
      opacity: 0.55,
      toneMapped: false,
    }),
  );
  gateLine.position.set(0, 9.16, -4.34);
  gate.add(gateLine);
  /* dock lamps, hung short of the gate so the passage stays open */
  [-4.6, 4.6].forEach((x) => {
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.62, 0.42, 20, 1, true),
      dark,
    );
    shade.position.set(x, 7.5, -2.2);
    gate.add(shade);
    addGlow(
      gate,
      1.5,
      1.5,
      [x, 7.35, -2.2],
      "rgba(255,206,158,.95)",
      "rgba(255,138,60,.30)",
      0.5,
    );
  });

  /* ── 01 · the crew table, under the only warm lamps in the build ── */
  const atrium = new THREE.Group();
  scene.add(atrium);
  addBox(atrium, [5.6, 0.16, 1.7], [1.9, 1.02, -12.4], beamWood);
  [-1, 1].forEach((side) =>
    [-1, 1].forEach((end) =>
      addBox(
        atrium,
        [0.14, 1, 0.14],
        [1.9 + side * 2.4, 0.5, -12.4 + end * 0.6],
        steel,
      ),
    ),
  );
  [-1, 0, 1].forEach((k) => {
    addBox(
      atrium,
      [0.46, 0.07, 0.46],
      [1.9 + k * 1.7, 0.74, -11.2],
      dark,
    );
    addBox(
      atrium,
      [0.46, 0.07, 0.46],
      [1.9 + k * 1.7, 0.74, -13.6],
      dark,
    );
    [-1, 1].forEach((side) =>
      addBox(
        atrium,
        [0.06, 0.74, 0.06],
        [1.9 + k * 1.7 + side * 0.16, 0.37, -11.2],
        steel,
      ),
    );
    [[-11.2, 1], [-13.6, -1]].forEach(([cz, dir]) => {
      addBox(
        atrium,
        [0.46, 0.9, 0.06],
        [1.9 + k * 1.7, 1.2 + 0.35, cz + dir * 0.2],
        dark,
      );
    });
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.46, 22, 1, true),
      dark,
    );
    shade.position.set(1.9 + k * 1.7, 4.55, -12.4);
    atrium.add(shade);
    const bulb = addGlow(
      atrium,
      1.35,
      1.35,
      [1.9 + k * 1.7, 4.4, -12.4],
      "rgba(255,214,168,.95)",
      "rgba(255,146,66,.34)",
      0.62,
    );
    lampGlows.push(bulb);
    const lamp = new THREE.PointLight(0xff9a4c, 2.4, 11, 2);
    lamp.position.set(1.9 + k * 1.7, 4.2, -12.4);
    atrium.add(lamp);
    lampLights.push(lamp);
    lampGroups.push(shade);
  });
  WORLD.lanternLights = lampLights;
  WORLD.lanternGlows = lampGlows;
  /* the aisle walls: broken stacks, never a solid shelf, so light leaks through */
  [-1, 1].forEach((side) => {
    for (let z = -7.5; z > -22; z -= 2.6) {
      const h = 2 + Math.floor(rand() * 3);
      for (let row = 0; row < h; row++)
        crate(
          side * (11.2 + rand() * 0.5),
          0.54 + row * 1.03,
          z + (rand() - 0.5) * 0.3,
          1,
          (rand() - 0.5) * 0.08,
        );
    }
  });

  /* ── 02 · the corridor of doors ── */
  const corridor = new THREE.Group();
  scene.add(corridor);
  [-1, 1].forEach((side) => {
    addBox(corridor, [0.5, 7.4, 13], [side * 8.6, 3.7, -23.4], dark);
  });
  const doorColors = [0xc24a1f, 0xc9a24a, 0x5c6238, 0x9cb4c2];
  const doorZ = [-18.3, -21.1, -23.9, -26.7];
  doorZ.forEach((z, i) => {
    const glow = new THREE.Color(doorColors[i % doorColors.length]);
    [-1, 1].forEach((side) => {
      const x = side * 8.24;
      addBox(corridor, [0.18, 5.6, 0.18], [x, 2.8, z - 1.15], frame);
      addBox(corridor, [0.18, 5.6, 0.18], [x, 2.8, z + 1.15], frame);
      addBox(corridor, [0.18, 0.18, 2.48], [x, 5.6, z], frame);
      const pane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.76, 4.5),
        new THREE.MeshStandardMaterial({
          color: glow.clone().multiplyScalar(0.12),
          emissive: glow.clone().multiplyScalar(0.6),
          emissiveIntensity: 0.9,
          roughness: 0.55,
          metalness: 0.1,
        }),
      );
      pane.position.set(side * 8.3, 2.72, z);
      pane.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      corridor.add(pane);
      doorPanes.push(pane);
      /* a centre mullion, so each pane reads as a double door and not a poster */
      addBox(corridor, [0.09, 4.5, 0.05], [side * 8.27, 2.72, z], dark);
      const spill = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 2.1),
        new THREE.MeshBasicMaterial({
          map: tx(texGlow("rgba(255,255,255,.7)", "rgba(255,255,255,.16)")),
          color: glow.clone().multiplyScalar(1.2),
          transparent: true,
          opacity: 0.09,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
          toneMapped: false,
        }),
      );
      spill.rotation.x = -Math.PI / 2;
      spill.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      spill.position.set(side * 6.35, 0.02, z);
      corridor.add(spill);
      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.012, 2.1),
        new THREE.MeshBasicMaterial({
          color: glow.clone().multiplyScalar(1.1),
          transparent: true,
          opacity: 0.26,
          toneMapped: false,
        }),
      );
      sill.position.set(side * 7.98, 0.018, z);
      corridor.add(sill);
    });
  });
  /* cross-ties above the corridor keep the ceiling from reading as open sky */
  for (let z = -8; z >= -28; z -= 4) {
    addBox(corridor, [23, 0.16, 0.16], [0, 8.5, z], dark);
  }
  /* a receding row of strip lamps down the aisle: rhythm in the top third and
     a second line of perspective besides the floor seam */
  for (let i = 0; i < 6; i++) {
    const z = -13.6 - i * 4.1;
    addBox(corridor, [0.02, 1.2, 0.02], [0, 7.9, z], dark);
    addBox(corridor, [1.5, 0.1, 0.24], [0, 7.3, z], dark);
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.03, 0.05),
      new THREE.MeshBasicMaterial({
        color: warm.clone().multiplyScalar(1.25),
        toneMapped: false,
      }),
    );
    strip.position.set(0, 7.24, z);
    corridor.add(strip);
    addGlow(
      corridor,
      2.6,
      1.1,
      [0, 7.2, z],
      "rgba(255,212,168,.7)",
      "rgba(255,140,60,.1)",
      0.2,
    );
  }

  /* ── 03 · the packing line: four stations, boxes that actually advance ── */
  const line = new THREE.Group();
  scene.add(line);
  addBox(line, [2.3, 0.16, 14.4], [4.7, 1.08, -21.4], dark);
  [-1, 1].forEach((side) =>
    addBox(line, [0.1, 0.24, 14.4], [4.7 + side * 1.18, 1.2, -21.4], steel),
  );
  const rollerGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.1, 14);
  const rollers = new THREE.InstancedMesh(rollerGeo, steel, 18);
  for (let i = 0; i < 18; i++) {
    dummy.position.set(4.7, 1.17, -14.7 - i * 0.78);
    dummy.rotation.set(0, 0, Math.PI / 2);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    rollers.setMatrixAt(i, dummy.matrix);
  }
  scene.add(rollers);
  for (let z = -15; z >= -28; z -= 3.2) {
    [-1, 1].forEach((side) =>
      addBox(line, [0.12, 1.05, 0.12], [4.7 + side * 0.95, 0.52, z], steel),
    );
  }
  const boxGeo = new THREE.BoxGeometry(0.64, 0.5, 0.64);
  const boxMat = surface(
    lib("careersBox", () => texWood(7, { boards: 2 })),
    [1, 1],
    { color: 0x8a7358, normal: 1.1 },
  );
  const moving = [];
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(boxGeo, boxMat);
    b.position.set(4.7, 1.48, -15.2 - i * 2.7);
    b.castShadow = true;
    line.add(b);
    moving.push(b);
  }
  const stationGlow = [];
  for (let i = 0; i < 4; i++) {
    const z = -16.4 - i * 3.2;
    [-1, 1].forEach((side) =>
      addBox(line, [0.14, 4.2, 0.14], [4.7 + side * 1.55, 3.2, z], steel),
    );
    addBox(line, [3.24, 0.14, 0.14], [4.7, 5.2, z], steel);
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.05, 0.05),
      new THREE.MeshBasicMaterial({
        color: (i % 2 ? accent : warm).clone().multiplyScalar(1.5),
        toneMapped: false,
      }),
    );
    strip.position.set(4.7, 5.05, z);
    line.add(strip);
    const halo = addGlow(
      line,
      2.4,
      1.4,
      [4.7, 4.95, z],
      i % 2 ? "rgba(150,232,250,.8)" : "rgba(255,196,140,.85)",
      "rgba(255,140,60,.1)",
      0.3,
    );
    stationGlow.push(halo);
  }

  /* ── 04 · the deck, the stair and the skylight ── */
  const hall = new THREE.Group();
  scene.add(hall);
  addBox(hall, [17, 0.5, 10.4], [0, 0.55, -32.2], stone);
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(16.4, 0.05, 0.06),
    new THREE.MeshBasicMaterial({
      color: accent.clone().multiplyScalar(1.5),
      transparent: true,
      opacity: 0.55,
      toneMapped: false,
    }),
  );
  edge.position.set(0, 0.83, -27.02);
  hall.add(edge);

  const STEPS = 22;
  const stepGeo = new THREE.BoxGeometry(1, 1, 1);
  const steps = new THREE.InstancedMesh(stepGeo, stone, STEPS);
  const nosing = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: accent.clone().multiplyScalar(1.35),
      transparent: true,
      opacity: 0.55,
      toneMapped: false,
    }),
    STEPS,
  );
  for (let i = 0; i < STEPS; i++) {
    const h = (i + 1) * 0.5;
    const z = -35 - i * 0.45;
    dummy.position.set(0, 0.8 + h / 2, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(5.2, h, 0.46);
    dummy.updateMatrix();
    steps.setMatrixAt(i, dummy.matrix);
    dummy.position.set(0, 0.8 + h + 0.012, z + 0.21);
    dummy.scale.set(5.2, 0.024, 0.05);
    dummy.updateMatrix();
    nosing.setMatrixAt(i, dummy.matrix);
  }
  steps.castShadow = steps.receiveShadow = true;
  hall.add(steps);
  hall.add(nosing);

  /* stringers: two clean rails instead of a handrail cage */
  const y0 = 1.4,
    z0 = -34.6,
    y1 = 12.2,
    z1 = -45.2;
  const len = Math.hypot(y1 - y0, z1 - z0);
  const tilt = -Math.atan2(y1 - y0, z0 - z1);
  [-1, 1].forEach((side) => {
    [0, -0.55].forEach((drop) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.07, len),
        steel,
      );
      rail.position.set(side * 2.72, (y0 + y1) / 2 + drop, (z0 + z1) / 2);
      rail.rotation.x = tilt;
      hall.add(rail);
    });
  });

  const skyHalo = addGlow(
    hall,
    34,
    20,
    [0, 16.9, -45.4],
    "rgba(206,242,255,.72)",
    "rgba(120,196,222,.14)",
    0.26,
  );
  skyHalo.rotation.x = -Math.PI / 2;
  skyHalo.material.side = THREE.DoubleSide;

  /* the papers: a folded sheet, rising and turning without a sound */
  const paperGeo = new THREE.BufferGeometry();
  paperGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        0, 0, 0.2, -0.14, 0, -0.14, 0, 0.05, -0.03,
        0, 0.05, -0.03, 0.14, 0, -0.14, 0, 0, 0.2,
        0, 0.05, -0.03, -0.14, 0, -0.14, 0.14, 0, -0.14,
      ],
      3,
    ),
  );
  paperGeo.computeVertexNormals();
  const papers = new THREE.InstancedMesh(
    paperGeo,
    new THREE.MeshBasicMaterial({
      color: 0xe7dfd0,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    22,
  );
  papers.frustumCulled = false;
  hall.add(papers);
  const paperState = [];
  for (let i = 0; i < 22; i++)
    paperState.push({
      x: (rand() - 0.5) * 8.4,
      y: rand() * 12,
      z: -30.4 - rand() * 12,
      sp: 0.4 + rand() * 0.55,
      ph: rand() * 6.28,
      spin: 0.18 + rand() * 0.4,
      s: 0.7 + rand() * 0.75,
    });

  /* ── 05 · the conversation table on the deck ── */
  const meeting = new THREE.Group();
  scene.add(meeting);
  addBox(meeting, [3.5, 0.12, 1.3], [-1.4, 1.55, -30.6], beamWood);
  [-1, 1].forEach((side) =>
    [-1, 1].forEach((end) =>
      addBox(
        meeting,
        [0.1, 0.78, 0.1],
        [-1.4 + side * 1.5, 1.16, -30.6 + end * 0.5],
        steel,
      ),
    ),
  );
  const chair = (z, dir) => {
    addBox(meeting, [0.56, 0.07, 0.56], [-1.4, 1.16, z], dark);
    addBox(meeting, [0.56, 0.68, 0.06], [-1.4, 1.5, z + dir * 0.28], dark);
    [
      [-0.23, -0.23],
      [0.23, -0.23],
      [-0.23, 0.23],
      [0.23, 0.23],
    ].forEach(([dx, dz]) =>
      addBox(meeting, [0.05, 0.4, 0.05], [-1.4 + dx, 0.96, z + dz], steel),
    );
  };
  chair(-29.55, -1);
  chair(-31.65, 1);
  /* a folder and two cups: the trace of a person, not a claim */
  addBox(meeting, [0.42, 0.035, 0.3], [-1.15, 1.63, -30.5], creamMat, 0.18);
  addBox(meeting, [0.38, 0.03, 0.26], [-1.18, 1.67, -30.49], dark, 0.12);
  [
    [-2.15, -30.35],
    [-0.72, -30.78],
  ].forEach(([x, z]) => {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 0.1, 14, 1, true),
      creamMat,
    );
    cup.position.set(x, 1.61, z);
    meeting.add(cup);
  });
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 0.5, 22, 1, true),
    dark,
  );
  shade.position.set(-1.4, 4.9, -30.6);
  meeting.add(shade);
  addGlow(
    meeting,
    1.7,
    1.7,
    [-1.4, 4.72, -30.6],
    "rgba(255,216,172,.95)",
    "rgba(255,148,68,.28)",
    0.6,
  );
  const tableLamp = new THREE.PointLight(0xff9a4c, 3.4, 12, 2);
  tableLamp.position.set(-1.4, 4.5, -30.6);
  meeting.add(tableLamp);

  /* the only daylight: a tall slot in the far wall, dawn over the field */
  const slot = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 7.4),
    new THREE.MeshBasicMaterial({
      map: tx(
        texGlow("rgba(196,238,252,.95)", "rgba(58,124,150,.34)"),
        { wrap: THREE.ClampToEdgeWrapping },
      ),
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  slot.position.set(-9.6, 5.8, -33.4);
  slot.rotation.y = Math.PI / 2;
  hall.add(slot);
  addBox(hall, [0.3, 0.3, 6.2], [-9.45, 9.4, -33.4], dark);
  addBox(hall, [0.3, 0.3, 6.2], [-9.45, 2.2, -33.4], dark);
  addBox(hall, [0.24, 3.2, 6.2], [-9.5, 0.9, -33.4], dark);

  /* the hall's crate walls close the frame without a visible ceiling */
  [-1, 1].forEach((side) => {
    for (let z = -28.5; z > -40; z -= 2.5) {
      const h = 3 + Math.floor(rand() * 4);
      for (let row = 0; row < h; row++)
        crate(
          side * (10.4 + rand() * 0.4),
          0.54 + row * 1.03,
          z + (rand() - 0.5) * 0.25,
          1,
          (rand() - 0.5) * 0.07,
        );
    }
  });

  crateField.count = ci;
  crateField.instanceMatrix.needsUpdate = true;
  scene.add(crateField);

  /* ── 06 · motion: the line advances, the papers climb, the doors breathe ── */
  WORLD.tick = (dt, clock) => {
    for (let i = 0; i < moving.length; i++) {
      const b = moving[i];
      b.position.z += dt * 0.42;
      if (b.position.z > -13.4) b.position.z -= 14;
    }
    for (let i = 0; i < paperState.length; i++) {
      const p = paperState[i];
      const y = 1.6 + ((p.y + clock * p.sp) % 12.4);
      dummy.position.set(
        p.x + Math.sin(clock * 0.42 + p.ph) * 0.55,
        y,
        p.z + Math.cos(clock * 0.31 + p.ph) * 0.5,
      );
      dummy.rotation.set(
        Math.sin(clock * 0.5 + p.ph) * 0.7,
        clock * p.spin + p.ph,
        Math.cos(clock * 0.38 + p.ph) * 0.55,
      );
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      papers.setMatrixAt(i, dummy.matrix);
    }
    papers.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < doorPanes.length; i++)
      doorPanes[i].material.emissiveIntensity =
        0.82 + Math.sin(clock * 0.7 + i * 1.7) * 0.1;
    for (let i = 0; i < lampGroups.length; i++) {
      lampGroups[i].rotation.z = Math.sin(clock * 0.45 + i) * 0.014;
      lampGroups[i].rotation.x = Math.cos(clock * 0.37 + i) * 0.01;
    }
    for (let i = 0; i < stationGlow.length; i++)
      stationGlow[i].material.opacity =
        0.26 + Math.sin(clock * 0.9 + i * 2.1) * 0.05;
  };

  scene.fog = new THREE.FogExp2(0x05090b, 0.0146);
  return { accent };
}
