/** Resolution changes only after sustained frame pressure; motion is never disabled.
 * Two-second windows ignore isolated loading stalls and avoid quality oscillation.
 */
export function createResolutionBudget() {
  let scale = .85;
  let elapsed = 0;
  let samples = 0;
  let slow = 0;
  let healthyWindows = 0;
  return {
    sample(frameMs: number) {
      if (frameMs <= 0 || frameMs > 250) return scale;
      elapsed += frameMs;
      samples++;
      if (frameMs > 45) slow++;
      if (elapsed >= 2000) {
        if (slow / samples > .25) {
          scale = Math.max(.5, Math.round((scale - .15) * 100) / 100);
          healthyWindows = 0;
        } else if (slow === 0 && ++healthyWindows >= 4) {
          scale = Math.min(1, Math.round((scale + .1) * 100) / 100);
          healthyWindows = 0;
        }
        elapsed = samples = slow = 0;
      }
      return scale;
    },
  };
}
