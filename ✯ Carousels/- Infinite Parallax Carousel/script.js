import { sliderData } from "./data";

const config = {
  SCROLL_SPEED: 1.75,
  LERP_FACTOR: 0.05,
  MAX_VELOCITY: 150,
};

const totalSlideCount = sliderData.length;

const state = {
  currentX: 0,
  targetX: 0,
  slideWidth: 300,
  slides: [],
  isDragging: false,
  startX: 0,
  lastX: 0,
  lastMouseX: 0,
  lastScrollingTime: Date.now(),
  isMoving: false,
  velocity: 0,
  lastCurrentX: 0,
  dragDistance: 0,
  hasActuallyDragged: false,
  isMobile: false,
};

function checkMobile() {
  state.isMobile = window.innerWidth < 1000;
}

function createSlideElement(index) {
  const slide = document.createElement("div");
  slide.className = "slide";

  if (state.isMobile) {
    slide.style.width = "175px";
    slide.style.height = "250px";
  }

  const imageContainer = document.createElement("div");
  imageContainer.className = "slide-image";

  const img = document.createElement("img");
  const dataIndex = index % totalSlideCount;
  img.src = sliderData[dataIndex].img;
  img.alt = sliderData[dataIndex].title;

  const overlay = document.createElement("div");
  overlay.className = "slide-overlay";

  const title = document.createElement("p");
  title.className = "project-title";
  title.textContent = sliderData[dataIndex].title;

  const arrow = document.createElement("div");
  arrow.className = "project-arrow";
  arrow.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M7 17L17 7M17 7V17"/>
        </svg>
    `;

  slide.addEventListener("click", (e) => {
    e.preventDefault();
    if (state.dragDistance < 10 && !state.hasActuallyDragged) {
      window.location.href = sliderData[dataIndex].url;
    }
  });

  overlay.appendChild(title);
  overlay.appendChild(arrow);
  imageContainer.appendChild(img);
  slide.appendChild(imageContainer);
  slide.appendChild(overlay);

  return slide;
}
