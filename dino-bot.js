// Chrome Dino auto-player
// ----------------------
// How to use:
//   1. Open chrome://dino in Chrome (or turn off Wi-Fi and open any page).
//   2. Open the Console: Ctrl+Shift+J (Cmd+Option+J on Mac).
//   3. Paste this whole file into the Console and press Enter.
//   4. The game starts and the dino plays by itself.
//   To stop it, run:  stopDinoBot()
//
// Newer Chrome hides the game's code from the Console, so this bot "looks" at
// the game's pixels to find cacti and birds, then presses the keys for you.

(function () {
  const canvas = document.querySelector(".runner-canvas");
  if (!canvas) {
    console.error("Dino game not found. Open chrome://dino first.");
    return;
  }
  if (window.stopDinoBot) window.stopDinoBot();

  const ctx = canvas.getContext("2d");
  const S = canvas.width / 600; // the game is 600 units wide; screens can be sharper

  // Positions in game units.
  const SCAN_FROM = 112;  // start looking just past the dino (and its ducking body)
  const LOW_TOP = 100, LOW_BOTTOM = 124; // band where cacti and low birds are
  const MID_TOP = 93, MID_BOTTOM = 99;   // band where middle-height birds are

  function press(type, isJump) {
    document.dispatchEvent(
      new KeyboardEvent(type, {
        key: isJump ? " " : "ArrowDown",
        code: isJump ? "Space" : "ArrowDown",
        keyCode: isJump ? 32 : 40,
        which: isJump ? 32 : 40,
        bubbles: true,
      })
    );
  }

  function grab(x1, x2, y1, y2) {
    const w = Math.round((x2 - x1) * S), h = Math.round((y2 - y1) * S);
    return { w, h, px: ctx.getImageData(Math.round(x1 * S), Math.round(y1 * S), w, h).data };
  }
  const dark = (px, i) => px[i + 3] > 128 && px[i] < 160;

  function somethingIn(x1, x2, y1, y2) {
    const { px } = grab(x1, x2, y1, y2);
    for (let i = 0; i < px.length; i += 4) if (dark(px, i)) return true;
    return false;
  }

  // Left edge (in game units) of the nearest obstacle in a band, or Infinity.
  function nearestIn(y1, y2) {
    const { w, h, px } = grab(SCAN_FROM, 600, y1, y2);
    for (let x = 0; x < w; x++)
      for (let y = 0; y < h; y++)
        if (dark(px, (y * w + x) * 4)) return SCAN_FROM + x / S;
    return Infinity;
  }

  // The dino is on the ground when its body is low and nothing of it is up high.
  const onGround = () => somethingIn(60, 85, 105, 122) && !somethingIn(55, 90, 20, 88);

  let speed = 6;          // obstacle speed in game units per frame (60 fps)
  let lastX = Infinity, lastT = 0;
  let ducking = false, holdingJump = false, running = true;

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);

    const low = nearestIn(LOW_TOP, LOW_BOTTOM);
    const mid = nearestIn(MID_TOP, MID_BOTTOM);
    const next = Math.min(low, mid);

    // Measure how fast the nearest obstacle is moving.
    if (next < Infinity && lastX < Infinity && lastT) {
      const moved = lastX - next;
      const frames = (now - lastT) / (1000 / 60);
      if (moved > 0 && moved < 40 && frames > 0) {
        speed = speed * 0.8 + (moved / frames) * 0.2;
      }
    }
    lastX = next; lastT = now;

    // React earlier when things are moving faster.
    const reactAt = SCAN_FROM + 9 * speed;

    if (low < reactAt) {
      if (ducking) { press("keyup", false); ducking = false; }
      if (!holdingJump && onGround()) {
        holdingJump = true;
        press("keydown", true);
        setTimeout(() => { press("keyup", true); holdingJump = false; }, 200);
      }
    } else if (mid < reactAt) {
      if (!ducking && onGround()) { press("keydown", false); ducking = true; }
    } else if (ducking && !somethingIn(40, SCAN_FROM, MID_TOP, MID_BOTTOM)) {
      // The bird has flown past, so stand back up.
      press("keyup", false);
      ducking = false;
    }
  }

  press("keydown", true); // start the game
  setTimeout(() => press("keyup", true), 50);
  requestAnimationFrame(loop);

  window.stopDinoBot = function () {
    running = false;
    if (ducking) press("keyup", false);
    window.stopDinoBot = null;
    console.log("Dino bot stopped.");
  };
  console.log("Dino bot running! Run stopDinoBot() to stop.");
})();
