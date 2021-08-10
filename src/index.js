import "./styles.scss";

// Future: Add a canvas/svg to paint the path of the ball
// Future: Add "slingshot" from origin
// Future: Make values like "k" and gravity based on window size

// Utils
const kinematics = [
  ({ v0, t, a }) => v0 * t + 0.5 * a * t ** 2, // result is distance
  ({ v0, t, v1 }) => ((v1 + v0) / 2) * t // result is distance
];
const getSpringMaxSpeed = ({ k, x, m }) => ((k * x ** 2) / m) ** 0.5;
const clamp = ({ val, max, min }) => Math.max(Math.min(val, max), min);
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getStartPos = (length) => {
  const percent = 0.3;
  const offset = window.innerHeight * percent;
  const startX = offset - length / 2;
  const startY = window.innerHeight - offset - length / 2;
  return [startX, startY];
};

// Vars
const colors = ["#cd0e66", "#22ab24", "#fd8c00", "#0f82f2"];
const length = 40; // px of ball
const k = 50; // spring constant determine via window size?
const m = 1; // mass
let start = getStartPos(length); // of ball
let end; // of pull
let cursorOffset = [0, 0];
let transform = [0, 0]; // for ease on getting angle later
let rafId;
const gravity = -1800;
// At end of spring
let speedY; // px/sec
let speedX; // px/sec
let angle;
let speed;
let acceleration;

// Create ball
const app = document.getElementById("app");
const ball = document.createElement("div");
ball.id = "ball";
ball.style.width = length + "px";
ball.style.height = length + "px";
ball.style.left = start[0] + "px";
ball.style.top = start[1] + "px";
ball.style.background = pickRandom(colors);
app.appendChild(ball);

// Event listeners
function onDragStart(e) {
  document.body.classList.add("dragging");
  cursorOffset = [e.clientX - start[0], e.clientY - start[1]];
  ball.releasePointerCapture(e.pointerId);
  document.addEventListener("pointermove", onDrag);
  document.addEventListener("pointerup", onDragStop);
}

function onDrag(e) {
  const transformX = e.clientX - start[0] - cursorOffset[0];
  const transformY = e.clientY - start[1] - cursorOffset[1];
  const startOffset = start[0]; // both x + y position start in at same dist
  transform = [
    // Limits angles to 0-90
    clamp({ val: transformX, max: 0, min: -startOffset }),
    clamp({ val: transformY, max: startOffset, min: 0 })
  ];
  ball.style.transform = `translate(${transform[0]}px, ${transform[1]}px)`;
}

function onDragStop(e) {
  end = [start[0] + transform[0], start[1] + transform[1]]; // holding for animation purposes

  // Some clean up
  document.body.classList.remove("dragging");
  document.removeEventListener("pointermove", onDrag);
  document.removeEventListener("pointerup", onDragStop);

  // Calc spring values ie max speed, angle, accel
  const dist = Math.hypot(transform[0], transform[1]);
  speed = getSpringMaxSpeed({
    k,
    x: dist,
    m
  });
  angle = Math.atan(Math.abs(transform[1] / transform[0]));
  speedX = Math.cos(angle) * speed;
  speedY = Math.sin(angle) * speed;
  acceleration = (k * dist) / m;

  // Animate spring to to origin
  rafId = window.requestAnimationFrame((timestamp) =>
    animateSpringMotion(timestamp, timestamp)
  );
}

function animateSpringMotion(timestamp, initTimestamp) {
  const elapsed = (timestamp - initTimestamp) / 1000; // sec
  const distance = kinematics[0]({ v0: 0, t: elapsed, a: acceleration });
  const distanceX = Math.cos(angle) * distance;
  const distanceY = Math.sin(angle) * distance;
  const x = end[0] + distanceX;
  const y = end[1] - distanceY;
  // In bounds animate + keep going
  if (x <= start[0] && y >= start[1]) {
    ball.style.transform = `translate(${x - start[0]}px, ${y - start[1]}px)`;
    rafId = window.requestAnimationFrame((time) =>
      animateSpringMotion(time, initTimestamp)
    );
  } else {
    // If out of bounds... start projectile motion
    rafId = window.requestAnimationFrame((time) =>
      animateProjectileMotion(time, time)
    );
  }
}

function animateProjectileMotion(timestamp, initTimestamp) {
  const elapsed = (timestamp - initTimestamp) / 1000; // sec
  const distanceX = elapsed * speedX; // easy constant
  const distanceY = -kinematics[0]({ v0: speedY, t: elapsed, a: gravity });
  ball.style.transform = `translate(${distanceX}px, ${distanceY}px)`;
  const x = start[0] + distanceX;
  const y = start[1] + distanceY;

  // In bounds, keep going
  if (
    x > 0 - length &&
    y > 0 - length &&
    x <= window.innerWidth + length &&
    y <= window.innerHeight + length
  )
    rafId = window.requestAnimationFrame((time) =>
      animateProjectileMotion(time, initTimestamp)
    );
  else {
    // Out of bounds reset
    window.cancelAnimationFrame(rafId);
    ball.style.transform = "";
    ball.style.background = pickRandom(colors);
  }
}

ball.addEventListener("pointerdown", onDragStart);
window.addEventListener("resize", () => {
  start = getStartPos(length);
  ball.style.left = start[0] + "px";
  ball.style.top = start[1] + "px";
});
