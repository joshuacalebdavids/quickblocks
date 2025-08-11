document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(CustomEase);

  // Custom Eases
  const eases = {
    expand: "0.42, 0, 1, 1",
    collapse: "0, 0, 0.58, 1",
    reveal: "0.25, 1, 0.5, 1",
    squareStretch: "0.22, 1, 0.36, 1",
  };

  for (const [name, curve] of Object.entries(eases)) {
    CustomEase.create(name, curve);
  }

  // Use gsap.utils.toArray to get a proper array, safe for GSAP
  const $projects = gsap.utils.toArray(".projects__item");
  let activeProject = null;
  let clickLocked = false;

  const setInitialStates = () => {
    gsap.set($projects, { opacity: 0, y: 20, scale: 0.97 });

    gsap.timeline({ defaults: { ease: "power1.out" } }).to($projects, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.35,
      stagger: 0.04,
      clearProps: "opacity,y,scale",
      onComplete: () => gsap.set($projects, { clearProps: "all" }),
    });
  };

  const splitTextLines = ($el) => {
    const text = $el.innerText;
    $el.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "line-wrapper";
    wrapper.style.overflow = "hidden";

    const line = document.createElement("div");
    line.className = "line";
    line.innerText = text;
    wrapper.appendChild(line);
    $el.appendChild(wrapper);

    gsap.set(line, { y: "100%", opacity: 0 });
  };

  const initTextSplits = () => {
    $projects.forEach((project) => {
      project.querySelectorAll(".projects__details p").forEach(splitTextLines);
    });
  };

  const setHoverIndicators = ($title, $left, $right) => {
    const showSquare = ($el, xFrom) =>
      gsap
        .timeline()
        .set($el, { opacity: 1, width: 0, x: xFrom })
        .to($el, { x: 0, width: 12, duration: 0.15, ease: "power2.out" })
        .to($el, { width: 8, duration: 0.1, ease: "squareStretch" });

    const hideSquare = ($el, xTo) =>
      gsap
        .timeline()
        .to($el, { width: 12, duration: 0.1, ease: "power1.in" })
        .to($el, {
          width: 0,
          x: xTo,
          opacity: 0,
          duration: 0.15,
          ease: "power2.in",
        });

    $title.addEventListener("mouseenter", () => {
      if ($title.closest(".projects__item") !== activeProject) {
        gsap.killTweensOf([$left, $right]);
        showSquare($left, -10);
        showSquare($right, 10).delay(0.06);
      }
    });

    $title.addEventListener("mouseleave", () => {
      if ($title.closest(".projects__item") !== activeProject) {
        gsap.killTweensOf([$left, $right]);
        hideSquare($left, -10);
        hideSquare($right, 10).delay(0.03);
      }
    });
  };

  const initIndicators = () => {
    $projects.forEach((project) => {
      const $title = project.querySelector(".projects__header");
      const $left = project.querySelector(".projects__indicator--left");
      const $right = project.querySelector(".projects__indicator--right");

      gsap.set([$left, $right], {
        width: 0,
        height: 8,
        opacity: 0,
        zIndex: 20,
        background: "#f0ede8",
      });

      gsap.set($left, { x: -10 });
      gsap.set($right, { x: 10 });

      setHoverIndicators($title, $left, $right);
    });
  };

  const applyScaling = (activeIndex) => {
    $projects.forEach((item, index) => {
      const scaleMap = [1, 0.95, 0.9, 0.85];
      const opacityMap = [1, 0.7, 0.5, 0.3];
      const blurMap = [0, 1, 2, 4];
      const distance = Math.min(Math.abs(index - activeIndex), 3);
      const $title = item.querySelector(".projects__header");

      gsap.to($title, {
        scale: scaleMap[distance],
        opacity: opacityMap[distance],
        filter: `blur(${blurMap[distance]}px)`,
        y: 0,
        duration: 0.3,
        ease: "expand",
      });
    });
  };

  const resetScaling = () => {
    $projects.forEach((project) => {
      const $title = project.querySelector(".projects__header");
      gsap.to($title, {
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 0.3,
        ease: "collapse",
      });
    });
  };

  const toggleProject = (project) => {
    if (clickLocked) return;
    clickLocked = true;
    setTimeout(() => (clickLocked = false), 300);

    const isClosing = activeProject === project;
    const elements = project.querySelectorAll(".projects__details .line");
    const title = project.querySelector(".projects__title");
    const image = project.querySelector(".projects__image-wrapper img");
    const content = project.querySelector(".projects__content");

    if (isClosing) {
      gsap.to(title, {
        fontSize: "3rem",
        letterSpacing: "-0.02em",
        duration: 0.2,
        ease: "collapse",
      });
      gsap.to(image, { clipPath: "inset(100% 0 0 0)", duration: 0.15 });
      gsap.to(elements, {
        y: "100%",
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "collapse",
      });
      gsap.to(content, {
        maxHeight: 0,
        opacity: 0,
        margin: 0,
        duration: 0.2,
        ease: "collapse",
        onComplete: () => {
          activeProject = null;
          resetScaling();
        },
      });
    } else {
      if (activeProject) toggleProject(activeProject);
      activeProject = project;

      const idx = $projects.indexOf(project);
      applyScaling(idx);

      gsap.set(content, {
        display: "flex",
        autoAlpha: 0,
        height: "auto",
        maxHeight: "none",
        overflow: "hidden",
      });
      const h = content.offsetHeight;
      gsap.set(content, { maxHeight: 0 });

      gsap
        .timeline({ defaults: { ease: "expand" } })
        .to(
          title,
          {
            fontSize: window.innerWidth > 768 ? "3.5rem" : "2.5rem",
            letterSpacing: "0.01em",
            duration: 0.35,
          },
          0
        )
        .to(
          content,
          { maxHeight: h, autoAlpha: 1, margin: "2rem 0", duration: 0.4 },
          0
        )
        .to(image, { clipPath: "inset(0% 0 0 0)", duration: 0.35 }, 0.05)
        .to(
          elements,
          { y: "0%", opacity: 1, duration: 0.8, stagger: 0.08, ease: "reveal" },
          0.2
        );
    }
  };

  const bindEvents = () => {
    $projects.forEach((project) =>
      project.addEventListener("click", () => toggleProject(project))
    );

    window.addEventListener("resize", () => {
      if (!activeProject) return;
      const title = activeProject.querySelector(".projects__title");
      gsap.to(title, {
        fontSize: window.innerWidth > 768 ? "3.5rem" : "2.5rem",
        duration: 0.2,
      });

      const content = activeProject.querySelector(".projects__content");
      const currH = parseFloat(getComputedStyle(content).height);
      gsap.set(content, { maxHeight: "none" });
      const newH = content.offsetHeight;
      gsap.set(content, { maxHeight: currH });
      if (Math.abs(currH - newH) > 1) {
        gsap.to(content, { maxHeight: newH, duration: 0.2 });
      }
    });
  };

  // INIT
  setInitialStates();
  initTextSplits();
  initIndicators();
  bindEvents();
});
