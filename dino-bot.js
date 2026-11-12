// Chrome Dino auto-player
// ----------------------
// How to use:
//   1. Open chrome://dino in Chrome (or turn off Wi-Fi and open any page).
//   2. Open DevTools: F12, or Ctrl+Shift+J (Cmd+Option+J on Mac).
//   3. Paste this whole file into the Console tab and press Enter.
//   4. Press Space to start the game. The dino plays by itself.
//   To stop it, run:  stopDinoBot()

(function () {
  const runner = window.Runner && (Runner.instance_ || (Runner.getInstance && Runner.getInstance()));
  if (!runner) {
    console.error("Dino game not found. Open chrome://dino first.");
    return;
  }

  if (window.__dinoBot) clearInterval(window.__dinoBot);

  // Pterodactyls fly at one of three heights (yPos): 100 = low, 75 = middle, 50 = high.
  const LOW_BIRD = 100;
  const HIGH_BIRD = 50;

  function tick() {
    if (runner.crashed || !runner.playing) return;

    const dino = runner.tRex;
    const speed = runner.currentSpeed;

    // The closest obstacle the dino hasn't passed yet.
    const obstacle = runner.horizon.obstacles.find(
      (o) => o.xPos + o.width > dino.xPos
    );

    if (!obstacle) {
      if (dino.ducking) dino.setDuck(false);
      return;
    }

    const distance = obstacle.xPos - (dino.xPos + dino.config.WIDTH);
    // React earlier as the game gets faster.
    const reactAt = 15 + speed * 8;
    const isBird = obstacle.typeConfig.type === "PTERODACTYL";

    if (isBird && obstacle.yPos <= HIGH_BIRD) {
      // High bird: just run underneath it.
      return;
    }

    if (isBird && obstacle.yPos < LOW_BIRD) {
      // Middle bird: duck under it.
      if (distance < reactAt && !dino.jumping) dino.setDuck(true);
      return;
    }

    // Cactus or low bird: jump.
    if (dino.ducking) dino.setDuck(false);
    if (distance > 0 && distance < reactAt && !dino.jumping) {
      dino.startJump(speed);
    }
  }

  window.__dinoBot = setInterval(tick, 5);
  window.stopDinoBot = function () {
    clearInterval(window.__dinoBot);
    window.__dinoBot = null;
    console.log("Dino bot stopped.");
  };

  console.log("Dino bot running. Press Space to start. Run stopDinoBot() to stop.");
})();
