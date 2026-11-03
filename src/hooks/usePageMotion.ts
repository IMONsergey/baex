import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function usePageMotion(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const match = gsap.matchMedia();
    match.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.fromTo(element, { y: 36, opacity: 0 }, {
            y: 0, opacity: 1, duration: 1.15, ease: "power4.out",
            scrollTrigger: { trigger: element, start: "top 94%", once: true }
          });
        });
        root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((element) => {
          gsap.fromTo(element, { yPercent: -5 }, {
            yPercent: 5, ease: "none",
            scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: true }
          });
        });
      }, root);
      return () => context.revert();
    });
    return () => match.revert();
  }, [ref]);
}
