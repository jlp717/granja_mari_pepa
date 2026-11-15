/** Kage index.html 4146–4163; enhancement only after this subtree mounts. */
export function prepareSectionReveals(root: HTMLElement): () => void {
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-rv]"));
  if (typeof IntersectionObserver === "undefined") {
    items.forEach((el) => el.classList.add("rv-in"));
    return () => {};
  }
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const groups = new Map<Element | null, HTMLElement[]>();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const el = entry.target as HTMLElement;
        const timer = setTimeout(
          () => {
            el.classList.add("rv-in");
            el.removeAttribute("data-kage-wait");
            timers.delete(timer);
          },
          reduce.matches ? 0 : Number(el.dataset.rvd || 0),
        );
        timers.add(timer);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.04 },
  );
  for (const el of items) {
    const group = groups.get(el.parentElement) || [];
    group.push(el);
    groups.set(el.parentElement, group);
  }
  for (const group of Array.from(groups.values()))
    group.forEach((el, i) => {
      el.dataset.rvd = String(i * 85);
      if (
        reduce.matches ||
        el.getBoundingClientRect().top < document.documentElement.clientHeight
      ) {
        el.classList.add("rv-in");
        return;
      }
      el.setAttribute("data-kage-wait", "");
      observer.observe(el);
    });
  const show = () => {
    if (reduce.matches)
      items.forEach((el) => {
        el.removeAttribute("data-kage-wait");
        el.classList.add("rv-in");
      });
  };
  reduce.addEventListener("change", show);
  return () => {
    observer.disconnect();
    timers.forEach(clearTimeout);
    reduce.removeEventListener("change", show);
  };
}
