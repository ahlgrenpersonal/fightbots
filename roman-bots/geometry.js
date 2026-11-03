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

// Physics and artwork agree on the arrow tip at the moment the string releases.
export function bowReleasePoint(unit) {
  const contact = unit.action ? { ...unit, action: { ...unit.action, elapsed: unit.action.hitTime } } : unit;
  const grip = bowGrip(contact);
  const size = botSize(unit);
  return { x: unit.x + (grip.x + Math.cos(grip.angle) * 53 * grip.scale) * size / 100,
    y: unit.y + (grip.y + Math.sin(grip.angle) * 53 * grip.scale) * size / 100 };
}
