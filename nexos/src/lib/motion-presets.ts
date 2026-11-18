/** Shared choreography, in seconds. Keep scroll and component owners separate. */
export const motionTiming = {
  feedback: .16,
  selection: .24,
  content: .4,
  entrance: .85,
  popupInterval: 3000,
} as const;

export const motionEase = [.22, 1, .36, 1] as const;

export const cinematicDesktopQuery = '(min-width: 1200px) and (min-height: 800px) and (pointer: fine) and (min-width: 0px)';
