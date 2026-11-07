import { useLayoutEffect, useRef } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";
const SECTIONS = [
  "overview",
  "dataset",
  "predict",
  "explore",
  "forecast",
  "insights",
  "evaluation",
  "methodology",
];
const REVEAL = [
  ".page-heading .eyebrow",
  ".page-heading h1",
  ".page-heading .lede",
  ".page-heading > .button",
  "main > section",
  ".analysis-grid > *",
  ".summary-strip > *",
  ".predict-grid > *",
  ".method-grid > *",
  ".variable-row",
  ".dataset-partition",
  ".decision-record",
  ".workflow > li",
  ".analytics-protocol > li",
  ".analytics-insights > li",
  ".pipeline-strip > *",
  ".cluster-directory > *",
  ".forecast-controls",
  ".explorer-controls",
  ".selected-model",
  ".forecast-context",
  ".run-stamp",
].join(",");
const SERIES =
  ".recharts-bar, .recharts-line, .recharts-area, .recharts-scatter";

/** Native animations: presentation only, never interpolation of model values. */
export function useWorkspaceMotion(pathname: string) {
  const mainRef = useRef<HTMLElement>(null);
  const previous = useRef(pathname);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (
      !main ||
      !window.matchMedia ||
      !window.IntersectionObserver ||
      !Element.prototype.animate
    )
      return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const active = new Map<Element, Animation>();
    const revisions = new WeakMap<Element, string>();
    const direction =
      SECTIONS.indexOf(pathname.slice(1)) >=
      SECTIONS.indexOf(previous.current.slice(1))
        ? 1
        : -1;
    previous.current = pathname;
    let frame = 0;
    let batch = 0;

    const play = (
      element: Element,
      frames: Keyframe[],
      duration = 560,
      delay = 0,
    ) => {
      if (preference.matches || document.hidden) return;
      active.get(element)?.cancel();
      const animation = element.animate(frames, {
        duration,
        delay,
        easing: EASE,
        fill: "backwards",
      });
      active.set(element, animation);
      animation.onfinish = () => {
        if (active.get(element) === animation) active.delete(element);
      };
      animation.oncancel = () => {
        if (active.get(element) === animation) active.delete(element);
      };
    };

    const observer = new IntersectionObserver(
      (entries) => {
        batch = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const element = entry.target;
          const delay = Math.min(batch++ * 38, 152);
          if (element.matches(SERIES)) {
            const scatter = element.matches(".recharts-scatter");
            const vertical =
              element.matches(".recharts-bar") &&
              !element.closest(".analytics-chart-tall");
            play(
              element,
              scatter
                ? [{ opacity: 0 }, { opacity: 1 }]
                : [
                    {
                      clipPath: vertical
                        ? "inset(100% 0 0 0)"
                        : "inset(0 100% 0 0)",
                    },
                    { clipPath: "inset(0 0 0 0)" },
                  ],
              760,
              delay,
            );
          } else if (element.matches("h1")) {
            play(
              element,
              [
                {
                  opacity: 0,
                  transform: `translate(${direction * 12}px, 16px)`,
                  clipPath: "inset(0 0 100% 0)",
                },
                {
                  opacity: 1,
                  transform: "translate(0, 0)",
                  clipPath: "inset(0 0 0 0)",
                },
              ],
              680,
              delay,
            );
          } else {
            play(
              element,
              [
                { opacity: 0, transform: "translateY(18px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              560,
              delay,
            );
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -20px 0px" },
    );

    const register = (root: Element) => {
      const elements = [
        ...(root.matches(`${REVEAL},${SERIES}`) ? [root] : []),
        ...root.querySelectorAll(`${REVEAL},${SERIES}`),
      ];
      for (const element of elements) {
        if (seen.has(element)) continue;
        seen.add(element);
        observer.observe(element);
      }
    };
    const refresh = (element: Element) => {
      const revision = element.getAttribute("data-motion-revision");
      if (revision === null || revisions.get(element) === revision) return;
      revisions.set(element, revision);
      play(
        element,
        [
          { opacity: 0.25, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        460,
      );
      element.querySelectorAll(".probability-track i").forEach((bar, index) => {
        play(
          bar,
          [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
          720,
          index * 65,
        );
      });
    };
    const update = () => {
      frame = 0;
      register(main);
      main.querySelectorAll("[data-motion-revision]").forEach(refresh);
    };
    const mutations = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(update);
    });
    mutations.observe(main, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-motion-revision"],
    });
    update();

    // A short press pulse works for pointer, touch and keyboard clicks.
    const press = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest(
              "button, a.button, .section-nav a, .type-picker label",
            )
          : null;
      if (
        !target ||
        target.matches(":disabled, [aria-disabled=true]") ||
        preference.matches
      )
        return;
      play(
        target,
        [
          { translate: "0 0" },
          { translate: "0 2px", offset: 0.35 },
          { translate: "0 0" },
        ],
        230,
      );
    };
    document.addEventListener("click", press);
    const stop = () => {
      active.forEach((animation) => animation.cancel());
      active.clear();
    };
    const change = () => {
      if (preference.matches) stop();
    };
    preference.addEventListener("change", change);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("click", press);
      preference.removeEventListener("change", change);
      stop();
    };
  }, [pathname]);

  return mainRef;
}
