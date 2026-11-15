// Keyboard and mouse state. The game reads held keys for thrust and
// edge-triggered presses for menus, and the pointer for steering and
// clicking on-screen buttons.

export class InputState {
  constructor(canvas) {
    this.keysHeld = new Set();
    this.keysPressed = new Set();
    this.pointerX = 0;
    this.pointerY = 0;
    this.pointerHeld = false;
    this.pointerClicked = false;
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.keysPressed.add(event.code);
      this.keysHeld.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keysHeld.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keysHeld.clear();
      this.pointerHeld = false;
    });

    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.pointerHeld = true;
      this.pointerClicked = true;
    });
    window.addEventListener('pointerup', () => {
      this.pointerHeld = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  endFrame() {
    this.keysPressed.clear();
    this.pointerClicked = false;
  }

  // Edge-triggered reads consume the press: the fixed-step loop runs
  // several updates per animation frame, and a press must act exactly
  // once across all of them (otherwise one P press would pause and
  // immediately resume).
  wasPressed(code) {
    if (!this.keysPressed.has(code)) return false;
    this.keysPressed.delete(code);
    return true;
  }

  wasClicked() {
    if (!this.pointerClicked) return false;
    this.pointerClicked = false;
    return true;
  }

  isHeld(code) {
    return this.keysHeld.has(code);
  }

  thrustDirection() {
    let x = 0;
    let y = 0;
    if (this.isHeld('ArrowLeft') || this.isHeld('KeyA')) x -= 1;
    if (this.isHeld('ArrowRight') || this.isHeld('KeyD')) x += 1;
    if (this.isHeld('ArrowUp') || this.isHeld('KeyW')) y -= 1;
    if (this.isHeld('ArrowDown') || this.isHeld('KeyS')) y += 1;
    if (x !== 0 && y !== 0) {
      const length = Math.hypot(x, y);
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  isBoostHeld() {
    return this.isHeld('Space') || this.isHeld('ShiftLeft') || this.isHeld('ShiftRight');
  }
}
