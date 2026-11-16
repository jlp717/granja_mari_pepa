/** GMP set design. Kage's camera, fog and post remain in kage-engine.js.
 *
 * One continuous building, read back to front like the temple it replaces:
 *   0 threshold  the dock gate — piers, timber lintel, shutter, dawn spill
 *   1 nave       steel colonnade, roof trusses, sodium high-bays
 *   2 racking    pallet bays receding to the vanishing point
 *   3 cold       insulated walls, frost, the open dock framing the sunrise
 *   4 pass       the stainless pass table under its own pendants
 * The only printed surfaces are the farm's own photographs: family prints on
 * the loaded pallets and two on the cold wall. The yard behind the dock is
 * drawn, not photographed — a dawn sky meant to read as outside from thirty
 * metres away, not as a picture pasted over a hole. Still no invented product
 * geometry, packaging copy, prices or business claims.
 */
export function buildGmpWorld(ctx) {
  const {
    THREE,
    scene,
    WORLD,
    surface,
    lib,
    texWood,
    texFloor,
    texStone,
    texSky,
    texRidge,
    tx,
    texGlow,
    hdr,
  } = ctx;

  const accent = new THREE.Color(0xcf3700);

  /* ------------------------------------------------------------- palette */
  const wood = surface(
    lib("gmpGateWood", () => texWood(3, { boards: 7 })),
    [5, 1.4],
    { color: 0x3b332e, normal: 1.4, roughness: 0.88 },
  );
  const board = surface(
    lib("gmpPassWood", () => texWood(11, { boards: 3 })),
    [1.6, 1.6],
    { color: 0x6a4f34, normal: 0.9, roughness: 0.8 },
  );
  const deckData = lib("gmpDeck", texFloor);
  const deckMat = new THREE.MeshStandardMaterial({
    map: tx(deckData.map),
    normalMap: tx(deckData.normal, { srgb: false }),
    color: 0x1d2427,
    roughness: 0.26,
    metalness: 0.5,
  });
  const asphalt = surface(
    lib("gmpAsphalt", () => texStone(17)),
    [7, 7],
    { color: 0x20272a, normal: 0.5, roughness: 0.96 },
  );
  const panelData = lib("gmpPanel", () => texStone(31));
  const coldPanel = new THREE.MeshStandardMaterial({
    map: tx(panelData.map),
    normalMap: tx(panelData.normal, { srgb: false }),
    color: 0x2c353a,
    roughness: 0.7,
    metalness: 0.16,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x1a2124,
    roughness: 0.5,
    metalness: 0.7,
  });
  const steelLit = new THREE.MeshStandardMaterial({
    color: 0x4a555a,
    roughness: 0.34,
    metalness: 0.88,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x101617,
    roughness: 0.88,
    metalness: 0.16,
  });
  const ink = new THREE.MeshStandardMaterial({
    color: 0x0b1012,
    roughness: 0.95,
    metalness: 0.05,
  });
  const edge = new THREE.MeshBasicMaterial({
    color: accent.clone().multiplyScalar(1.5),
    toneMapped: false,
  });
  const marking = new THREE.MeshBasicMaterial({
    color: accent.clone().multiplyScalar(0.42),
  });
  /* worn yellow line paint. The aisle is the one place in the set where a
     warning colour belongs, and vermilion is the headline's, not the floor's. */
  const safety = new THREE.MeshBasicMaterial({ color: 0x8a6414 });
  const coldStrip = new THREE.MeshBasicMaterial({
    color: hdr(1.15, 1.55, 1.75),
    toneMapped: false,
  });
  const warmDisc = new THREE.MeshBasicMaterial({
    color: hdr(2.6, 1.35, 0.62),
    toneMapped: false,
    fog: false,
  });

  /* ------------------------------------------------------- real photography
     The only photographs in the set belong to the farm. A basic material keeps
     them display-referred: ACES at exposure 1 would pull every print down to
     grey. The base colour is a dark ink, so a request that never resolves
     leaves a blank pallet face rather than a white card in the hall. Textures
     are cached per source, so the five family prints load once each. */
  const photoCache = new Map();
  const photoMaterial = (src, opts) => {
    opts = opts || {};
    const material = new THREE.MeshBasicMaterial({
      color: 0x111a1d,
      transparent: true,
      opacity: opts.opacity === undefined ? 1 : opts.opacity,
      depthWrite: false,
      fog: opts.fog === undefined ? true : opts.fog,
      toneMapped: opts.toneMapped === undefined ? false : opts.toneMapped,
    });
    /* where a photograph replaces something that already worked, a failed
       request has to restore that thing instead of leaving a dark card over it */
    material.userData.hideOnFail = opts.hideOnFail === true;
    const cached = photoCache.get(src);
    if (cached && cached.texture) {
      material.map = cached.texture;
      material.color.setHex(0xffffff);
      material.needsUpdate = true;
      return material;
    }
    if (
      typeof window === "undefined" ||
      typeof Image === "undefined" ||
      typeof document === "undefined"
    )
      return material;
    const entry = cached || { texture: null, waiting: [] };
    entry.waiting.push(material);
    photoCache.set(src, entry);
    const image = new Image();
    image.onload = () => {
      const map = new THREE.Texture(image);
      map.encoding = THREE.sRGBEncoding;
      map.needsUpdate = true;
      entry.texture = map;
      entry.waiting.forEach((waiting) => {
        waiting.map = map;
        waiting.color.setHex(0xffffff);
        waiting.needsUpdate = true;
      });
      entry.waiting.length = 0;
    };
    /* a missing print is a blank face, not a broken build */
    image.onerror = () => {
      entry.waiting.forEach((waiting) => {
        if (waiting.userData.hideOnFail) waiting.visible = false;
      });
      entry.waiting.length = 0;
      photoCache.delete(src);
    };
    image.src = src;
    return material;
  };

  const add = (group, size, at, material, rot) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size[0], size[1], size[2]),
      material,
    );
    mesh.position.set(at[0], at[1], at[2]);
    if (rot) mesh.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    mesh.castShadow = material !== ink;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  /* An I-beam as it is actually rolled: two flanges and a web. A plain box
     column reads as a stick at this distance; the flanges give it an edge to
     catch the key light. */
  const column = (group, x, z, height, material) => {
    add(group, [0.42, height, 0.6], [x, height / 2, z], material);
    [-1, 1].forEach((s) =>
      add(group, [1.1, height, 0.17], [x, height / 2, z + s * 0.3], material),
    );
    add(group, [1.32, 0.26, 1.12], [x, 0.13, z], material);
    add(group, [1.1, 0.26, 0.92], [x, height - 0.14, z], material);
  };

  /* The practicals are the only warm light in a cold building. Registering
     them with the engine lets the focus pulse run through the set. */
  const practicals = [];
  const glows = [];
  const lamp = (group, x, y, z, scale) => {
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.86 * scale, 0.52 * scale, 22, 1, true),
      dark,
    );
    shade.position.set(x, y + 0.26 * scale, z);
    group.add(shade);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.56 * scale, 26),
      warmDisc,
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, y, z);
    group.add(disc);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4 * scale, 3.4 * scale),
      new THREE.MeshBasicMaterial({
        map: tx(texGlow("rgba(255,176,96,.96)", "rgba(240,108,38,.3)")),
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.position.set(x, y - 0.2, z);
    glow.renderOrder = 8;
    group.add(glow);
    glows.push(glow);
    const light = new THREE.PointLight(0xff8f34, 2.4, 17, 2);
    light.position.set(x, y - 0.3, z);
    group.add(light);
    practicals.push(light);
    return glow;
  };

  /* --------------------------------------------------------- the ground */
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(26, 62), deckMat);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, 0, -22);
  deck.receiveShadow = true;
  scene.add(deck);
  WORLD.floor = deck;
  WORLD.floorMat = deckMat;

  const forecourt = new THREE.Mesh(new THREE.PlaneGeometry(120, 54), asphalt);
  forecourt.rotation.x = -Math.PI / 2;
  forecourt.position.set(0, -0.04, 22);
  forecourt.receiveShadow = true;
  scene.add(forecourt);

  const groups = Array.from({ length: 5 }, () => new THREE.Group());
  groups.forEach((group) => scene.add(group));

  /* --------------------------------------------- 00 · the dock gate (hero) */
  const gate = groups[0];
  [-1, 1].forEach((side) => column(gate, side * 7.7, -9.5, 10.2, steel));
  add(gate, [16.9, 1.16, 1.02], [0, 10.5, -9.5], wood);
  add(gate, [17.9, 0.34, 0.86], [0, 11.45, -9.5], steelLit);
  /* the beam's shadow gap: one vermilion line, and only on the lit side so the
     headline never loses contrast to a stripe behind it */
  add(gate, [0.07, 8.4, 0.18], [7.18, 4.9, -9.2], edge);
  add(gate, [7.0, 0.06, 0.16], [3.9, 9.86, -9.2], edge);
  /* the roller shutter, wound up: the gate has to read as an opening, not a
     wall. Only the coil and its guides stay in frame. */
  add(gate, [13.8, 1.05, 0.72], [0, 8.2, -11.9], steel);
  for (let i = 0; i < 4; i++)
    add(gate, [13.86, 0.09, 0.76], [0, 7.82 + i * 0.26, -11.9], steelLit);
  add(gate, [13.9, 0.42, 0.34], [0, 8.92, -11.9], steel);
  [-1, 1].forEach((side) =>
    add(gate, [0.2, 8.6, 0.36], [side * 6.95, 4.4, -11.86], steel),
  );
  /* the light under the door: what the whole frame is about */
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(13.4, 3.4),
    new THREE.MeshBasicMaterial({
      map: tx(texGlow("rgba(255,166,92,.92)", "rgba(238,104,36,.22)")),
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  spill.position.set(0, 1.62, -11.5);
  spill.renderOrder = 6;
  gate.add(spill);
  WORLD.hallHalo = spill;
  [[-5.6, -6.4], [5.6, -6.4], [-7.4, -6.4], [7.4, -6.4]].forEach(([x, z]) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.17, 1.05, 10),
      steelLit,
    );
    post.position.set(x, 0.53, z);
    post.castShadow = true;
    gate.add(post);
    add(gate, [0.36, 0.05, 0.36], [x, 0.99, z], edge);
  });
  /* the deck marking runs from the camera to the vanishing point: the only
     line in the frame that tells you how far the building goes */
  [-1, 1].forEach((side) =>
    add(gate, [0.14, 0.02, 44], [side * 5.1, 0.015, -17], marking),
  );
  /* the drain chase crosses the apron: floor detail in the emptiest third */
  [-4.2, -20].forEach((z) =>
    add(gate, [15.4, 0.06, 0.56], [0, 0.03, z], dark),
  );
  lamp(gate, 7.9, 5.4, -7.1, 1.05);

  /* ------------------------------------------ 01 · the nave (colonnade) */
  const nave = groups[1];
  const BAYS = [-6, -12, -18, -24, -30, -36];
  /* a canopy over the near bays only: it gives the frame a lid without
     cutting the sun out of the far sky, which is the one lit thing up there */
  add(nave, [26, 0.36, 29], [0, 10.92, -6.5], ink);
  BAYS.forEach((z) => {
    [-1, 1].forEach((side) => column(nave, side * 6.9, z, 9.2, steel));
    /* roof truss: bottom chord, top chord, king post, four webs. Read as a
       silhouette against the sky, which is the whole point of a shed */
    add(nave, [13.9, 0.17, 0.17], [0, 9.34, z], steel);
    add(nave, [13.9, 0.15, 0.15], [0, 10.5, z], steel);
    add(nave, [0.13, 1.16, 0.13], [0, 9.92, z], steel);
    [-1, 1].forEach((side) => {
      add(nave, [3.5, 0.1, 0.1], [side * 3.4, 9.92, z], steel, [0, 0, side * 0.32]);
      add(nave, [3.2, 0.09, 0.09], [side * 4.9, 10.15, z], steel, [
        0,
        0,
        side * -0.42,
      ]);
    });
  });
  /* high-bays hang off the right-hand line; the left stays in shadow */
  lamp(nave, 5.15, 7.35, -13, 1);
  lamp(nave, 5.15, 7.35, -22, 1);
  lamp(nave, 5.15, 7.35, -31, 1);
  lamp(nave, -5.15, 7.35, -26, 1);
  [-1, 1].forEach((side) =>
    add(nave, [0.07, 0.07, 31], [side * 5.15, 8.5, -22], dark),
  );
  /* Purlins across the trusses every 4 m, and the sprinkler main down the
     centre: the two lines that make the roof read as a shed and not a lid. */
  for (let z = -4; z >= -40; z -= 4)
    add(nave, [12.6, 0.12, 0.18], [0, 9.4, z], steel);
  add(nave, [0.08, 0.08, 30], [0, 9.0, -24], dark);
  for (let z = -9; z >= -39; z -= 5)
    add(nave, [0.12, 0.12, 0.12], [0, 8.9, z], steelLit);

  /* ------------------------------------------ 02 · the racking corridor */
  const rack = groups[2];
  for (let i = 0; i < 7; i++) {
    const z = -12.5 - i * 4.1;
    [-1, 1].forEach((side) => {
      add(rack, [0.22, 7.5, 0.24], [side * 8.6, 3.75, z], steel);
      add(rack, [0.24, 0.3, 0.7], [side * 8.6, 0.15, z], steel);
    });
  }
  [1.7, 4.1, 6.5].forEach((y) =>
    [-1, 1].forEach((side) =>
      add(rack, [0.18, 0.26, 27], [side * 8.6, y, -24.8], steelLit),
    ),
  );
  /* loads: pallets stacked to the beam, most of them blank. The set has to
     read as a working warehouse, and empty racks read as scaffolding — but a
     printed face on every box reads as wallpaper. One label per face, on two
     of every three, cycling the five families. */
  const loads = [];
  for (let bay = 0; bay < 6; bay++) {
    const z = -14.5 - bay * 4.1;
    [2.5, 4.9, 7.3].forEach((y) => {
      [-1, 1].forEach((side) => {
        if ((bay + Math.round(y) + (side > 0 ? 1 : 0)) % 3 === 0) return;
        loads.push([side * 9.8, y, z]);
      });
    });
  }
  const FAMILY_PRINTS = [
    "/catalogs/familias/real-mar-2.jpg",
    "/catalogs/familias/real-carne-2.jpg",
    "/catalogs/familias/real-reposteria-2.jpg",
    "/catalogs/familias/real-panaderia-2.jpg",
    "/catalogs/familias/real-salsas-2.jpg",
  ];
  let printed = 0;
  /* film: a wrapped pallet catches the high-bays as a sheen, not as a white
     box. One shared material, written without depth so it never hides the
     carton inside it. */
  const film = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.07,
    roughness: 0.25,
    metalness: 0,
    depthWrite: false,
  });
  loads.forEach(([x, y, z], index) => {
    /* every load is a pallet first — bearers, deck, then the carton on top.
       Height staggers on a fixed cycle, so the bays never read as one block,
       and it still clears the shelf above by a few centimetres. */
    const h = 1.55 + ((index * 7) % 4) * 0.18;
    const bottom = y - 0.87;
    const cy = bottom + h / 2;
    add(rack, [2.46, 0.16, 2.26], [x, y - 1.02, z], steel);
    add(rack, [2.6, 0.12, 2.4], [x, y - 1.01, z], board);
    [-0.85, 0, 0.85].forEach((dz) =>
      add(rack, [2.6, 0.08, 0.35], [x, y - 0.91, z + dz], board),
    );
    add(rack, [2.4, h, 2.2], [x, cy, z], ink);
    if (index % 3 === 1)
      add(rack, [2.46, h + 0.03, 2.26], [x, cy, z], film);
    if (index % 3 === 2) return;
    const face = new THREE.Group();
    face.position.set(x, cy, z + 1.12);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.15),
      photoMaterial(FAMILY_PRINTS[printed++ % FAMILY_PRINTS.length], {
        opacity: 0.92,
      }),
    );
    label.renderOrder = 4;
    face.add(label);
    /* the frame is surface-mounted around the sheet, not over it: bars drawn
       across the print would cut into whatever the photograph shows */
    add(face, [2.06, 0.05, 0.04], [0, 0.605, 0.005], steel);
    add(face, [2.06, 0.05, 0.04], [0, -0.605, 0.005], steel);
    add(face, [0.06, 1.26, 0.04], [-0.985, 0, 0.005], steel);
    add(face, [0.06, 1.26, 0.04], [0.985, 0, 0.005], steel);
    rack.add(face);
  });
  [-1, 1].forEach((side) =>
    add(rack, [0.08, 0.26, 27], [side * 7.9, 0.16, -24.8], edge),
  );
  /* Aisle markings: two continuous edge lines, and a broken centre line that
     gives the floor a measure of depth. Both sit a centimetre off the deck so
     they never fight it for the same pixel. */
  [-1, 1].forEach((side) =>
    add(rack, [0.12, 0.01, 40], [side * 6.1, 0.014, -20], safety),
  );
  for (let z = -2; z >= -40; z -= 4)
    add(rack, [0.14, 0.01, 1.5], [0, 0.014, z], safety);
  /* Bollards at the rack ends: what a forklift would actually hit, and the
     only dark vertical accent at floor level on either side of the aisle. */
  for (let z = -12; z >= -38; z -= 4)
    [-1, 1].forEach((side) =>
      add(rack, [0.18, 0.9, 0.18], [side * 9.8, 0.45, z], dark),
    );
  /* One forklift parked in the aisle: body, mast, forks. Wheels and cage
     become noise at this distance, so the silhouette stops there. */
  add(rack, [1.6, 1.2, 2.6], [3.6, 0.6, -18], dark);
  add(rack, [0.2, 2.8, 0.2], [3.6, 1.4, -16.8], steel);
  add(rack, [1.2, 0.08, 0.12], [3.6, 0.2, -16.2], steelLit);

  /* --------------------------------- 03 · cold walls and the open dock */
  const cold = groups[3];
  [-1, 1].forEach((side) => {
    add(cold, [0.44, 8.4, 30], [side * 12.4, 4.2, -27], coldPanel);
    for (let i = 0; i < 8; i++)
      add(cold, [0.06, 8.4, 0.07], [side * 12.16, 4.2, -13 - i * 3.6], dark);
    add(cold, [0.12, 0.1, 30], [side * 12.1, 8.15, -27], coldStrip);
  });
  /* the end wall, built around one bright opening */
  add(cold, [7.6, 11.4, 0.6], [-10.3, 5.7, -44], coldPanel);
  add(cold, [7.6, 11.4, 0.6], [10.3, 5.7, -44], coldPanel);
  add(cold, [13.0, 3.1, 0.6], [0, 9.85, -44], coldPanel);
  [-1, 1].forEach((side) =>
    add(cold, [0.38, 8.5, 0.72], [side * 6.62, 4.25, -43.9], steelLit),
  );
  add(cold, [13.62, 0.4, 0.72], [0, 8.44, -43.9], steelLit);
  /* The yard beyond: drawn, not photographed. The print of the loading yard was
     the last imported image in the building and it read as a postcard pasted
     over the opening — no horizon, no scale, no depth. A 512×256 dawn sky with
     three ridgelines and the shed next door does the same job inside the set's
     own palette, and it cannot arrive late or broken. The warm glow stays over
     it, so the opening keeps its heat; the plane never writes depth and ignores
     the fog, so it sits behind the glow exactly where the print did. Every
     curve is a fixed sine term, so the skyline is identical on every visit. */
  /* jsdom and a canvas-less client hand back no 2d context. In that case the
     opening keeps the glow alone, which is what it had before this plane. */
  const yardCanvas = (() => {
    if (typeof document === "undefined") return null;
    try {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      return c.getContext("2d") ? c : null;
    } catch {
      return null;
    }
  })();
  if (yardCanvas) {
    const W = 512;
    const H = 256;
    const horizon = 150;
    const skyPx = yardCanvas.getContext("2d");
    const skyGrad = skyPx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, "rgb(8,16,27)");
    skyGrad.addColorStop(0.38, "rgb(25,38,53)");
    skyGrad.addColorStop(0.68, "rgb(64,72,86)");
    skyGrad.addColorStop(0.86, "rgb(146,120,110)");
    skyGrad.addColorStop(1, "rgb(198,150,104)");
    skyPx.fillStyle = skyGrad;
    skyPx.fillRect(0, 0, W, horizon);
    /* the yard itself is already in shadow: the darkest band in the frame */
    const groundGrad = skyPx.createLinearGradient(0, horizon, 0, H);
    groundGrad.addColorStop(0, "rgb(56,50,48)");
    groundGrad.addColorStop(0.4, "rgb(30,29,30)");
    groundGrad.addColorStop(1, "rgb(15,16,18)");
    skyPx.fillStyle = groundGrad;
    skyPx.fillRect(0, horizon, W, H - horizon);
    /* three ridges, back to front, in blue-grey: the far one is palest because
       the sky is palest behind it */
    const ridge = (base, amp, freq, phase, color) => {
      skyPx.beginPath();
      skyPx.moveTo(0, H);
      for (let i = 0; i <= W; i += 4) {
        const t = i / W;
        const y =
          base -
          amp * (0.5 + 0.5 * Math.sin(t * freq + phase)) -
          amp * 0.22 * Math.sin(t * freq * 2.7 + phase * 1.9);
        skyPx.lineTo(i, y);
      }
      skyPx.lineTo(W, H);
      skyPx.closePath();
      skyPx.fillStyle = color;
      skyPx.fill();
    };
    ridge(horizon - 24, 21, 5.4, 0.6, "rgb(58,72,88)");
    ridge(horizon - 10, 16, 8.1, 2.4, "rgb(39,51,63)");
    ridge(horizon - 3, 8, 12.6, 4.1, "rgb(24,32,41)");
    /* the shed next door, on the right: a sawtooth roofline, the only hard edge
       in an otherwise soft horizon */
    skyPx.fillStyle = "rgb(17,23,29)";
    skyPx.fillRect(352, horizon - 24, 132, 24);
    for (let i = 0; i < 4; i++) {
      const bx = 352 + i * 33;
      skyPx.beginPath();
      skyPx.moveTo(bx, horizon - 24);
      skyPx.lineTo(bx + 16.5, horizon - 36);
      skyPx.lineTo(bx + 33, horizon - 24);
      skyPx.closePath();
      skyPx.fill();
    }
    skyPx.fillRect(462, horizon - 44, 9, 20);
    const yardTex = new THREE.CanvasTexture(yardCanvas);
    yardTex.encoding = THREE.sRGBEncoding;
    yardTex.needsUpdate = true;
    const yardWall = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 14),
      new THREE.MeshBasicMaterial({
        map: yardTex,
        fog: false,
        depthWrite: false,
        transparent: false,
        toneMapped: false,
      }),
    );
    yardWall.position.set(0, 4.2, -53);
    yardWall.renderOrder = 3;
    cold.add(yardWall);
  }
  const yard = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 16),
    new THREE.MeshBasicMaterial({
      map: tx(texGlow("rgba(255,158,84,.9)", "rgba(226,92,26,.22)")),
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  yard.position.set(0, 4.1, -52);
  yard.renderOrder = 4;
  cold.add(yard);
  const frost = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 9),
    new THREE.MeshBasicMaterial({
      map: tx(texGlow("rgba(170,214,224,.6)", "rgba(96,150,166,.14)")),
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  frost.position.set(0, 4.4, -43.2);
  cold.add(frost);
  /* Two prints on the cold wall, at working height, where the aisle already
     looks: the family the dock is built around on the left, the one the
     morning shift sees on the right. They are the only thing on either side of
     the hall that is not steel or panel, and they hang behind the racking, so
     they never compete with the headline. */
  const poster = (x, z, rotationY, src) => {
    const sheet = new THREE.Group();
    sheet.position.set(x, 4.2, z);
    sheet.rotation.y = rotationY;
    const print = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.0),
      photoMaterial(src, { opacity: 0.9 }),
    );
    print.renderOrder = 4;
    sheet.add(print);
    /* the frame hangs behind the print, in the .08 the panel leaves between
       its face and the seam bars: it reads as a recessed border and never
       covers the photograph */
    add(sheet, [3.4, 0.07, 0.05], [0, 1.035, -0.045], steel);
    add(sheet, [3.4, 0.07, 0.05], [0, -1.035, -0.045], steel);
    add(sheet, [0.07, 2.14, 0.05], [-1.665, 0, -0.045], steel);
    add(sheet, [0.07, 2.14, 0.05], [1.665, 0, -0.045], steel);
    cold.add(sheet);
  };
  poster(-12.1, -20, Math.PI / 2, "/catalogs/familias/real-mar-2.jpg");
  poster(12.1, -20, -Math.PI / 2, "/catalogs/familias/real-reposteria-2.jpg");
  /* The brand sits on the dock header, off the axis the headline runs down.
     Kage gives its wordmark one deep, lit plane; this is that plane, sized to
     signage and placed where no copy can land on it. */
  if (
    typeof window !== "undefined" &&
    typeof Image !== "undefined" &&
    typeof document !== "undefined"
  ) {
    const mark = document.createElement("img");
    mark.src = "/kage/brand/logo-alpha.png";
    mark.onload = () => {
      const map = new THREE.Texture(mark);
      map.encoding = THREE.sRGBEncoding;
      map.needsUpdate = true;
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(5.4, 1.64),
        new THREE.MeshBasicMaterial({
          map,
          transparent: true,
          depthWrite: false,
          fog: false,
          toneMapped: false,
          opacity: 0.72,
        }),
      );
      sign.position.set(4.15, 10.34, -8.92);
      gate.add(sign);
      WORLD.sign = sign;
      /* The same wordmark again, far down the aisle, low and quiet against the
         dock opening. It closes the perspective without competing with the
         headline: the texture is already decoded, so this costs no second
         request, and it sits below the header beam in the open bay. */
      const endSign = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 1.28),
        new THREE.MeshBasicMaterial({
          map,
          transparent: true,
          depthWrite: false,
          fog: false,
          toneMapped: false,
          opacity: 0.55,
        }),
      );
      endSign.position.set(0, 6.95, -43.55);
      endSign.renderOrder = 5;
      cold.add(endSign);
      WORLD.endSign = endSign;
    };
  }

  const platform = add(cold, [13.2, 0.92, 3.8], [0, 0.46, -41.5], steel);
  platform.receiveShadow = true;
  add(cold, [13.24, 0.1, 0.22], [0, 0.97, -39.7], edge);
  [-1, 1].forEach((side) =>
    add(cold, [0.66, 0.86, 0.34], [side * 5.9, 0.9, -39.9], dark),
  );
  /* Dock furniture, so the opening reads as a working door and not a hole:
     rubber bumpers either side, the leveller lip on the platform, and the
     shutter lamellas wound down over the gap. */
  [-1, 1].forEach((side) =>
    add(cold, [0.8, 1.2, 0.5], [side * 5.8, 1.0, -43.6], dark),
  );
  add(cold, [6.0, 0.16, 1.8], [0, 0.99, -42.4], steel);
  for (let i = 0; i < 6; i++)
    add(cold, [11.8, 0.18, 0.1], [0, 8.5 + i * 0.3, -43.7], steelLit);

  /* ------------------------------------------------- 04 · the pass table */
  const pass = groups[4];
  const bench = new THREE.MeshStandardMaterial({
    color: 0x2a3236,
    roughness: 0.44,
    metalness: 0.58,
  });
  add(pass, [8.6, 0.16, 3.2], [0, 3.32, -33.5], bench);
  add(pass, [7.9, 0.14, 2.6], [0, 3.06, -33.5], steel);
  [
    [-3.9, -32.4],
    [3.9, -32.4],
    [-3.9, -34.6],
    [3.9, -34.6],
  ].forEach(([x, z]) => add(pass, [0.16, 3.1, 0.16], [x, 1.55, z], steel));
  add(pass, [8.62, 0.05, 0.06], [0, 3.2, -31.92], edge);
  lamp(pass, -2.5, 7.0, -33.5, 0.92);
  lamp(pass, 0, 7.0, -33.5, 0.92);
  lamp(pass, 2.5, 7.0, -33.5, 0.92);
  add(pass, [2.4, 0.1, 1.3], [-1.7, 3.45, -33.2], board);
  add(pass, [2.6, 0.07, 0.07], [1.7, 4.9, -34.4], steelLit);
  for (let i = 0; i < 4; i++)
    add(pass, [0.05, 0.74, 0.18], [0.9 + i * 0.5, 4.5, -34.4], steelLit);
  [[3.3, 4.1, -32.9], [3.3, 5.0, -32.9], [4.0, 4.1, -34.1]].forEach(
    ([x, y, z]) => add(pass, [1.16, 0.86, 1.16], [x, y, z], dark),
  );

  /* ------------------------------------------------------ the far shell */
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 210),
    new THREE.MeshBasicMaterial({
      color: hdr(0.21, 0.26, 0.33),
      map: tx(texSky()),
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  sky.position.set(0, 38, -96);
  scene.add(sky);
  WORLD.sky = sky;
  [[-86, 8.5, 250, 24], [-56, 5.4, 200, 17]].forEach((r, i) => {
    const ridge = new THREE.Mesh(
      new THREE.PlaneGeometry(r[2], r[3]),
      new THREE.MeshBasicMaterial({
        map: tx(texRidge()),
        transparent: true,
        color: i ? 0x0a1116 : 0x060a0e,
        depthWrite: false,
        fog: false,
      }),
    );
    ridge.position.set(0, r[1], r[0]);
    ridge.renderOrder = 1;
    scene.add(ridge);
  });

  /* The Lorca sun: high and to the right, where Kage keeps its moon — clear
     of the headline, clear of the CTAs, visible over the truss line. */
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(4.6, 64),
    new THREE.MeshBasicMaterial({
      color: hdr(2.4, 0.46, 0.2),
      fog: false,
      toneMapped: false,
    }),
  );
  disc.position.set(29.5, 26.4, -74);
  scene.add(disc);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 34),
    new THREE.MeshBasicMaterial({
      map: tx(texGlow()),
      color: accent,
      opacity: 0.44,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  halo.position.set(29.5, 26.4, -74.4);
  scene.add(halo);
  WORLD.moon = disc;
  WORLD.moonHalo = halo;

  /* One cool fill so the steel never goes to pure black, and nothing more.
     The engine's own key is retuned here: it was composed for a temple and at
     full strength it floods a steel shed into flat blue. A low raking key from
     the left and one warm source deep in the dock give the set its contrast. */
  scene.add(new THREE.HemisphereLight(0x35505c, 0x0d0906, 0.14));
  if (WORLD.key) {
    WORLD.key.color.setHex(0x9fc6d8);
    WORLD.key.intensity = 0.62;
    WORLD.key.position.set(16, 15, 2);
    WORLD.key.target.position.set(-2, 2.4, -19);
    WORLD.key.target.updateMatrixWorld();
  }
  if (WORLD.moonLight) {
    WORLD.moonLight.color.setHex(0xff5a24);
    WORLD.moonLight.intensity = 2.2;
    WORLD.moonLight.distance = 40;
    WORLD.moonLight.position.set(9, 8.5, -37);
  }
  if (WORLD.hallLight) WORLD.hallLight.position.set(0, 5.0, -12.6);

  /* the dock door is the only warm source: it has to throw, not just glow */
  const dawn = new THREE.PointLight(0xff9a4e, 3.1, 34, 2);
  dawn.position.set(1.5, 3.4, -47);
  scene.add(dawn);

  WORLD.lanternLights = practicals;
  WORLD.lanternGlows = glows;
  WORLD.gmp = { groups, accent };
  return WORLD.gmp;
}
