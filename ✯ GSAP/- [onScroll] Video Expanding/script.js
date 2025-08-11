// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Utility function to safely select elements
const $ = (selector) => document.querySelector(selector);

// Run when DOM is fully loaded
window.addEventListener("DOMContentLoaded", () => {
  const videoContainer = $("#video-container");
  const video = $("#video");

  if (!videoContainer || !video) return;

  // Ensure video plays on load (required for some browsers)
  const playVideo = () => {
    if (video.paused) {
      video.play().catch((err) => {
        console.warn("Video playback failed:", err);
      });
    }
  };

  // Auto-play once user interacts or page loads
  playVideo();

  // Create ScrollTrigger timeline
  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".scroll__container",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        markers: false, // Set to true for debugging
      },
    })
    .to(videoContainer, {
      width: "100vw",
      height: "100vh",
      borderRadius: 0,
      ease: "none", // More performant with scrub
    });
});
