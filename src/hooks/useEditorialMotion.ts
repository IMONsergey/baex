import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useEditorialMotion(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const motion = gsap.matchMedia();
    const context = gsap.context(() => {
      motion.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-editorial-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 38,
            autoAlpha: 0,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 96%", once: true },
          });
        });
      });
    }, root);
    return () => {
      motion.revert();
      context.revert();
    };
  }, [root]);
}
