/** Layout coordinates deliberately ignore entrance/parallax transforms. */
export function sectionScrollPosition(target: HTMLElement): number {
  if (target.id === 'hero') return 0;
  let top = 0;
  let node: HTMLElement | null = target;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  const header = document.querySelector<HTMLElement>('header[role="banner"]');
  const headerClearance = header ? header.getBoundingClientRect().bottom + 16 : 0;
  const margin = Math.max(parseFloat(getComputedStyle(target).scrollMarginTop) || 0, headerClearance);
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  return Math.min(maximum, Math.max(0, top - margin));
}
