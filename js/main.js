let currentSelection = 0;
let menuItems = []; // Will be populated dynamically
const clickWheel = document.getElementById("click-wheel");
const centerButton = document.getElementById("center-button");

let isMouseDown = false;
let lastAngle = 0;
let totalRotation = 0;
const sensitivity = 1.5; // How sensitive the wheel is

// Initialize menu selection after content is loaded
function initializeMenuSelection() {
  menuItems = document.querySelectorAll(".menu li");
  currentSelection = 0;
  
  // Remove all existing selections
  menuItems.forEach(item => item.classList.remove("selected"));
  
  // Initialize first item as selected
  if (menuItems.length > 0) {
    menuItems[currentSelection].classList.add("selected");
  }
}

// Get angle from center of wheel
function getAngle(event, element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const x = event.clientX - centerX;
  const y = event.clientY - centerY;

  return Math.atan2(y, x) * (180 / Math.PI);
}

// Mouse events for spinning
clickWheel.addEventListener("mousedown", function (e) {
  // Don't start spinning if clicking the center button
  if (e.target === centerButton) return;

  isMouseDown = true;
  lastAngle = getAngle(e, clickWheel);
  clickWheel.style.cursor = "grabbing";
  e.preventDefault();
});

document.addEventListener("mousemove", function (e) {
  if (!isMouseDown) return;

  const currentAngle = getAngle(e, clickWheel);
  let deltaAngle = currentAngle - lastAngle;

  // Handle angle wraparound (from -180 to 180)
  if (deltaAngle > 180) deltaAngle -= 360;
  if (deltaAngle < -180) deltaAngle += 360;

  totalRotation += deltaAngle * sensitivity;

  // Navigate based on rotation
  const rotationThreshold = 30; // degrees needed to move one menu item
  if (Math.abs(totalRotation) >= rotationThreshold) {
    if (totalRotation > 0) {
      navigateDown();
    } else {
      navigateUp();
    }
    totalRotation = 0; // Reset after navigation
  }

  lastAngle = currentAngle;
});

document.addEventListener("mouseup", function () {
  isMouseDown = false;
  clickWheel.style.cursor = "grab";
  totalRotation = 0; // Reset on release
});

// Touch events for mobile
clickWheel.addEventListener("touchstart", function (e) {
  if (e.target === centerButton) return;

  isMouseDown = true;
  const touch = e.touches[0];
  lastAngle = getAngle(touch, clickWheel);
  e.preventDefault();
});

document.addEventListener("touchmove", function (e) {
  if (!isMouseDown) return;

  const touch = e.touches[0];
  const currentAngle = getAngle(touch, clickWheel);
  let deltaAngle = currentAngle - lastAngle;

  // Handle angle wraparound
  if (deltaAngle > 180) deltaAngle -= 360;
  if (deltaAngle < -180) deltaAngle += 360;

  totalRotation += deltaAngle * sensitivity;

  const rotationThreshold = 25; // Slightly more sensitive on touch
  if (Math.abs(totalRotation) >= rotationThreshold) {
    if (totalRotation > 0) {
      navigateDown();
    } else {
      navigateUp();
    }
    totalRotation = 0;
  }

  lastAngle = currentAngle;
  e.preventDefault();
});

document.addEventListener("touchend", function () {
  isMouseDown = false;
  totalRotation = 0;
});

// Center button functionality
centerButton.addEventListener("click", function (e) {
  e.stopPropagation(); // Prevent wheel spinning
  selectCurrentItem();
});

// Keyboard navigation (for desktop experience)
document.addEventListener("keydown", function (e) {
  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      navigateUp();
      break;
    case "ArrowDown":
      e.preventDefault();
      navigateDown();
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      selectCurrentItem();
      break;
  }
});

function navigateUp() {
  if (menuItems.length === 0) return;

  // Don't wrap around - stop at the top
  if (currentSelection === 0) return;

  menuItems[currentSelection].classList.remove("selected");
  currentSelection = currentSelection - 1;
  menuItems[currentSelection].classList.add("selected");
}

function navigateDown() {
  if (menuItems.length === 0) return;

  // Don't wrap around - stop at the bottom
  if (currentSelection === menuItems.length - 1) return;

  menuItems[currentSelection].classList.remove("selected");
  currentSelection = currentSelection + 1;
  menuItems[currentSelection].classList.add("selected");
}

function selectCurrentItem() {
  if (menuItems.length === 0) return;

  const selectedItem = menuItems[currentSelection];
  const link = selectedItem.querySelector("a");

  if (link) {
    // Prevent default link behavior and use SPA navigation
    const page = link.getAttribute('data-page');
    if (page) {
      navigateToPage(page);
    }
  } else {
    const text = selectedItem.textContent.trim();
    if (text === "Projects") {
      alert("Projects page coming soon!");
    }
  }
}
