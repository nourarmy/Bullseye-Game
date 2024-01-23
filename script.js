let svg = document.querySelector("svg");
let cursor = svg.createSVGPoint();
let arrows = document.querySelector(".arrows");
let randomAngle = 0;
let timerValue = 0;
let scoreValue = 0;
let arrowsLeft = 5;
let timerInterval;
let distance; // Declare distance as a global variable
const game = document.getElementById("game");

game.addEventListener("touchstart", handleTouchStart, false);
game.addEventListener("touchend", handleTouchEnd, false);

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(event) {
  touchStartX = event.changedTouchestouches[0].clientX;
}

function handleTouchEnd(event) {
  touchEndX = event.changedTouches[0].clientX;
  handleSwipe();
}

function handleSwipe() {
  // Calculate the swipe distance
  const swipeDistance = touchEndX - touchStartX;

  // Customize this threshold according to your needs
  const swipeThreshold = 50;

  // Check if the swipe distance is greater than the threshold
  if (Math.abs(swipeDistance) > swipeThreshold) {
    // Determine the direction of the swipe
    const swipeDirection = swipeDistance > 0 ? "right" : "left";

    // Call the function to shoot the arrow based on the swipe direction
    if (swipeDirection === "right") {
      shootArrow();
    }
  }
}




function startGame() {
  timerValue = 0;
  scoreValue = 0;
  arrowsLeft = 5;
  updateTimer();
  updateScore();
  updateArrowsLeft();

  // Listen for the first arrow shot
  window.addEventListener("mousedown", function firstArrowListener() {
    // Remove this listener after the first arrow is shot
  window.removeEventListener("mousedown", firstArrowListener);

    // Start the timer
    timerInterval = setInterval(function () {
      timerValue++;
      updateTimer();
    }, 1000);
  });
}

let target = {
  x: 900,
  y: 249.5,
};

let lineSegment = {
  x1: 875,
  y1: 280,
  x2: 925,
  y2: 220,
};

let pivot = {
  x: 100,
  y: 250,
};

aim({
  clientX: 320,
  clientY: 300,
});

window.addEventListener("mousedown", draw);

function updateTimer() {
  let minutes = Math.floor(timerValue / 60);
  let seconds = timerValue % 60;
  document.getElementById("timerValue").textContent =
    (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function updateScore() {
  document.getElementById("scoreValue").textContent = scoreValue;
}

function updateArrowsLeft() {
  document.getElementById("arrowsLeft").textContent = arrowsLeft;
}

function draw(e) {
  randomAngle = Math.random() * Math.PI * 0.03 - 0.015;
  TweenMax.to(".arrow-angle use", 0.3, {
    opacity: 1,
  });
  window.addEventListener("mousemove", aim);
  window.addEventListener("mouseup", loose);
  aim(e);
}

function aim(e) {
  let point = getMouseSVG(e);
  point.x = Math.min(point.x, pivot.x - 7);
  point.y = Math.max(point.y, pivot.y + 7);
  let dx = point.x - pivot.x;
  let dy = point.y - pivot.y;

  let angle = Math.atan2(dy, dx) + randomAngle;
  let bowAngle = angle - Math.PI;
  let distance = Math.min(Math.sqrt(dx * dx + dy * dy), 50);
  let scale = Math.min(Math.max(distance / 30, 1), 2);

  TweenMax.to("#bow", 0.3, {
    scaleX: scale,
    rotation: bowAngle + "rad",
    transformOrigin: "right center",
  });

  let arrowX = Math.min(pivot.x - (1 / scale) * distance, 88);
  TweenMax.to(".arrow-angle", 0.3, {
    rotation: bowAngle + "rad",
    svgOrigin: "100 250",
  });

  TweenMax.to(".arrow-angle use", 0.3, {
    x: -distance,
  });

  TweenMax.to("#bow polyline", 0.3, {
    attr: {
      points: "88,200 " + Math.min(pivot.x - (1 / scale) * distance, 88) + ",250 88,300",
    },
  });

  let radius = distance * 9;
  let offset = {
    x: Math.cos(bowAngle) * radius,
    y: Math.sin(bowAngle) * radius,
  };
  let arcWidth = offset.x * 3;
  TweenMax.to("#arc", 0.3, {
    attr: {
      d: "M100,250c" + offset.x + "," + offset.y + "," + (arcWidth - offset.x) + "," + (offset.y + 50) + "," + arcWidth + ",50",
    },
    autoAlpha: distance / 60,
  });
}

function loose() {
  window.removeEventListener("mousemove", aim);
  window.removeEventListener("mouseup", loose);

  TweenMax.to("#bow", 0.4, {
    scaleX: 1,
    transformOrigin: "right center",
    ease: Elastic.easeOut,
  });

  TweenMax.to("#bow polyline", 0.4, {
    attr: {
      points: "88,200 88,250 88,300",
    },
    ease: Elastic.easeOut,
  });

  let newArrow = document.createElementNS("http://www.w3.org/2000/svg", "use");
  newArrow.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#arrow");
  arrows.appendChild(newArrow);

  let path = MorphSVGPlugin.pathDataToBezier("#arc");

  TweenMax.to([newArrow], 0.5, {
    force3D: true,
    bezier: {
      type: "cubic",
      values: path,
      autoRotate: ["x", "y", "rotation"],
    },
    onUpdate: hitTest,
    onUpdateParams: ["{self}"],
    onComplete: onMiss,
    ease: Linear.easeNone,
  });

  TweenMax.to("#arc", 0.3, {
    opacity: 0,
  });

  TweenMax.set(".arrow-angle use", {
    opacity: 0,
  });
}

function hitTest(tween) {
  let arrow = tween.target[0];
  let transform = arrow._gsTransform;
  let radians = (transform.rotation * Math.PI) / 180;
  let arrowSegment = {
    x1: transform.x,
    y1: transform.y,
    x2: Math.cos(radians) * 60 + transform.x,
    y2: Math.sin(radians) * 60 + transform.y,
  };

  let intersection = getIntersection(arrowSegment, lineSegment);
  if (intersection.segment1 && intersection.segment2) {
    tween.pause();
    let dx = intersection.x - target.x;
    let dy = intersection.y - target.y;
    distance = Math.sqrt(dx * dx + dy * dy); // Assign distance to the global variable

    let selector = ".hit";
    let scoreChange = 50;

    if (distance < 7) {
      selector = ".bullseye";
      scoreChange = 100; // Bullseye: +100 points
      arrowsLeft += 1; // Increase arrows by 1 for bullseye
      updateArrowsLeft();
    }

    showMessage(selector);

    arrowsLeft -= 1; // Decrease arrows by 1 for hit or miss
    scoreValue += scoreChange;
    updateScore();
    updateArrowsLeft();

    let scoreMessage = scoreChange > 0 ? `(+${scoreChange})` : `(${scoreChange})`;
    showScoreChange(scoreMessage);

    if (arrowsLeft === 0 || scoreValue >= 400) {
      endGame();
    }
  }
}

function showScoreChange(scoreMessage) {
  let scoreChangeContainer = document.getElementById("scoreChange");
  scoreChangeContainer.textContent = scoreMessage;
  TweenMax.fromTo(
    scoreChangeContainer,
    1,
    { opacity: 3, y: 0 },
    { opacity: 0, y: -20, ease: Power2.easeOut }
  );
}

function updateArrowsLeft() {
  let arrowsContainer = document.getElementById("arrowsLeft");
  let arrowsChangeContainer = document.getElementById("arrowsChange");
  arrowsContainer.textContent = arrowsLeft;

  // Show arrows change message
  showArrowsChange(arrowsLeft - 5, arrowsChangeContainer); // Change 5 to the initial number of arrows
}

function showArrowsChange(change, container) {
  if (change !== 0) {
    const displayChange = distance < 7 ? '+1' : '-1';
    container.textContent = ` (${displayChange})`;
    TweenMax.fromTo(
      container,
      1,
      { opacity: 1, y: 0 },
      { opacity: 0, y: -20, ease: Power2.easeOut }
    );
  } else {
    container.textContent = ''; // If no change, clear the content
  }
}

function onMiss() {
  showMessage(".miss");
  scoreValue -= 10;
  arrowsLeft -= 1; // Decrease arrows by 1 for miss
  updateScore();
  updateArrowsLeft();
  let scoreMessage = "(-10)";
  showScoreChange(scoreMessage);
  if (arrowsLeft === 0 || scoreValue >= 400) {
    endGame();
  }
}


function endGame() {
  clearInterval(timerInterval);

 

  if (arrowsLeft === 0 && scoreValue < 400) {
    showLoseMessage();
  } else if (arrowsLeft <= 0 && scoreValue >= 400) {
    showWinMessage();
  }

  // Add a delay before resetting the game to show end game messages
  setTimeout(resetGame, 1100); // Adjust the delay as needed
}


function resetGame() {
  // Clear or remove the "You Win" and "You Lose" messages
  let winMessage = document.getElementById("winMessage");
  let loseMessage = document.getElementById("loseMessage");
  winMessage.style.opacity = 0;
  loseMessage.style.opacity = 0;
  


  // Reset other game elements as needed
  startGame(); // Start a new game

  // Clear or remove arrows from the SVG
  let arrowsContainer = document.querySelector(".arrows");
  while (arrowsContainer.firstChild) {
    arrowsContainer.removeChild(arrowsContainer.firstChild);
  }
}




document.getElementById("winMessage").style.opacity = 0;
document.getElementById("loseMessage").style.opacity = 0;

function showWinMessage() {
  console.log("Showing win message");
  let winMessage = document.getElementById("winMessage");
  TweenMax.to(winMessage, 1, { opacity: 1, ease: Power2.easeOut });
}


function showLoseMessage() {
  let loseMessage = document.getElementById("loseMessage");
  TweenMax.to(loseMessage, 1, { opacity: 1, ease: Power2.easeOut });
}


function showMessage(selector) {
  TweenMax.killTweensOf(selector);
  TweenMax.killChildTweensOf(selector);

  TweenMax.set(selector, {
    autoAlpha: 1,
  });

  TweenMax.staggerFromTo(
    selector + " path",
    0.5,
    {
      rotation: -5,
      scale: 0,
      transformOrigin: "center",
    },
    {
      scale: 1,
      ease: Back.easeOut,
    },
    0.05
  );
  TweenMax.staggerTo(
    selector + " path",
    0.3,
    {
      delay: 2,
      rotation: 20,
      scale: 0,
      ease: Back.easeIn,
    },
    0.03
  );
}

function getMouseSVG(e) {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
  return cursor.matrixTransform(svg.getScreenCTM().inverse());
}

function getIntersection(segment1, segment2) {
  let dx1 = segment1.x2 - segment1.x1;
  let dy1 = segment1.y2 - segment1.y1;
  let dx2 = segment2.x2 - segment2.x1;
  let dy2 = segment2.y2 - segment2.y1;
  let cx = segment1.x1 - segment2.x1;
  let cy = segment1.y1 - segment2.y1;

  let denominator = dy2 * dx1 - dx2 * dy1;
  if (denominator == 0) {
    return null;
  }

  let ua = (dx2 * cy - dy2 * cx) / denominator;
  let ub = (dx1 * cy - dy1 * cx) / denominator;
  return {
    x: segment1.x1 + ua * dx1,
    y: segment1.y1 + ua * dy1,
    segment1: ua >= 0 && ua <= 1,
    segment2: ub >= 0 && ub <= 1,
  };
}

document.addEventListener("DOMContentLoaded", function () {
  startGame();
});

const targetElement = document.querySelector("#target image");

function moveUp() {
  const currentY = parseFloat(targetElement.getAttribute("y"));
  targetElement.setAttribute("y", currentY - 50);
}

function moveDown() {
  const currentY = parseFloat(targetElement.getAttribute("y"));
  targetElement.setAttribute("y", currentY + 50);
}

setInterval(function () {
  moveUp();
  setTimeout(moveDown, 1000);
}, 3000);
