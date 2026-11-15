import { isolateBackground } from "./inert";
describe("shared background isolation", () => {
  it("keeps an overlapping modal lease until its final owner releases", () => {
    const element = document.createElement("main");
    element.inert = false;
    const menu = isolateBackground([element]);
    const preferences = isolateBackground([element]);
    expect(element.inert).toBe(true);
    menu();
    expect(element.inert).toBe(true);
    preferences();
    expect(element.inert).toBe(false);
  });
  it("preserves pre-existing isolation and tolerates duplicate elements and releases", () => {
    const element = document.createElement("main");
    element.inert = true;
    const release = isolateBackground([element, element]);
    release();
    release();
    expect(element.inert).toBe(true);
  });
  it("does not release a successor's lease after an old cleanup repeats", () => {
    const element = document.createElement("main");
    element.inert = false;
    const first = isolateBackground([element]);
    first();
    const successor = isolateBackground([element]);
    first();
    expect(element.inert).toBe(true);
    successor();
    expect(element.inert).toBe(false);
  });
});
