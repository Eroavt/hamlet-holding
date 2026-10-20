import gsap from 'gsap';

/**
 * A piece of type that travels from one element to another and becomes it —
 * the label a visitor tapped on the overview grows into the headline of the
 * division page, and shrinks back into its label on the way out.
 *
 * Each line flies on its own. The two ends are aligned differently (labels in
 * the right-hand column are right-aligned, headlines are left-aligned), and a
 * single block cannot change alignment mid-flight without its shorter line
 * jumping sideways. Lines can: each one simply starts where it is drawn and
 * ends where it will be drawn.
 *
 * Size and tracking are tweened as real type properties, not as a scale — the
 * two ends are tracked very differently, and scaling one into the other would
 * show the wrong letter-spacing for the entire flight.
 */

interface End {
  rect: DOMRect;
  size: number;
  tracking: number;
  lineHeight: number;
  weight: number;
  align: string;
}

function read(el: HTMLElement): End {
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize);
  const lh = cs.lineHeight.endsWith('px') ? parseFloat(cs.lineHeight) : parseFloat(cs.lineHeight) * size || size * 1.2;
  const tracking = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
  return {
    rect: el.getBoundingClientRect(),
    size,
    tracking,
    lineHeight: lh,
    weight: parseFloat(cs.fontWeight) || 600,
    align: cs.textAlign,
  };
}

/** Where a line of `width` starts inside a box with the given alignment. */
function lineLeft(end: End, width: number): number {
  if (end.align === 'right' || end.align === 'end') return end.rect.right - width;
  if (end.align === 'center') return end.rect.left + (end.rect.width - width) / 2;
  return end.rect.left;
}

export function flyText(
  from: HTMLElement,
  to: HTMLElement,
  duration: number,
  ease = 'power3.inOut',
  /** Where `to` will be, when it is still moving towards its place. */
  toRect: DOMRect | null = null,
): gsap.core.Timeline {
  const a = read(from);
  const b = read(to);
  if (toRect) b.rect = toRect;
  const lines = (from.textContent ?? '').split('\n');
  const font = getComputedStyle(from).fontFamily;

  const spans = lines.map((text) => {
    const s = document.createElement('span');
    s.className = 'flight';
    s.textContent = text;
    s.style.fontFamily = font;
    document.body.append(s);
    return s;
  });

  // Line widths at each end, measured in that end's type.
  const measure = (end: End): number[] =>
    spans.map((s) => {
      gsap.set(s, { fontSize: end.size, letterSpacing: end.tracking, fontWeight: end.weight });
      // Trailing tracking is not ink; leave it out or right-aligned lines sit
      // one letter-space too far left.
      return s.getBoundingClientRect().width - end.tracking;
    });
  const wa = measure(a);
  const wb = measure(b);

  const tl = gsap.timeline({
    onComplete: () => {
      to.style.opacity = '1';
      spans.forEach((s) => s.remove());
    },
  });
  tl.set(from, { opacity: 0 }, 0);
  tl.set(to, { opacity: 0 }, 0);

  spans.forEach((s, i) => {
    tl.fromTo(
      s,
      {
        x: lineLeft(a, wa[i]),
        y: a.rect.top + i * a.lineHeight,
        fontSize: a.size,
        lineHeight: `${a.lineHeight}px`,
        letterSpacing: a.tracking,
        fontWeight: a.weight,
      },
      {
        x: lineLeft(b, wb[i]),
        y: b.rect.top + i * b.lineHeight,
        fontSize: b.size,
        lineHeight: `${b.lineHeight}px`,
        letterSpacing: b.tracking,
        fontWeight: b.weight,
        duration,
        ease,
      },
      // Both lines on one clock. Even a 30 ms trail opens a 40 px gap between
      // them at the flight's peak speed.
      0,
    );
  });
  return tl;
}
