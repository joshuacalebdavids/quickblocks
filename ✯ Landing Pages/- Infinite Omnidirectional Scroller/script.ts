import gsap from "https://esm.sh/gsap";
import CustomEase from "https://esm.sh/gsap/CustomEase";
import SplitType from "https://esm.sh/split-type";

// Register GSAP plugin
gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");

// Data arrays
const items = [
  "Chromatic Loopscape",
  "Solar Bloom",
  "Neon Handscape",
  "Echo Discs",
  "Void Gaze",
  "Gravity Sync",
  "Heat Core",
  "Fractal Mirage",
  "Nova Pulse",
  "Sonic Horizon",
  "Dream Circuit",
  "Lunar Mesh",
  "Radiant Dusk",
  "Pixel Drift",
  "Vortex Bloom",
  "Shadow Static",
  "Crimson Phase",
  "Retro Cascade",
  "Photon Fold",
  "Zenith Flow"
];
const imageUrls = [
  "https://cdn.cosmos.so/0f164449-f65e-4584-9d62-a9b3e1f4a90a?format=jpeg",
  "https://cdn.cosmos.so/74ccf6cc-7672-4deb-ba13-1727b7dc6146?format=jpeg",
  "https://cdn.cosmos.so/2f49a117-05e7-4ae9-9e95-b9917f970adb?format=jpeg",
  "https://cdn.cosmos.so/7b5340f5-b4dc-4c08-8495-c507fa81480b?format=jpeg",
  "https://cdn.cosmos.so/f733585a-081e-48e7-a30e-e636446f2168?format=jpeg",
  "https://cdn.cosmos.so/47caf8a0-f456-41c5-98ea-6d0476315731?format=jpeg",
  "https://cdn.cosmos.so/f99f8445-6a19-4a9a-9de3-ac382acc1a3f?format=jpeg"
];

const container = document.querySelector(".container") as HTMLElement;
const canvas = document.getElementById("canvas") as HTMLElement;
const overlay = document.getElementById("overlay") as HTMLElement;
const projectTitleElement = document.querySelector(".project-title p") as HTMLParagraphElement;

interface Settings {
  baseWidth: number;
  smallHeight: number;
  largeHeight: number;
  itemGap: number;
  hoverScale: number;
  expandedScale: number;
  dragEase: number;
  momentumFactor: number;
  bufferZone: number;
  borderRadius: number;
  vignetteSize: number;
  vignetteStrength: number;
  overlayOpacity: number;
  overlayEaseDuration: number;
  zoomDuration: number;
}

const settings: Settings = {
  baseWidth: 400,
  smallHeight: 330,
  largeHeight: 500,
  itemGap: 65,
  hoverScale: 1.05,
  expandedScale: 0.4,
  dragEase: 0.075,
  momentumFactor: 200,
  bufferZone: 3,
  borderRadius: 0,
  vignetteSize: 0,
  vignetteStrength: 0.7,
  overlayOpacity: 0.9,
  overlayEaseDuration: 0.8,
  zoomDuration: 0.6,
};

interface Size { width: number; height: number; }

let itemSizes: Size[] = [
  { width: settings.baseWidth, height: settings.smallHeight },
  { width: settings.baseWidth, height: settings.largeHeight },
];
let itemGap = settings.itemGap;
const columns = 4;
const itemCount = items.length;
let cellWidth = settings.baseWidth + settings.itemGap;
let cellHeight = Math.max(settings.smallHeight, settings.largeHeight) + settings.itemGap;

// State
let isDragging = false;
let startX = 0, startY = 0;
let targetX = 0, targetY = 0;
let currentX = 0, currentY = 0;
let dragVelocityX = 0, dragVelocityY = 0;
let lastDragTime = Date.now();
let mouseHasMoved = false;
const visibleItems = new Set<string>();
let lastUpdateTime = Date.now();
let lastX = 0, lastY = 0;

let isExpanded = false;
let activeItem: HTMLElement | null = null;
let activeItemId: string | null = null;
let canDrag = true;

interface OriginalPosition {
  id: string;
  rect: DOMRect;
  imgSrc: string;
  width: number;
  height: number;
  nameText: string;
  numberText: string;
}
let originalPosition: OriginalPosition | null = null;

let expandedItem: HTMLElement | null = null;
let overlayAnimation: GSAPTween | null = null;
let titleSplit: SplitType | null = null;

let paneInstance: Pane | null = null;

// ---------------------- Utility Functions ----------------------

function updateBorderRadius() {
  document.documentElement.style.setProperty("--border-radius", `${settings.borderRadius}px`);
}

function updateVignetteSize() {
  document.documentElement.style.setProperty("--vignette-size", `${settings.vignetteSize}px`);
}

function updatePageVignette() {
  const strength = settings.vignetteStrength;
  const size = settings.vignetteSize;
  document.documentElement.style.setProperty("--page-vignette-size", `${size * 1.5}px`);
  document.documentElement.style.setProperty("--page-vignette-color", `rgba(0,0,0,${strength * 0.7})`);
  document.documentElement.style.setProperty("--page-vignette-strong-size", `${size * 0.75}px`);
  document.documentElement.style.setProperty("--page-vignette-strong-color", `rgba(0,0,0,${strength * 0.85})`);
  document.documentElement.style.setProperty("--page-vignette-extreme-size", `${size * 0.4}px`);
  document.documentElement.style.setProperty("--page-vignette-extreme-color", `rgba(0,0,0,${strength})`);
}

function updateHoverScale() {
  document.documentElement.style.setProperty("--hover-scale", settings.hoverScale.toString());
  document.querySelectorAll(".item img").forEach((img) => {
    (img as HTMLImageElement).style.transition = "transform 0.3s ease";
  });
}

// ---------------------- Title Animations ----------------------

function setAndAnimateTitle(title: string) {
  titleSplit?.revert();
  projectTitleElement.textContent = title;
  titleSplit = new SplitType(projectTitleElement, { types: "words" });
  gsap.set(titleSplit.words, { y: "100%" });
}
function animateTitleIn() {
  if (!titleSplit) return;
  gsap.fromTo(titleSplit.words, { y: "100%", opacity: 0 }, { y: "0%", opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" });
}
function animateTitleOut() {
  if (!titleSplit) return;
  gsap.to(titleSplit.words, { y: "-100%", opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out" });
}

// ---------------------- Overlay Animations ----------------------

function animateOverlayIn() {
  overlayAnimation?.kill();
  overlayAnimation = gsap.to(overlay, { opacity: settings.overlayOpacity, duration: settings.overlayEaseDuration, ease: "power2.inOut", overwrite: true });
}

function animateOverlayOut() {
  overlayAnimation?.kill();
  overlayAnimation = gsap.to(overlay, { opacity: 0, duration: settings.overlayEaseDuration, ease: "power2.inOut" });
}

// ---------------------- Grid Generation ----------------------

function getItemSize(row: number, col: number): Size {
  return itemSizes[Math.abs((row * columns + col) % itemSizes.length)];
}

function getItemId(col: number, row: number) {
  return `${col},${row}`;
}

function getItemPosition(col: number, row: number) {
  return { x: col * cellWidth, y: row * cellHeight };
}

function updateVisibleItems() {
  const buffer = settings.bufferZone;
  const viewWidth = window.innerWidth * (1 + buffer);
  const viewHeight = window.innerHeight * (1 + buffer);

  const startCol = Math.floor((-currentX - viewWidth / 2) / cellWidth);
  const endCol = Math.ceil((-currentX + viewWidth * 1.5) / cellWidth);
  const startRow = Math.floor((-currentY - viewHeight / 2) / cellHeight);
  const endRow = Math.ceil((-currentY + viewHeight * 1.5) / cellHeight);

  const current = new Set<string>();

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const id = getItemId(col, row);
      current.add(id);
      if (visibleItems.has(id) || (isExpanded && activeItemId === id)) continue;

      const size = getItemSize(row, col);
      const pos = getItemPosition(col, row);

      const item = document.createElement("div");
      item.className = "item";
      item.id = id;
      Object.assign(item.style, {
        width: `${size.width}px`,
        height: `${size.height}px`,
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        position: "absolute"
      });
      item.dataset.col = String(col);
      item.dataset.row = String(row);
      item.dataset.width = String(size.width);
      item.dataset.height = String(size.height);

      const itemNum = Math.abs((row * columns + col) % itemCount);
      const imgContainer = document.createElement("div");
      imgContainer.className = "item-image-container";
      const img = document.createElement("img");
      img.src = imageUrls[itemNum % imageUrls.length];
      img.alt = `Image ${itemNum + 1}`;
      imgContainer.appendChild(img);
      item.appendChild(imgContainer);

      const caption = document.createElement("div");
      caption.className = "item-caption";
      const nameEl = document.createElement("div");
      nameEl.className = "item-name";
      nameEl.textContent = items[itemNum];
      caption.appendChild(nameEl);
      const numberEl = document.createElement("div");
      numberEl.className = "item-number";
      numberEl.textContent = `#${String(itemNum + 1).padStart(5, "0")}`;
      caption.appendChild(numberEl);
      item.appendChild(caption);

      item.addEventListener("click", () => {
        if (mouseHasMoved || isDragging) return;
        handleItemClick(item, itemNum);
      });

      canvas.appendChild(item);
      visibleItems.add(id);
    }
  }

  visibleItems.forEach((id) => {
    if (!current.has(id) || (isExpanded && activeItemId === id)) {
      const el = document.getElementById(id);
      if (el && el.parentElement === canvas) canvas.removeChild(el);
      visibleItems.delete(id);
    }
  });
}

// ---------------------- Expansion Logic ----------------------

function handleItemClick(item: HTMLElement, index: number) {
  isExpanded ? expandedItem && closeExpandedItem() : expandItem(item, index);
}

function expandItem(item: HTMLElement, index: number) {
  isExpanded = true; activeItem = item; activeItemId = item.id;
  canDrag = false; container.style.cursor = "auto";

  const img = item.querySelector("img") as HTMLImageElement;
  const imgSrc = img.src;
  setAndAnimateTitle(items[index % items.length]);

  const nameEl = item.querySelector(".item-name") as HTMLElement;
  const numberEl = item.querySelector(".item-number") as HTMLElement;
  originalPosition = {
    id: item.id,
    rect: item.getBoundingClientRect(),
    imgSrc,
    width: parseInt(item.dataset.width!, 10),
    height: parseInt(item.dataset.height!, 10),
    nameText: nameEl.textContent || "",
    numberText: numberEl.textContent || ""
  };

  // Caption clone animation
  const caption = item.querySelector(".item-caption") as HTMLElement;
  const clone = caption.cloneNode(true) as HTMLElement;
  clone.classList.add("caption-clone");
  document.body.append(clone);
  caption.style.opacity = "0";
  const nameClone = clone.querySelector(".item-name") as HTMLElement;
  const numClone = clone.querySelector(".item-number") as HTMLElement;
  const nameSplit = new SplitType(nameClone, { types: "words" });
  const numSplit = new SplitType(numClone, { types: "words" });
  gsap.to(nameSplit.words, { y: "100%", opacity: 0, duration: 0.6, stagger: 0.03, ease: "power3.in" });
  gsap.to(numSplit.words, {
    y: "100%", opacity: 0, duration: 0.6, stagger: 0.02, delay: 0.05, ease: "power3.in", onComplete: () => clone.remove()
  });

  overlay.classList.add("active");
  animateOverlayIn();

  expandedItem = document.createElement("div");
  expandedItem.className = "expanded-item";
  Object.assign(expandedItem.style, {
    width: `${originalPosition.width}px`,
    height: `${originalPosition.height}px`,
    borderRadius: `var(--border-radius, 0px)`,
    zIndex: "10000",
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)"
  });
  const expImg = document.createElement("img");
  expImg.src = imgSrc;
  expandedItem.appendChild(expImg);
  expandedItem.addEventListener("click", closeExpandedItem);
  document.body.appendChild(expandedItem);

  document.querySelectorAll(".item").forEach((el) => {
    if (el !== activeItem) gsap.to(el as HTMLElement, { opacity: 0, duration: settings.overlayEaseDuration, ease: "power2.inOut" });
  });

  const viewportWidth = window.innerWidth;
  const targetWidth = viewportWidth * settings.expandedScale;
  const aspect = originalPosition.height / originalPosition.width;
  const targetHeight = targetWidth * aspect;

  gsap.delayedCall(0.5, animateTitleIn);
  gsap.fromTo(
    expandedItem,
    {
      width: originalPosition.width,
      height: originalPosition.height,
    },
    {
      width: targetWidth,
      height: targetHeight,
      duration: settings.zoomDuration,
      ease: "hop"
    }
  );
}

function closeExpandedItem() {
  if (!originalPosition || !expandedItem) return;

  animateTitleOut();
  animateOverlayOut();

  document.querySelectorAll(".item").forEach((el) => {
    if (el.id !== activeItemId) gsap.to(el as HTMLElement, { opacity: 1, duration: settings.overlayEaseDuration, delay: 0.3, ease: "power2.inOut" });
  });

  const rect = originalPosition.rect;
  gsap.to(expandedItem, {
    width: originalPosition.width,
    height: originalPosition.height,
    x: rect.left + originalPosition.width / 2 - window.innerWidth / 2,
    y: rect.top + originalPosition.height / 2 - window.innerHeight / 2,
    duration: settings.zoomDuration,
    ease: "hop",
    onComplete: () => {
      expandedItem?.remove();
      overlay.classList.remove("active");
      originalPosition = null;
      expandedItem = null;
      isExpanded = false;
      activeItem = null;
      activeItemId = null;
      canDrag = true;
      container.style.cursor = "grab";
      dragVelocityX = dragVelocityY = 0;
      updateVisibleItems();
    }
  });
}

// ---------------------- Animation Loop ----------------------

function animate() {
  if (canDrag) {
    const ease = settings.dragEase;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    canvas.style.transform = `translate(${currentX}px, ${currentY}px)`;

    const now = Date.now();
    const dist = Math.hypot(currentX - lastX, currentY - lastY);
    if (dist > 100 || now - lastUpdateTime > 120) {
      updateVisibleItems();
      lastX = currentX; lastY = currentY; lastUpdateTime = now;
    }
  }
  requestAnimationFrame(animate);
}

// ---------------------- Input Events ----------------------

container.addEventListener("mousedown", (e) => {
  if (!canDrag) return;
  isDragging = true; mouseHasMoved = false;
  startX = e.clientX; startY = e.clientY;
  container.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging || !canDrag) return;
  const dx = e.clientX - startX, dy = e.clientY - startY;
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) mouseHasMoved = true;
  const now = Date.now();
  const dt = Math.max(10, now - lastDragTime);
  lastDragTime = now;
  dragVelocityX = dx / dt;
  dragVelocityY = dy / dt;
  targetX += dx; targetY += dy;
  startX = e.clientX; startY = e.clientY;
});

window.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  if (canDrag && (Math.abs(dragVelocityX) > 0.1 || Math.abs(dragVelocityY) > 0.1)) {
    targetX += dragVelocityX * settings.momentumFactor;
    targetY += dragVelocityY * settings.momentumFactor;
  }
  container.style.cursor = canDrag ? "grab" : "auto";
});

overlay.addEventListener("click", () => isExpanded && closeExpandedItem());

["touchstart", "touchmove", "touchend"].forEach((evt) => {
  container.addEventListener(evt, (e: TouchEvent) => {
    if (evt === "touchstart" && canDrag) {
      isDragging = true; mouseHasMoved = false;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }
    if (evt === "touchmove" && isDragging && canDrag) {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) mouseHasMoved = true;
      targetX += dx; targetY += dy;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }
    if (evt === "touchend") {
      isDragging = false;
    }
  });
});

window.addEventListener("resize", () => {
  if (isExpanded && expandedItem && originalPosition) {
    const viewportWidth = window.innerWidth;
    const tw = viewportWidth * settings.expandedScale;
    const th = tw * (originalPosition.height / originalPosition.width);
    gsap.to(expandedItem, { width: tw, height: th, duration: 0.3, ease: "power2.out" });
  } else {
    updateVisibleItems();
  }
});

// ---------------------- Init ----------------------

function initializeStyles() {
  updateBorderRadius();
  updateVignetteSize();
  updateHoverScale();
  updatePageVignette();
}

initializeStyles();
updateVisibleItems();
animate();
