import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const html = fs.readFileSync(
  path.resolve(process.cwd(), "../reference/kage-verbatim/index.html"),
  "utf8",
);
const reference = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
if (!reference) throw new Error("The immutable GMP source is required");
const port = fs.readFileSync(
  path.resolve(process.cwd(), "components/gmp/engine/gmp-engine.js"),
  "utf8",
);
const parse = (text: string) =>
  ts.createSourceFile(
    "literal.js",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
function named(tree: ts.Node, name: string): ts.Node {
  let found: ts.Node | undefined;
  const walk = (node: ts.Node) => {
    if (
      (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) &&
      node.name?.getText() === name
    ) {
      found = node;
      return;
    }
    ts.forEachChild(node, (child) => {
      if (!found) walk(child);
    });
  };
  walk(tree);
  if (!found) throw new Error("Literal source symbol missing: " + name);
  return found;
}
interface Shape {
  kind: number;
  text?: string | number;
  children: Shape[];
}
function shape(node: ts.Node): Shape {
  if (ts.isParenthesizedExpression(node)) return shape(node.expression);
  // The port wraps four original standalone ternary side effects in void for ESLint.
  // Their result was unused already; preserve the complete conditional AST below.
  if (ts.isExpressionStatement(node) && ts.isVoidExpression(node.expression)) {
    let expression: ts.Expression = node.expression.expression;
    while (ts.isParenthesizedExpression(expression))
      expression = expression.expression;
    if (ts.isConditionalExpression(expression))
      return { kind: node.kind, children: [shape(expression)] };
  }

  const children: Shape[] = [];
  ts.forEachChild(node, (child) => {
    children.push(shape(child));
  });
  return {
    kind: node.kind,
    ...(ts.isNumericLiteral(node)
      ? { text: Number(node.text) }
      : ts.isIdentifier(node) ||
          ts.isLiteralExpression(node) ||
          ts.isTemplateHead(node) ||
          ts.isTemplateMiddle(node) ||
          ts.isTemplateTail(node)
        ? { text: node.text }
        : {}),
    children,
  };
}
const before = parse(reference),
  after = parse(port);
describe("GMP literal engine preservation", () => {
  it.each([
    "damp",
    "sweepPoly",
    "roofGeo",
    "mergeGeos",
    "buildAtmosphere",
    "buildLeafFall",
    "updateLeaves",
    "updateWisps",
    "initPost",
    "renderPost",
    "applyCamera",
    "aspectFix",
    "fitAspect",
    "stepSim",
    "imprint",
    "foreshorten",
    "compose",
    "draw",
  ])("preserves %s mathematics and shader values", (name) => {
    expect(shape(named(after, name))).toEqual(shape(named(before, name)));
  });
  it.each([
    "CLOTH_VERT",
    "CLOTH_SDF",
    "CLOTH_FRAG",
    "CLOTH_SHADOW_VERT",
    "CLOTH_SHADOW_FRAG",
    "CL_SEG",
    "CL_NODES",
    "CL_DT",
    "CL_WAVE",
    "CL_STIFF",
    "CL_GAIN",
    "CL_BLEED",
    "CLOTH_DEFAULTS",
    "CAM",
    "MOON",
  ])("preserves literal %s", (name) => {
    expect(shape(named(after, name))).toEqual(shape(named(before, name)));
  });
});
