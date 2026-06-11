// Keyboard state with per-frame "justPressed" edge detection.
// game code reads input.left/right etc. and input.jumpPressed (edge).
const held = {
  left: false, right: false, jump: false, fire: false,
  pause: false, mute: false, confirm: false,
};
const prev = { ...held };
// snapshot of edges, refreshed once per frame by update()
export const input = {
  left: false, right: false, jump: false, fire: false,
  jumpPressed: false, firePressed: false,
  pausePressed: false, mutePressed: false, confirmPressed: false,
};

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', Space: 'jump',
  KeyX: 'fire', KeyK: 'fire',
  KeyP: 'pause', KeyM: 'mute', Enter: 'confirm',
};

export function initInput() {
  window.addEventListener('keydown', (e) => {
    const name = KEYMAP[e.code];
    if (!name) return;
    e.preventDefault();
    held[name] = true;
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYMAP[e.code];
    if (!name) return;
    e.preventDefault();
    held[name] = false;
  });
}

// Call exactly once per simulated frame, before game update.
export function updateInput() {
  input.left = held.left;
  input.right = held.right;
  input.jump = held.jump;
  input.fire = held.fire;
  input.jumpPressed = held.jump && !prev.jump;
  input.firePressed = held.fire && !prev.fire;
  input.pausePressed = held.pause && !prev.pause;
  input.mutePressed = held.mute && !prev.mute;
  input.confirmPressed = held.confirm && !prev.confirm;
  Object.assign(prev, held);
}
