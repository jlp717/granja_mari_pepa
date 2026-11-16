import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import * as ts from "typescript";
import { buildGmpWorld } from "./world-gmp.js";
// Real vendored149 geometry/material constructors. No WebGL context or backend.
const exports149 = {};
vm.runInNewContext(
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "../reference/kage-verbatim/secret-pathways-assets/three.min.js",
    ),
    "utf8",
  ),
  { exports: exports149, module: { exports: exports149 }, console },
);
const THREE = exports149;
it("constructs five real environmental groups with the measured accent", () => {
  const scene = new THREE.Scene(),
    WORLD = {},
    cache = {};
  const texture = () => new THREE.Texture();
  const result = buildGmpWorld({
    THREE,
    scene,
    WORLD,
    lib: (key, create) => cache[key] || (cache[key] = create()),
    texWood: () => ({}),
    texStone: () => ({}),
    texFloor: () => ({}),
    texGlow: () => ({}),
    texSky: () => ({}),
    texRidge: () => ({}),
    tx: texture,
    surface: () => new THREE.MeshStandardMaterial(),
    hdr: (r, g, b) => new THREE.Color().setRGB(r, g, b),
  });
  expect(THREE.REVISION).toBe("149");
  expect(result.groups).toHaveLength(5);
  result.groups.forEach((group) => {
    let count = 0;
    group.traverse((object) => {
      if (object.isMesh) {
        count++;
        expect(object.geometry.attributes.position.count).toBeGreaterThan(0);
      }
    });
    expect(count).toBeGreaterThan(4);
  });
  const color = result.accent.getHexString();
  expect(color).toBe("cf3700");
  expect(WORLD.floor.isMesh).toBe(true);
  expect(WORLD.moon.geometry.type).toBe("CircleGeometry");
  expect(scene.children).toContain(result.groups[4]);
});

it("fits the real logo through WORD and uses the literal reveal/dissolve envelope in journey and quiet catalogue scenes", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "components/gmp/engine/gmp-engine.js"),
    "utf8",
  );
  const ast = ts.createSourceFile(
    "gmp-engine.js",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const find = (name, predicate) => {
    let result;
    const visit = (node) => {
      if (!result && predicate(node) && node.name?.getText(ast) === name)
        result = node;
      ts.forEachChild(node, visit);
    };
    visit(ast);
    if (!result) throw new Error(`Missing real engine source: ${name}`);
    return result;
  };
  const functionSource = (name) =>
    find(name, ts.isFunctionDeclaration).getText(ast);
  const declaration = (name) =>
    `const ${find(name, ts.isVariableDeclaration).getText(ast)};`;
  const texture = new THREE.Texture({ width: 600, height: 182 });
  const scopedThree = Object.create(THREE);
  scopedThree.TextureLoader = class {
    load(url, loaded) {
      expect(url).toBe("/gmp/brand/logo-alpha.png");
      loaded(texture);
    }
  };
  const scene = new THREE.Scene();
  const WORD = { group: null, glyphs: [], ink: null, reveal: 0 };
  const WORLD = { uT: { value: 0 } };
  const layoutWord = jest.fn();
  const context = vm.createContext({
    THREE: scopedThree,
    scene,
    WORD,
    WORLD,
    layoutWord,
    options: { logoUrl: "/gmp/brand/logo-alpha.png" },
    disposed: false,
    clock: 0,
    RIG: { smooth: 0, focus: -1, focusAmt: 0 },
    CARDS: [],
    updateLeaves: () => {},
    updateWisps: () => {},
  });
  vm.runInContext(
    [
      ...["clamp", "sat", "lerp", "smooth", "easeOut", "damp", "WORD_Z"].map(
        declaration,
      ),
      functionSource("loadBrandPlane"),
      functionSource("updateWorld"),
      "loadBrandPlane();",
    ].join("\n"),
    context,
  );
  expect(WORD.group.isGroup).toBe(true);
  expect(scene.children).toContain(WORD.group);
  expect(WORD.group.children).toEqual([WORLD.brand]);
  expect(WORD.glyphs).toEqual([WORLD.brand]);
  expect(WORLD.brand.geometry.parameters).toMatchObject({
    width: 600,
    height: 182,
  });
  expect(WORLD.brand.material.map).toBe(texture);
  expect(WORLD.brand.userData.baseY).toBe(91);
  expect(WORD.ink).toMatchObject({ w: 600, asc: 182, cx: 0 });
  expect(WORD.group.position.z).toBe(3);
  expect(layoutWord).toHaveBeenCalledTimes(1);
  expect(WORLD.brand.material.opacity).toBe(0);
  vm.runInContext("updateWorld(0);", context);
  expect(WORLD.brand.visible).toBe(false);
  WORD.reveal = 1.2;
  vm.runInContext("RIG.smooth = 0; updateWorld(0);", context);
  expect(WORLD.brand.material.opacity).toBe(1);
  expect(WORLD.brand.position.y).toBe(91);
  vm.runInContext("RIG.smooth = 1; updateWorld(0);", context);
  expect(WORLD.brand.material.opacity).toBeCloseTo(0.04);
  vm.runInContext("RIG.smooth = 2; updateWorld(0);", context);
  expect(WORLD.brand.material.opacity).toBeCloseTo(0.04);
});
