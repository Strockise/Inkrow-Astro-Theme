/**
 * Initial inline states that the interactions runtime (/js/interactions.js) animates from.
 * They must be rendered on the element, exactly as the Webflow export did, or elements flash before animating.
 */
const transform = (x: string, y: string, scale = '1, 1') =>
  ['-webkit-', '-moz-', '-ms-', '']
    .map((p) => `${p}transform:translate3d(${x}, ${y}, 0) scale3d(${scale}, 1) rotateX(0) rotateY(0) rotateZ(0) skew(0, 0)`)
    .join(';');

export const ix = {
  /** translateY(10%) + hidden */
  up10: `${transform('0', '10%')};opacity:0`,
  /** translateY(25%) + hidden */
  up25: `${transform('0', '25%')};opacity:0`,
  /** team card info panel, slid out of view */
  down105: transform('0', '105%'),
  /** neutral transform used on zoomable images */
  zero: transform('0', '0'),
};

/** `sizes` Webflow generated for CMS images. */
export const CMS_IMAGE_SIZES = '(max-width: 767px) 100vw, (max-width: 991px) 728px, 940px';
