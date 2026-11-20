type ScrollGeometry = { refresh: () => void };

const pending = new Set<ScrollGeometry>();
let frame = 0;

/** Reconcile all scenes once after their setup and font callbacks have settled. */
export function scheduleScrollRefresh(trigger: ScrollGeometry) {
  pending.add(trigger);
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const targets = [...pending];
    pending.clear();
    targets.forEach(target => target.refresh());
  });
}
