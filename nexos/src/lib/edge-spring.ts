import { spring } from 'motion';
import type { Transition } from 'motion/react';

/** Mass–spring–damper preset for page edge interactions.
 * Apple-inspired behaviour, not Apple's native spring implementation.
 * Keep duration/bounce out: physical parameters and velocity drive the solver.
 */
export const edgeSpringPhysics = {
  mass: 1.35,
  stiffness: 95,
  damping: 19,
  restSpeed: .01,
  restDelta: .001,
} as const;

export const edgeSpringTransition = {
  type: 'spring',
  ...edgeSpringPhysics,
} as const satisfies Transition;

/** Use for Motion components; reduced motion reaches the target immediately. */
export function getEdgeSpringTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? { duration: 0 } : edgeSpringTransition;
}

/** Independent physical solver, with velocity in units/second.
 * Call once per edge/movement; nothing runs until the consumer samples it.
 */
export function createEdgeSpring(from: number, to: number, velocity = 0) {
  return spring({
    ...edgeSpringPhysics,
    keyframes: [from, to],
    velocity,
  });
}
