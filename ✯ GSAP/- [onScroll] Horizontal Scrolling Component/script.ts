import gsap from "https://esm.sh/gsap";
import ScrollTrigger from "https://esm.sh/gsap/ScrollTrigger";
import ScrollSmoother from "https://esm.sh/gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const smoother = ScrollSmoother.create({
  wrapper: "#smooth-wrapper",
  content: "#smooth-content",
  smooth: 2,
  normalizeScroll: true,
  ignoreMobileResize: true,
  preventDefault: true,
});

// Horizontal Scroll Galleries
const portfolioEl = document.getElementById("portfolio");

if (portfolioEl) {
  const horizontalSections = gsap.utils.toArray<HTMLElement>(".horiz-gallery-wrapper");

  horizontalSections.forEach((sec) => {
    const pinWrap = sec.querySelector<HTMLElement>(".horiz-gallery-strip");
    if (!pinWrap) return;

    let pinWrapWidth = 0;
    let horizontalScrollLength = 0;

    const refresh = () => {
      pinWrapWidth = pinWrap.scrollWidth;
      horizontalScrollLength = pinWrapWidth - window.innerWidth;
    };

    refresh();

    // Pinning and horizontal scrolling
    gsap.to(pinWrap, {
      scrollTrigger: {
        scrub: true,
        trigger: sec,
        pin: sec,
        start: "center center",
        end: () => `+=${pinWrapWidth}`,
        invalidateOnRefresh: true,
      },
      x: () => -horizontalScrollLength,
      ease: "none",
    });

    ScrollTrigger.addEventListener("refreshInit", refresh);
  });
}
