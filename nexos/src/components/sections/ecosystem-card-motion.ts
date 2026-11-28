import type { gsap as GSAP } from 'gsap';

/** Interiors never animate the article or any element owned by the stack. */
export function createCardStory(gsap: typeof GSAP, card: HTMLElement, id: string) {
  const story = gsap.timeline();
  const elements = (selector: string) => [...card.querySelectorAll<HTMLElement>(selector)];
  const reveal = (selector: string, at: number, duration = .24, stagger = 0) => {
    const targets = elements(selector);
    if (targets.length) story.fromTo(targets, { opacity: 0, y: 12 }, {
      opacity: 1, y: 0, duration, stagger, ease: 'power2.out',
    }, at);
  };
  story.fromTo(elements('[data-card-reveal]'), { opacity: .3, y: 14 }, {
    opacity: 1, y: 0, duration: .28, stagger: .025, ease: 'power2.out',
  }, 0);
  story.fromTo(elements('[data-scene-shell]'), { opacity: .45, y: 14 }, {
    opacity: 1, y: 0, duration: .35, ease: 'power2.out',
  }, .04);

  if (id === 'site') {
    reveal('[data-web-nav]', .12);
    story.fromTo(elements('[data-web-image]'), { clipPath: 'inset(0% 0% 100% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: .5, ease: 'power2.out',
    }, .18);
    reveal('[data-web-services] > span', .48, .3, .1);
    reveal('[data-web-mobile]', .72, .35);
  } else if (id === 'menu') {
    reveal('[data-menu-photo]', .15, .4);
    reveal('[data-menu-product]', .3, .3, .1);
    reveal('[data-menu-cart]', .62, .3);
    story.fromTo(elements('[data-menu-toast]'), { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: .32, ease: 'power2.out' }, .8);
  } else if (id === 'nfc') {
    story.fromTo(elements('[data-nfc-phone]'), { x: 42, y: 24, rotation: 7 }, {
      x: 0, y: 0, rotation: 0, duration: .6, ease: 'power2.inOut',
    }, .12);
    const rings = elements('[data-nfc-signal]');
    story.fromTo(rings, { opacity: 0, scale: .65 }, { opacity: .75, scale: 1, duration: .22, stagger: .12 }, .44)
      .to(rings, { opacity: 0, scale: 1.25, duration: .3, stagger: .1 }, .72);
    reveal('[data-nfc-notice]', .55, .22);
    reveal('[data-nfc-page]', .76, .35);
  } else if (id === 'portfolio') {
    reveal('[data-project]', .14, .45, .17);
    reveal('[data-project-label]', .7, .3, .06);
  } else if (id === 'landing') {
    reveal('[data-landing-module]', .14, .32, .15);
    story.fromTo(elements('[data-landing-cursor]'), { x: 38, y: 64, opacity: 0 }, {
      x: 0, y: 0, opacity: 1, duration: .6, ease: 'power2.out',
    }, .36);
    reveal('[data-landing-focus]', .82, .22);
  } else if (id === 'easychat') {
    reveal('[data-chat-user]', .12);
    story.fromTo(elements('[data-chat-typing]'), { opacity: 0 }, { opacity: 1, duration: .12 }, .32)
      .to(elements('[data-chat-typing]'), { opacity: 0, duration: .12 }, .56);
    reveal('[data-chat-reply]', .6);
    reveal('[data-chat-file]', .82, .3);
    reveal('[data-chat-review]', 1.02, .22);
  } else if (id === 'suporte') {
    reveal('[data-support-question]', .12);
    reveal('[data-support-answer]', .4);
    reveal('[data-support-check]', .52, .25, .17);
    reveal('[data-support-done]', 1, .25);
  }
  story.to({}, { duration: .01 }, 1.3);
  return story;
}
