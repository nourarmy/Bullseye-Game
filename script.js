let svg = document.querySelector("svg");
let cursor = svg.createSVGPoint();
let arrows = document.querySelector(".arrows");
let randomAngle = 0;

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

  //bug -> forget #
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

  //bug -> forget "." in class selector
  TweenMax.to(".arrow-angle use", 0.3, {
    x: -distance,
  });

  TweenMax.to("#bow polyline", 0.3, {
    attr: {
      points:
        "88,200 " +
        Math.min(pivot.x - (1 / scale) * distance, 88) +
        ",250 88,300",
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
      d:
        "M100,250c" +
        offset.x +
        "," +
        offset.y +
        "," +
        (arcWidth - offset.x) +
        "," +
        (offset.y + 50) +
        "," +
        arcWidth +
        ",50",
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
    // x2: Math.sin(radians) * 60 + transform.y, --->  //bug -> x2 => y2
    y2: Math.sin(radians) * 60 + transform.y,
  };

  let intersection = getIntersection(arrowSegment, lineSegment);
  if (intersection.segment1 && intersection.segment2) {
    tween.pause();
    let dx = intersection.x - target.x;
    let dy = intersection.y - target.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let selector = ".hit";
    if (distance < 7) {
      selector = ".bullseye";
    }
    showMessage(selector);
  }
}

function onMiss() {
  showMessage(".miss");
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

  //   let dx2 = segment2.x2 - segment2.y2; //bug-> segment2.y2=>segment2.x1
  let dx2 = segment2.x2 - segment2.x1;

  let dy2 = segment2.y2 - segment2.y1;

  //   let cx = segment1.x1 - segment1.x1; //bug-> segment1.x1=>segment2.x1
  let cx = segment1.x1 - segment2.x1;
  
  //   let cy = segment1.y1 - segment1.y1; //bug-> segment1.y1=>segment2.y1
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
  const target = document.querySelector("#target image");

  function moveUp() {
    const currentY = parseFloat(target.getAttribute("y"));
    target.setAttribute("y", currentY - 50);
  }

  function moveDown() {
    const currentY = parseFloat(target.getAttribute("y"));
    target.setAttribute("y", currentY + 50);
  }

  // Example: Move up and down every 2 seconds
  setInterval(function () {
    moveUp();
    setTimeout(moveDown, 1000);
  }, 3000);
});


