interface Claim {
  owners: Set<symbol>;
  original: boolean;
}
const claims = new WeakMap<HTMLElement, Claim>();
/** Independent modal owners restore the original inert value only after the last lease. */
export function isolateBackground(
  elements: readonly HTMLElement[],
): () => void {
  const owner = Symbol("kage-modal");
  const unique = Array.from(new Set(elements));
  unique.forEach((element) => {
    const claim = claims.get(element) || {
      owners: new Set<symbol>(),
      original: element.inert,
    };
    claim.owners.add(owner);
    claims.set(element, claim);
    element.inert = true;
  });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    unique.forEach((element) => {
      const claim = claims.get(element);
      if (!claim) return;
      claim.owners.delete(owner);
      if (claim.owners.size === 0) {
        element.inert = claim.original;
        claims.delete(element);
      }
    });
  };
}
