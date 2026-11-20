/** Embedded browsers need stable viewport measurements and lighter visual compositing. */
export function isEmbeddedBrowser(userAgent: string): boolean {
  return /Instagram|FBAN|FBAV|FB_IAB|\bLine\/|TikTok|BytedanceWebview/i.test(userAgent);
}

/** Address-bar/keyboard height changes must not rebuild a pinned touch journey. */
export function createStableViewport() {
  let width = window.innerWidth;
  let height = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-viewport-height')) || window.innerHeight;
  return () => {
    const nextWidth = window.innerWidth;
    const touch = window.matchMedia('(pointer: coarse)').matches || isEmbeddedBrowser(navigator.userAgent);
    if (nextWidth !== width || !touch) {
      width = nextWidth;
      height = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-viewport-height')) || window.innerHeight;
    }
    return { width, height };
  };
}
