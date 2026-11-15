/** GMP environmental adaptation. Kage camera/math/post remain in kage-engine.js.
 * No product geometry, packaging, labels, prices or business claims are generated.
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
  const accent = new THREE.Color().setHSL(190 / 360, 0.95, 0.4);
  const timber = surface(
    lib("gmpWood", () => texWood(3, { boards: 7 })),
    [4, 1.6],
    { color: 0x565150, normal: 1.5 },
  );
  const steel = new THREE.MeshStandardMaterial({
    color: 0x525c60,
    roughness: 0.46,
    metalness: 0.6,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x141a1c,
    roughness: 0.86,
    metalness: 0.12,
  });
  const stone = surface(
    lib("gmpStone", () => texStone(17)),
    [3, 3],
    { color: 0x69757a, normal: 0.3 },
  );
  const floorData = lib("gmpFloor", texFloor);
  const floorMat = new THREE.MeshStandardMaterial({
    map: tx(floorData.map),
    normalMap: tx(floorData.normal, { srgb: false }),
    color: 0x69757a,
    roughness: 0.74,
    metalness: 0.06,
  });
  const addBox = (group, size, at, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...at);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), floorMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -18);
  ground.receiveShadow = true;
  scene.add(ground);
  WORLD.floor = ground;
  WORLD.floorMat = floorMat;
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(360, 190),
    new THREE.MeshBasicMaterial({
      color: hdr(0.6, 0.7, 0.8),
      map: tx(texSky()),
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  sky.position.set(0, 62, -108);
  scene.add(sky);
  WORLD.sky = sky;
  [
    [-90, 13, 300, 26, 0],
    [-63, 9.5, 210, 19, 16],
  ].forEach((r, i) => {
    const ridge = new THREE.Mesh(
      new THREE.PlaneGeometry(r[2], r[3]),
      new THREE.MeshBasicMaterial({
        map: tx(texRidge()),
        transparent: true,
        color: i ? 0x0a1015 : 0x06090d,
        depthWrite: false,
        fog: false,
      }),
    );
    ridge.position.set(r[4], r[1], r[0]);
    ridge.renderOrder = 1;
    scene.add(ridge);
  });
  const groups = Array.from({ length: 5 }, () => new THREE.Group());
  groups.forEach((group) => scene.add(group));
  // 01 Threshold: architectural loading-bay opening, no manufacturer/product marks.
  const threshold = groups[0];
  [-1, 1].forEach((side) => {
    addBox(threshold, [1.1, 10, 2], [side * 9, 5, -9], timber);
    addBox(threshold, [12, 10, 0.8], [side * 15.4, 5, -9.8], timber);
  });
  addBox(threshold, [19, 1.0, 2], [0, 10, -9], timber);
  const edgeMat = new THREE.MeshBasicMaterial({
    color: accent.clone().multiplyScalar(1.06),
    toneMapped: false,
  });
  addBox(threshold, [16, 0.07, 0.08], [0, 9.35, -7.9], edgeMat);
  // 02 Cold: insulated chamber surfaces and a clear passage with frost-like veils.
  const cold = groups[1];
  [-1, 1].forEach((side) => {
    addBox(cold, [0.38, 8.4, 14], [side * 12, 4.2, -18], steel);
    for (let i = 0; i < 8; i++)
      addBox(cold, [0.12, 8.4, 0.08], [side * 11.78, 4.2, -12 - i * 1.8], dark);
  });
  addBox(cold, [24, 0.35, 14], [0, 8.4, -18], steel);
  const frost = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 8),
    new THREE.MeshBasicMaterial({
      map: tx(texGlow("rgba(160,205,210,.55)", "rgba(110,165,175,.18)")),
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  frost.position.set(0, 3.8, -23);
  cold.add(frost);
  // 03 Range: empty shelving architecture. Actual products belong to verified HTML/images.
  const catalog = groups[2];
  [-1, 1].forEach((side) => {
    for (let bay = 0; bay < 4; bay++) {
      const z = -20 - bay * 5;
      [-1, 1].forEach((end) =>
        addBox(catalog, [0.2, 8, 0.2], [side * 8, 4, z + end * 2], steel),
      );
      [1, 3.1, 5.2, 7.3].forEach((y) =>
        addBox(catalog, [3.0, 0.18, 4.2], [side * 9.3, y, z], steel),
      );
    }
  });
  // 04 Route: road surface and roadside forms only. No vehicle geometry.
  const route = groups[3];
  addBox(route, [8, 0.08, 42], [0, 0.045, -37], dark);
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 8; i++)
      addBox(route, [0.12, 0.08, 1.4], [side * 3.5, 0.1, -24 - i * 4], stone);
  });
  // 05 Table: work surfaces and simple utensils, without generated food.
  const table = groups[4];
  addBox(table, [12, 0.35, 4], [0, 4.2, -43], timber);
  [-1, 1].forEach((side) =>
    [-1, 1].forEach((end) =>
      addBox(
        table,
        [0.3, 4.1, 0.3],
        [side * 5.4, 2.05, -43 + end * 1.5],
        steel,
      ),
    ),
  );
  [-4, 0, 4].forEach((x) => {
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 0.75, 24, 1, true),
      dark,
    );
    shade.position.set(x, 9, -43);
    table.add(shade);
    const lamp = new THREE.PointLight(0xff8a26, 2.3, 15, 2);
    lamp.position.set(x, 8.4, -43);
    table.add(lamp);
  });
  for (let i = 0; i < 5; i++) {
    const utensil = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.055, 8, 20),
      steel,
    );
    utensil.position.set(-2 + i, 7.2, -46);
    table.add(utensil);
    addBox(table, [0.07, 0.85, 0.07], [-2 + i, 7.9, -46], steel);
  }
  const warmVeil = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 12),
    new THREE.MeshBasicMaterial({
      map: tx(texGlow("rgba(255,150,66,.80)", "rgba(240,96,26,.24)")),
      transparent: true,
      opacity: 0.17,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  warmVeil.position.set(0, 5.2, -44);
  scene.add(warmVeil);
  WORLD.hallHalo = warmVeil;
  WORLD.gmp = { groups, accent };
  // The accent disc uses the source HDR peak3.6; post coefficients stay literal.
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(8.6, 64),
    new THREE.MeshBasicMaterial({
      color: accent.clone().multiplyScalar(3.6),
      fog: false,
      toneMapped: false,
    }),
  );
  disc.position.set(17.9, 31.9, -72);
  scene.add(disc);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(55.04, 55.04),
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
  halo.position.set(17.9, 31.9, -72.3);
  scene.add(halo);
  WORLD.moon = disc;
  WORLD.moonHalo = halo;
  return WORLD.gmp;
}
