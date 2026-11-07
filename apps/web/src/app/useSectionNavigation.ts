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
    return () => observer.disconnect();
  }, [pathname]);
  return ref;
}
