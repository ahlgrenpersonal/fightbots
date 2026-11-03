export const BOT_SIZE = 1.08;
export const botScale = unit => unit.boss ? 1.5 : unit.champion ? 1.2 : 1;
export const botSize = unit => BOT_SIZE * botScale(unit);
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };

export function shieldOpening(unit) {
  // Tower fighters expose themselves only around contact, not the whole swing.
  if(unit.shield==='tower')return unit.action?clamp(1-Math.abs(unit.action.elapsed-unit.action.hitTime)/.08):0;
  const pose=actionPose(unit);return pose.wind*(1-pose.recover);
}

export function actionPose(unit) {
  const a = unit.action;
  if (!a) return { active: false, wind: 0, strike: 0, recover: 0, swing: 0 };
  const duration = Math.max(.01, Number(a.duration) || .6);
  const elapsed = Math.max(0, Math.min(duration, Number(a.elapsed) || 0));
  const hit = Math.max(duration * .15, Math.min(duration * .85, Number.isFinite(a.hitTime) ? a.hitTime : duration * .55));
  const strikeStart = Math.max(hit * .5, hit - duration * .13);
  const wind = ease(elapsed / strikeStart);
  const strike = ease((elapsed - strikeStart) / Math.max(.001, hit - strikeStart));
  const recover = ease((elapsed - hit) / Math.max(.001, duration - hit));
  return { active: elapsed < duration, wind, strike, recover,
    swing: elapsed >= strikeStart && elapsed <= hit ? Math.sin(strike * Math.PI) : 0 };
}

export function bowGrip(unit, pose = actionPose(unit)) {
  const angle = Number.isFinite(unit.angle) ? unit.angle : -Math.PI / 2;
  const side = Math.cos(angle) < -.1 ? -1 : 1;
  const thrust = -7 * pose.strike * (1 - pose.recover);
  return { x: side * 39 + Math.cos(angle) * thrust,
    y: 15 + Math.sin(angle) * thrust, angle, scale: .86 };
}

export const bowArrowVisible = pose => pose.strike < 1 || pose.recover >= .55;

export function bowContainsPoint(unit, point, margin = 0) {
  if (unit.weapon !== 'bow') return false;
  const pose = actionPose(unit), grip = bowGrip(unit, pose), size = botSize(unit) / 100;
  const dx = (point.x - unit.x) / size - grip.x, dy = (point.y - unit.y) / size - grip.y;
  const x = (Math.cos(grip.angle) * dx + Math.sin(grip.angle) * dy) / grip.scale;
  const y = -Math.sin(grip.angle) * dx + Math.cos(grip.angle) * dy;
  const padding = 3.5 + margin / size / grip.scale;
  const near = (ax, ay, bx, by) => {
    const vx = bx - ax, vy = by - ay;
    const t = clamp(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1));
    return Math.hypot(x - ax - vx * t, y - ay - vy * t) <= padding;
  };
  // Trace the painted stave, string and nocked arrow, not a larger body halo.
  let ax = 8, ay = -32;
  for (let i = 1; i <= 12; i++) {
    const t = i / 12, u = 1 - t;
    const bx = 8 + 84 * u * t, by = -32 * u ** 3 - 66 * u * u * t + 66 * u * t * t + 32 * t ** 3;
    if (near(ax, ay, bx, by)) return true;
    ax = bx; ay = by;
  }
  const pull = pose.wind * (1 - pose.strike), string = 5 - pull * 23;
  if (near(8, -32, string, 0) || near(string, 0, 8, 32)) return true;
  if (x >= 23 - padding && x <= 30 + padding && Math.abs(y) <= 7 + padding) return true;
  if (!bowArrowVisible(pose)) return false;
  const rear = 3 - pull * 23;
  return near(rear - 12, 0, rear + 43, 0) || near(rear + 50, 0, rear + 38, -5)
    || near(rear + 38, -5, rear + 39, 5) || near(rear + 39, 5, rear + 50, 0)
    || [-1, 1].some(side => near(rear - 6, 0, rear - 13, side * 6)
      || near(rear - 13, side * 6, rear - 19, side * 6) || near(rear - 19, side * 6, rear - 13, 0));
}

// Physics and artwork agree on the arrow tip at the moment the string releases.
export function bowReleasePoint(unit) {
  const contact = unit.action ? { ...unit, action: { ...unit.action, elapsed: unit.action.hitTime } } : unit;
  const grip = bowGrip(contact);
  const size = botSize(unit);
  return { x: unit.x + (grip.x + Math.cos(grip.angle) * 53 * grip.scale) * size / 100,
    y: unit.y + (grip.y + Math.sin(grip.angle) * 53 * grip.scale) * size / 100 };
}
