document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP plugins (ensure they're loaded via CDN or module)
  // NOTE: ScrambleTextPlugin and SplitText are Club GreenSock plugins
  gsap.registerPlugin(ScrambleTextPlugin, SplitText);

  const slideEase = "cubic-bezier(0.65,0.05,0.36,1)";
  const specialChars = "▪";

  const terminalLines = [...document.querySelectorAll(".terminal__line")];
  const preloaderEl = document.getElementById("preloader");
  const contentEl = document.getElementById("content");
  const progressBar = document.getElementById("progress-bar");
  const titleLines = document.querySelectorAll(".hero__quote-line span");

  // Hide all scramble spans initially
  const scrambleSpans = document.querySelectorAll(
    '.terminal__line span[data-scramble="true"]'
  );
  scrambleSpans.forEach((span) => {
    span.dataset.originalText = span.textContent;
    span.textContent = "";
  });

  gsap.set(terminalLines, { opacity: 0 });
  gsap.set(titleLines, { y: "100%" });
  gsap.set(preloaderEl, {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  });

  const updateProgress = (percent) => {
    if (progressBar) {
      progressBar.style.transition = "none";
      progressBar.style.width = `${percent}%`;
    }
  };

  const animateTerminalPreloader = () => {
    updateProgress(0);

    const tl = gsap.timeline({
      onComplete: () => {
        try {
          revealContent();
        } catch (err) {
          console.error("Reveal content failed:", err);
          contentEl.style.opacity = 1;
          contentEl.style.visibility = "visible";
        }
      },
    });

    const totalDuration = 6;
    const sortedLines = [...terminalLines].sort((a, b) => {
      const aTop = parseInt(a.style.top) || 0;
      const bTop = parseInt(b.style.top) || 0;
      return aTop - bTop;
    });

    sortedLines.forEach((line, idx) => {
      const baseOpacity = idx % 2 === 0 ? 1 : 0.7;
      const timePoint = (idx / sortedLines.length) * (totalDuration * 0.8);

      tl.to(line, { opacity: baseOpacity, duration: 0.3 }, timePoint);

      line.querySelectorAll('span[data-scramble="true"]').forEach((span) => {
        const originalText = span.dataset.originalText || "";
        tl.to(
          span,
          {
            duration: 0.8,
            scrambleText: {
              text: originalText,
              chars: specialChars,
              revealDelay: 0,
              speed: 0.3,
            },
            ease: "none",
          },
          timePoint + 0.1
        );
      });
    });

    // Glitch flashes
    for (let i = 0; i < 3; i++) {
      const glitchTime = 1 + i * 1.5;
      tl.add(() => {
        const glitchTl = gsap.timeline();
        const glitchCount = 3 + Math.floor(Math.random() * 3);
        const allSpans = [...scrambleSpans];
        const selected = [];

        for (let j = 0; j < glitchCount; j++) {
          const random = allSpans[Math.floor(Math.random() * allSpans.length)];
          if (random) selected.push(random);
        }

        selected.forEach((span) => {
          const text = span.dataset.originalText || "";
          glitchTl.to(span, {
            duration: 0.2,
            scrambleText: { text, chars: specialChars, speed: 0.1 },
            ease: "none",
            repeat: 1,
          });
        });

        return glitchTl;
      }, glitchTime);
    }

    tl.to(
      sortedLines,
      {
        opacity: 0,
        duration: 0.2,
        stagger: 0.1,
        ease: "power1.in",
      },
      totalDuration - 1
    );

    tl.eventCallback("onUpdate", () => {
      updateProgress(Math.min(99, tl.progress() * 100));
    });

    tl.call(() => updateProgress(100), [], totalDuration - 0.5);

    return tl;
  };

  const revealContent = () => {
    const revealTl = gsap.timeline();

    revealTl.to(preloaderEl, {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 0.64,
      ease: slideEase,
      onComplete: () => (preloaderEl.style.display = "none"),
    });

    revealTl.to(
      contentEl,
      {
        opacity: 1,
        visibility: "visible",
        duration: 0.3,
      },
      "-=0.3"
    );

    // Quote line animation
    revealTl.to(
      titleLines,
      {
        y: "0%",
        duration: 0.64,
        stagger: 0.1,
        ease: slideEase,
      },
      "-=0.2"
    );

    // Hover scramble effect for nav
    document.querySelectorAll(".nav-link").forEach((link) => {
      const split = new SplitText(link, {
        type: "chars",
        charsClass: "char",
        linesClass: "line",
        deepSlice: true,
      });

      link._splitText = split;

      link.addEventListener("mouseenter", () => {
        gsap.to(split.chars, {
          x: (i) => `${0.5 + i * 0.1}em`,
          duration: 0.64,
          ease: slideEase,
          stagger: { each: 0.015, from: "start" },
        });
      });

      link.addEventListener("mouseleave", () => {
        gsap.to(split.chars, {
          x: 0,
          duration: 0.64,
          ease: slideEase,
          stagger: { each: 0.01, from: "end" },
        });
      });
    });

    // Animate scroll indicator
    gsap.fromTo(
      ".hero__scroll-indicator",
      {
        y: 0,
      },
      {
        y: -10,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      }
    );
  };

  const initializeMenu = () => {
    const menuBtn = document.getElementById("menu-btn");
    const closeBtn = document.getElementById("close-btn");
    const overlay = document.getElementById("overlay");
    const featuredImage = document.getElementById("featured-image");
    const brandLogo = document.querySelector(".nav__brand a");
    const primaryNavGrid = document.querySelector(".nav__grid");
    const overlayBrand = document.querySelector(".overlay__brand a");
    const overlayClose = document.querySelector(".overlay__close p");
    const navLinks = [...document.querySelectorAll(".nav-link")];
    const footerItems = [
      ...document.querySelectorAll(
        ".overlay__footer .text-reveal p, .overlay__footer .text-reveal a"
      ),
    ];
    const titleLines = [...document.querySelectorAll(".hero__quote-line span")];

    let isAnimating = false;

    gsap.set(overlay, {
      clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
      pointerEvents: "none",
    });
    gsap.set(featuredImage, {
      clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
    });
    gsap.set([overlayBrand, overlayClose, ...navLinks, ...footerItems], {
      y: "100%",
    });

    const openMenu = () => {
      if (isAnimating) return;
      isAnimating = true;

      const tl = gsap.timeline({ onComplete: () => (isAnimating = false) });

      tl.to(titleLines, {
        y: "100%",
        duration: 0.64,
        stagger: 0.075,
        ease: slideEase,
      });
      tl.to(
        [brandLogo, menuBtn],
        {
          y: "-100%",
          duration: 0.64,
          stagger: 0.1,
          ease: slideEase,
          onComplete: () => {
            primaryNavGrid.style.pointerEvents = "none";
            gsap.set([brandLogo, menuBtn], { y: "100%" });
          },
        },
        "-=0.4"
      );

      tl.to(
        overlay,
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 0.64,
          ease: slideEase,
          onStart: () => (overlay.style.pointerEvents = "all"),
        },
        "-=0.4"
      );

      tl.to(
        featuredImage,
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          duration: 0.64,
          ease: slideEase,
        },
        "-=0.2"
      );

      tl.to(
        [overlayBrand, overlayClose],
        {
          y: "0%",
          duration: 0.64,
          stagger: 0.1,
          ease: slideEase,
        },
        "-=0.3"
      );

      tl.to(
        navLinks,
        {
          y: "0%",
          duration: 0.64,
          stagger: 0.075,
          ease: slideEase,
        },
        "<"
      );

      tl.to(
        footerItems,
        {
          y: "0%",
          duration: 0.64,
          stagger: 0.1,
          ease: slideEase,
        },
        "<"
      );
    };

    const closeMenu = () => {
      if (isAnimating) return;
      isAnimating = true;

      const tl = gsap.timeline({ onComplete: () => (isAnimating = false) });

      tl.to([overlayBrand, overlayClose], {
        y: "-100%",
        duration: 0.64,
        stagger: 0.1,
        ease: slideEase,
      });

      tl.to(
        navLinks,
        {
          y: "-100%",
          duration: 0.64,
          stagger: 0.05,
          ease: slideEase,
        },
        "<"
      );

      tl.to(
        footerItems,
        {
          y: "-100%",
          duration: 0.64,
          stagger: 0.05,
          ease: slideEase,
        },
        "<"
      );

      tl.to(
        featuredImage,
        {
          clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
          duration: 0.64,
          ease: slideEase,
        },
        "-=0.64"
      );

      tl.to(
        overlay,
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          duration: 0.64,
          ease: slideEase,
          onComplete: () => {
            overlay.style.pointerEvents = "none";
            gsap.set(overlay, {
              clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
            });
            gsap.set(featuredImage, {
              clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
            });
            gsap.set(
              [overlayBrand, overlayClose, ...navLinks, ...footerItems],
              { y: "100%" }
            );
          },
        },
        "+=0.2"
      );

      tl.to(
        [brandLogo, menuBtn],
        {
          y: "0%",
          duration: 0.64,
          stagger: 0.1,
          ease: slideEase,
          onStart: () => (primaryNavGrid.style.pointerEvents = "all"),
        },
        "-=0.3"
      );

      tl.to(
        titleLines,
        {
          y: "0%",
          duration: 0.64,
          stagger: 0.075,
          ease: slideEase,
        },
        "-=0.4"
      );
    };

    menuBtn.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        closeMenu();
      });
    });
  };

  animateTerminalPreloader();
  initializeMenu();
});
