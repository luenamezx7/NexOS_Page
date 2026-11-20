/** Native dialogs keep their top layer and scroll lock until the CSS exit finishes. */
export function openDialogSurface(surface: HTMLElement) {
  surface.inert = false;
  surface.classList.remove('is-open', 'is-closing');
  surface.dataset.open = 'false';
  // Commit the initial recipe state before starting the transition.
  void getComputedStyle(surface).opacity;
  surface.classList.add('is-open');
  surface.dataset.open = 'true';
}

export async function closeDialogSurface(surface: HTMLElement) {
  surface.inert = true;
  surface.classList.remove('is-open');
  surface.classList.add('is-closing');
  surface.dataset.open = 'false';
  void getComputedStyle(surface).opacity;
  await Promise.allSettled(surface.getAnimations().map(animation => animation.finished));
}
