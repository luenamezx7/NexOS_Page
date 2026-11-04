// The artwork sits inside a much larger square canvas. Keep the flame and
// silhouette in view while giving the mark a little breathing room.
export function frameMascotSvg(svg: string) {
  return svg.replace('viewBox="0 0 1254 1254"', 'viewBox="240 215 770 770"');
}
