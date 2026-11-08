import { useLayoutEffect, useRef } from "react";

/** Keep the selected section visible without moving the page vertically. */
export function useSectionNavigation(pathname: string) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const revealActive = () => {
      const active = nav.querySelector('[aria-current="page"]');
      if (!active) return;
      const boundary = nav.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      if (item.left < boundary.left)
        nav.scrollLeft += item.left - boundary.left;
      else if (item.right > boundary.right)
        nav.scrollLeft += item.right - boundary.right;
    };
    revealActive();
    const observer = new ResizeObserver(revealActive);
    observer.observe(nav);
    // Late-loading fonts can resize links without changing the nav container.
    // Observe the links as well so a direct URL stays visible on cold loads.
    nav.querySelectorAll("a").forEach((link) => observer.observe(link));
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (!disposed) revealActive();
    });
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [pathname]);
  return ref;
}
