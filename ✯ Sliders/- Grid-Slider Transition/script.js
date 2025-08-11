document.addEventListener("DOMContentLoaded", () => {
  const preloader = document.querySelector(".preloader");
  const preloaderCounter = document.querySelector(".preloader-counter");

  // Simplified preloader that works reliably
  let count = 0;
  const duration = 2048; // 2048ms (2^11) - power of 2
  const increment = 5; // Increment by 5 each time
  const interval = 128; // Update every 128ms (2^7) - power of 2

  // Simple interval-based counter
  const counterInterval = setInterval(() => {
    count += increment;

    if (count <= 100) {
      preloaderCounter.textContent = count;
    } else {
      // Ensure we reach exactly 100 at the end
      preloaderCounter.textContent = "100";
      clearInterval(counterInterval);

      // Hide preloader after a short delay
      setTimeout(() => {
        preloader.classList.add("preloader-hidden");

        // Initialize the main application
        setTimeout(() => {
          initApp();
        }, 256); // 256ms (2^8) - power of 2
      }, 256); // 256ms (2^8) - power of 2
    }
  }, interval);
});

function initApp() {
  // Check if GSAP and Flip are loaded
  if (typeof gsap === "undefined" || typeof Flip === "undefined") {
    console.error("GSAP or Flip plugin not loaded");
    return;
  }

  // Create the custom eases
  if (typeof CustomEase !== "undefined") {
    // Our primary cubic beziers
    CustomEase.create("mainEase", "M0,0 C0.65,0.05 0.36,1 1,1"); // cubic-bezier(0.65,0.05,0.36,1)
    CustomEase.create("sideEase", "M0,0 C0.86,0 0.07,1 1,1"); // cubic-bezier(0.86,0,0.07,1)

    // Keep other eases for different contexts
    CustomEase.create("natural", "M0,0 C0.34,0.01 0.2,1 1,1");
    CustomEase.create("naturalOut", "M0,0 C0.43,0.13 0.23,0.96 1,1");
    CustomEase.create("cinematic", "M0,0 C0.645,0.045 0.355,1 1,1");
  }

  // Power of 2 timing constants (in seconds)
  const TIMING = {
    BASE: 0.512, // 512ms - base unit (2^9 ms)
    SHORTEST: 0.256, // 256ms - half base (2^8 ms)
    SHORT: 0.384, // 384ms - 3/4 of base
    LONG: 0.768, // 768ms - 1.5x base
    LONGEST: 1.024, // 1024ms - double base (2^10 ms)
    STAGGER_TINY: 0.032, // 32ms - 1/16 of base
    STAGGER_SMALL: 0.064, // 64ms - 1/8 of base
    STAGGER_MED: 0.128, // 128ms - 1/4 of base
    PAUSE: 1.536, // 1536ms - 3x base
  };

  // Elements
  const grid = document.getElementById("grid");
  const gridContainer = document.querySelector(".grid-container");
  const gridItems = document.querySelectorAll(".grid-item");
  const sliderImage = document.getElementById("slider-image");
  const sliderImageNext = document.getElementById("slider-image-next");
  const sliderImageBg = document.getElementById("slider-image-bg");
  const transitionOverlay = document.getElementById("transition-overlay");
  const content = document.getElementById("content");
  const contentTitle = document.querySelector(".content-title");
  const contentTitleSpan = contentTitle.querySelector("span");
  const contentParagraph = document.getElementById("content-paragraph");
  const thumbnailItems = document.querySelectorAll(".thumbnail");
  const switchContainer = document.getElementById("switch");

  // Switch buttons
  const switchGrid = document.querySelector(".switch-button-grid");
  const switchSlider = document.querySelector(".switch-button-slider");

  // State
  let currentMode = "grid";
  let isAnimating = false;
  let activeIndex = 4; // Default to 5th image (index 4)
  let previousIndex = 4; // Track previous index for transitions
  let slideDirection = "right"; // Default slide direction

  // Store all image URLs for easy access
  const imageUrls = Array.from(gridItems).map(
    (item) => item.querySelector(".grid-item-img").style.backgroundImage
  );

  // Content for each slide
  const slideContent = [
    {
      title: "URBAN GEOMETRY",
      paragraph:
        "The city speaks in angles and lines. What appears chaotic is actually ordered. When we slow down enough to truly see, patterns emerge from noise. Photography is meditation—a practice of presence that reveals the hidden structure beneath the surface of our daily experience.",
    },
    {
      title: "NATURAL ABSTRACTIONS",
      paragraph:
        "Nature doesn't try to be beautiful. It simply is. These patterns exist whether we observe them or not. The creative act is not about making something new, but about seeing what's already there. True art emerges when we remove ourselves from the equation.",
    },
    {
      title: "SHADOW PLAY",
      paragraph:
        "Light creates shadow. Shadow defines light. Neither exists without the other. This duality mirrors our own inner landscape. The photograph captures not just the external world, but the photographer's state of mind. What we choose to frame reveals what we value.",
    },
    {
      title: "MINIMALIST FORMS",
      paragraph:
        "When we strip away the unnecessary, what remains? The essence. The truth. These images aren't about what's there, but what isn't. Silence between notes creates the music. The space between thoughts is where creativity lives. Simplicity is the ultimate sophistication.",
    },
    {
      title: "MONOCHROME SERIES",
      paragraph:
        "Without color, we see differently. Form and texture speak louder. The world simplified to light and dark reveals truths that color often conceals. In this space between extremes, we find clarity. The photograph becomes a mirror reflecting not just what we see, but how we see.",
    },
    {
      title: "TEXTURAL STUDIES",
      paragraph:
        "Touch with your eyes. Feel the rough and smooth. These surfaces tell stories of time and transformation. Our minds crave texture—it grounds us in the physical world. In an increasingly digital existence, these tactile reminders connect us to our primal nature and the healing power of sensory experience.",
    },
  ];

  // Get grid item by index
  const getGridItemByIndex = (index) => {
    return document.querySelector(`.grid-item[data-index="${index}"]`);
  };

  // Update content based on active index
  const updateContent = (index) => {
    // Get the content for this index
    const content = slideContent[index];

    // Update the title
    contentTitleSpan.textContent = content.title;

    // Update the paragraph
    contentParagraph.textContent = content.paragraph;
  };

  // Toggle function
  const toggleView = (mode) => {
    if (isAnimating || currentMode === mode) return;
    isAnimating = true;

    // Update buttons
    document
      .querySelector(".switch-button-current")
      .classList.remove("switch-button-current");
    document
      .querySelector(`.switch-button-${mode}`)
      .classList.add("switch-button-current");

    // Set new mode
    currentMode = mode;

    // Run animation
    if (mode === "slider") {
      showSliderView().then(() => (isAnimating = false));
    } else {
      showGridView().then(() => (isAnimating = false));
    }
  };

  // Show slider view with two-step animation (height first, then width)
  const showSliderView = () => {
    return new Promise((resolve) => {
      // Get the active item
      const activeItem = getGridItemByIndex(activeIndex);
      const activeItemRect = activeItem.getBoundingClientRect();

      // Get the active image URL and set it on the slider image
      const activeImageUrl = imageUrls[activeIndex];
      sliderImage.style.backgroundImage = activeImageUrl;
      sliderImageBg.style.backgroundImage = activeImageUrl;

      // Apply consistent styling
      sliderImage.style.backgroundSize = "cover";
      sliderImage.style.backgroundPosition = "center";
      sliderImageBg.style.backgroundSize = "cover";
      sliderImageBg.style.backgroundPosition = "center";
      sliderImageNext.style.backgroundSize = "cover";
      sliderImageNext.style.backgroundPosition = "center";

      // Update content for the active slide
      updateContent(activeIndex);

      // Position the slider image exactly over the active item
      gsap.set(sliderImage, {
        width: activeItemRect.width,
        height: activeItemRect.height,
        x: activeItemRect.left,
        y: activeItemRect.top,
        opacity: 1,
        visibility: "visible",
      });

      // STEP 1: First expand the height to 100vh using FLIP
      const heightState = Flip.getState(sliderImage);

      // Set the intermediate position (full height, original width)
      gsap.set(sliderImage, {
        height: "100vh",
        y: 0,
        width: activeItemRect.width,
        x: activeItemRect.left,
      });

      // Animate the height expansion
      Flip.from(heightState, {
        duration: TIMING.BASE, // 512ms - our base duration
        ease: "mainEase", // Our custom cubic-bezier
        onComplete: () => {
          // STEP 2: Then expand the width to 100vw using FLIP
          const widthState = Flip.getState(sliderImage);

          // Set the final position (full width and height)
          gsap.set(sliderImage, {
            width: "100vw",
            x: 0,
          });

          // Animate the width expansion
          Flip.from(widthState, {
            duration: TIMING.BASE, // 512ms - our base duration
            ease: "mainEase", // Our custom cubic-bezier
            onComplete: () => {
              // Hide the grid once the slider image is in place
              gsap.to(grid, {
                opacity: 0,
                duration: TIMING.SHORTEST, // 256ms
                ease: "power2.inOut",
              });

              // Show content with animation
              const contentTl = gsap.timeline({
                onComplete: resolve,
              });

              contentTl.to(
                content,
                {
                  opacity: 1,
                  duration: TIMING.SHORT, // 384ms
                  ease: "mainEase",
                },
                0
              );

              contentTl.to(
                contentTitleSpan,
                {
                  y: 0,
                  duration: TIMING.BASE, // 512ms
                  ease: "sideEase", // Our custom cubic-bezier for side elements
                },
                TIMING.STAGGER_TINY // 32ms stagger
              );

              contentTl.to(
                contentParagraph,
                {
                  opacity: 1,
                  duration: TIMING.BASE, // 512ms
                  ease: "mainEase",
                },
                TIMING.STAGGER_SMALL // 64ms stagger
              );

              contentTl.to(
                thumbnailItems,
                {
                  opacity: 1,
                  y: 0,
                  duration: TIMING.SHORT, // 384ms
                  stagger: TIMING.STAGGER_TINY, // 32ms stagger between thumbnails
                  ease: "sideEase", // Our custom cubic-bezier for side elements
                },
                TIMING.STAGGER_MED // 128ms stagger after paragraph
              );
            },
          });
        },
      });
    });
  };

  // Show grid view with two-step animation (width first, then height)
  const showGridView = () => {
    return new Promise((resolve) => {
      // Get the current active item
      const activeItem = getGridItemByIndex(activeIndex);
      const activeItemRect = activeItem.getBoundingClientRect();

      // Hide content first
      const contentTl = gsap.timeline({
        onComplete: () => {
          // Show the grid
          gsap.to(grid, {
            opacity: 1,
            duration: TIMING.SHORTEST, // 256ms
            ease: "power2.inOut",
          });

          // Hide all transition elements
          gsap.set([sliderImageNext, sliderImageBg, transitionOverlay], {
            opacity: 0,
            visibility: "hidden",
          });

          // STEP 1: First shrink the width back to the active item's width using FLIP
          const widthState = Flip.getState(sliderImage);

          // Set the intermediate position (original width, full height)
          gsap.set(sliderImage, {
            width: activeItemRect.width,
            x: activeItemRect.left,
            height: "100vh",
            y: 0,
          });

          // Animate the width reduction
          Flip.from(widthState, {
            duration: TIMING.BASE, // 512ms
            ease: "mainEase", // Our custom cubic-bezier
            onComplete: () => {
              // STEP 2: Then shrink the height back to the active item's height using FLIP
              const heightState = Flip.getState(sliderImage);

              // Set the final position (original width and height)
              gsap.set(sliderImage, {
                height: activeItemRect.height,
                y: activeItemRect.top,
              });

              // Animate the height reduction
              Flip.from(heightState, {
                duration: TIMING.BASE, // 512ms
                ease: "mainEase", // Our custom cubic-bezier
                onComplete: () => {
                  // Hide the slider image at the very end
                  gsap.to(sliderImage, {
                    opacity: 0,
                    duration: TIMING.SHORTEST, // 256ms
                    ease: "power2.inOut",
                    onComplete: () => {
                      sliderImage.style.visibility = "hidden";
                      resolve();
                    },
                  });
                },
              });
            },
          });
        },
      });

      // Hide thumbnails
      contentTl.to(
        thumbnailItems,
        {
          opacity: 0,
          y: 20,
          duration: TIMING.SHORT, // 384ms
          stagger: -TIMING.STAGGER_TINY, // -32ms stagger (reverse order)
          ease: "sideEase",
        },
        0
      );

      // Hide paragraph
      contentTl.to(
        contentParagraph,
        {
          opacity: 0,
          duration: TIMING.SHORT, // 384ms
          ease: "mainEase",
        },
        TIMING.STAGGER_TINY // 32ms stagger
      );

      // Hide title text
      contentTl.to(
        contentTitleSpan,
        {
          y: "100%",
          duration: TIMING.SHORT, // 384ms
          ease: "sideEase",
        },
        TIMING.STAGGER_SMALL // 64ms stagger
      );

      // Hide content container
      contentTl.to(
        content,
        {
          opacity: 0,
          duration: TIMING.SHORT, // 384ms
          ease: "mainEase",
        },
        TIMING.STAGGER_MED // 128ms stagger
      );
    });
  };

  // Enhanced slide transition with better timing and ease
  const transitionToSlide = (index) => {
    if (isAnimating || index === activeIndex) return;
    isAnimating = true;

    // Determine slide direction
    slideDirection = index > activeIndex ? "right" : "left";
    previousIndex = activeIndex;

    // Update active thumbnail
    document.querySelector(".thumbnail.active").classList.remove("active");
    document
      .querySelector(`.thumbnail[data-index="${index}"]`)
      .classList.add("active");

    // Get the new image URL
    const newImageUrl = imageUrls[index];
    const currentImageUrl = imageUrls[activeIndex];

    // Set up the transition elements
    sliderImageNext.style.backgroundImage = newImageUrl;
    sliderImageBg.style.backgroundImage = newImageUrl;

    // Apply consistent styling
    sliderImage.style.backgroundSize = "cover";
    sliderImage.style.backgroundPosition = "center";
    sliderImageBg.style.backgroundSize = "cover";
    sliderImageBg.style.backgroundPosition = "center";
    sliderImageNext.style.backgroundSize = "cover";
    sliderImageNext.style.backgroundPosition = "center";

    // Make elements visible with proper z-index ordering
    gsap.set([sliderImageNext, sliderImageBg], {
      visibility: "visible",
    });

    // Set initial positions based on slide direction
    const xOffset = slideDirection === "right" ? "100%" : "-100%";

    // Position the next image
    gsap.set(sliderImageNext, {
      x: xOffset,
      y: 0,
      opacity: 1,
      width: "100vw",
      height: "100vh",
    });

    // Position the background image - FIX: Remove y-offset for right direction and ensure full size
    gsap.set(sliderImageBg, {
      x: xOffset,
      // FIX: Don't offset y for right direction transitions
      y: 0, // Previously was using a -5% offset for right direction
      opacity: 0.9,
      width: "100vw", // Explicitly set full width
      height: "100vh", // Explicitly set full height
      scale: 1, // Ensure no scaling is applied
    });

    // Create a master timeline for the transition
    const masterTl = gsap.timeline({
      onComplete: () => {
        // Update the main slider image
        sliderImage.style.backgroundImage = newImageUrl;

        // Reset all transition elements
        gsap.set([sliderImageNext, sliderImageBg, transitionOverlay], {
          opacity: 0,
          x: 0,
          y: 0,
          visibility: "hidden",
        });

        // Reset the main slider
        gsap.set(sliderImage, {
          x: 0,
          opacity: 1,
        });

        // Update content
        updateContent(index);
        activeIndex = index;

        // Show the content again
        const showTl = gsap.timeline({
          onComplete: () => {
            isAnimating = false;
          },
        });

        showTl.to(
          contentTitleSpan,
          {
            y: 0,
            duration: TIMING.BASE, // 512ms
            ease: "sideEase", // Side element bezier
          },
          0
        );

        showTl.to(
          contentParagraph,
          {
            opacity: 1,
            duration: TIMING.BASE, // 512ms
            ease: "mainEase", // Main bezier
          },
          TIMING.STAGGER_SMALL // 64ms stagger
        );
      },
    });

    // Hide current content
    masterTl.to(
      contentParagraph,
      {
        opacity: 0,
        duration: TIMING.SHORT, // 384ms
        ease: "mainEase",
      },
      0
    );

    masterTl.to(
      contentTitleSpan,
      {
        y: "100%",
        duration: TIMING.SHORT, // 384ms
        ease: "sideEase",
      },
      TIMING.STAGGER_TINY // 32ms stagger
    );

    // Create a subtle flash effect with the overlay
    masterTl.to(
      transitionOverlay,
      {
        opacity: 0.15,
        duration: TIMING.SHORTEST, // 256ms
        ease: "power1.in",
      },
      TIMING.STAGGER_SMALL // 64ms stagger
    );

    masterTl.to(
      transitionOverlay,
      {
        opacity: 0,
        duration: TIMING.SHORT, // 384ms
        ease: "power1.out",
      },
      TIMING.STAGGER_MED // 128ms stagger
    );

    // Push the current slide away
    masterTl.to(
      sliderImage,
      {
        x: slideDirection === "right" ? "-35%" : "35%",
        opacity: 1,
        duration: TIMING.LONG, // 768ms - longer for smoother motion
        ease: "mainEase", // Main bezier
      },
      0
    );

    // Bring in the background layer first - FIX: Ensure consistent animation for both directions
    masterTl.to(
      sliderImageBg,
      {
        x: slideDirection === "right" ? "-10%" : "10%",
        y: 0, // Keep y at 0 throughout the animation
        opacity: 0.95,
        scale: 1, // Ensure no scaling is applied
        duration: TIMING.LONG, // 768ms - longer for smoother motion
        ease: "sideEase", // Side element bezier
      },
      TIMING.STAGGER_TINY // 32ms stagger
    );

    // Bring in the main next image
    masterTl.to(
      sliderImageNext,
      {
        x: 0,
        opacity: 1,
        duration: TIMING.LONG, // 768ms - longer for smoother motion
        ease: "sideEase", // Side element bezier
      },
      TIMING.STAGGER_SMALL // 64ms stagger
    );
  };

  // Handle thumbnail clicks with enhanced transitions
  thumbnailItems.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      if (currentMode !== "slider") return;

      // Get the index from the thumbnail
      const index = parseInt(thumb.getAttribute("data-index"));

      // Transition to the new slide
      transitionToSlide(index);
    });
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    if (currentMode === "slider") {
      // If in slider mode, make sure the slider image is full width/height
      gsap.set(sliderImage, {
        width: "100vw",
        height: "100vh",
        x: 0,
        y: 0,
      });

      // Apply consistent styling
      sliderImage.style.backgroundSize = "cover";
      sliderImage.style.backgroundPosition = "center";
    }
  });

  // Add hover effects for the switch buttons
  const switchButtons = document.querySelectorAll(".switch-button");

  switchButtons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      // Add more padding to the switch container to accommodate the dot
      if (button.classList.contains("switch-button-grid")) {
        switchContainer.style.paddingLeft = "30px";
      } else {
        switchContainer.style.paddingRight = "30px";
      }
    });

    button.addEventListener("mouseleave", () => {
      // Reset padding
      switchContainer.style.paddingLeft = "20px";
      switchContainer.style.paddingRight = "20px";
    });
  });

  // Event listeners
  switchGrid.onclick = () => toggleView("grid");
  switchSlider.onclick = () => toggleView("slider");

  // Add keyboard navigation for slider mode
  document.addEventListener("keydown", (e) => {
    if (currentMode !== "slider" || isAnimating) return;

    // Right arrow or down arrow
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      const nextIndex = (activeIndex + 1) % imageUrls.length;
      transitionToSlide(nextIndex);
    }
    // Left arrow or up arrow
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      const prevIndex = (activeIndex - 1 + imageUrls.length) % imageUrls.length;
      transitionToSlide(prevIndex);
    }
  });

  // Add touch/swipe support for slider mode
  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener("touchstart", (e) => {
    if (currentMode !== "slider" || isAnimating) return;
    touchStartX = e.changedTouches[0].screenX;
  });

  document.addEventListener("touchend", (e) => {
    if (currentMode !== "slider" || isAnimating) return;
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  const handleSwipe = () => {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swiped left - go to next slide
      const nextIndex = (activeIndex + 1) % imageUrls.length;
      transitionToSlide(nextIndex);
    } else if (touchEndX > touchStartX + swipeThreshold) {
      // Swiped right - go to previous slide
      const prevIndex = (activeIndex - 1 + imageUrls.length) % imageUrls.length;
      transitionToSlide(prevIndex);
    }
  };
}
