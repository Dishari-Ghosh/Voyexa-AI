// Layout of the itinerary PDF, in millimetres on an A4 portrait page
// (210 x 297 mm). The template image is drawn as the page background, then
// text is placed on top using these positions.
//
// If you design your own template (src/assets/pdf/template.png), keep it A4
// portrait, and adjust the numbers below so the text lands in the empty
// areas of YOUR design. src/assets/pdf/template-guide.png shows these zones
// on the default template.

export const PDF_LAYOUT = {
  page: { width: 210, height: 297 },

  // LOGO — the logo image (src/assets/brand/logo.png) is fitted inside this
  // box, keeping its proportions.
  logo: { x: 15, y: 10, size: 20 },

  // WEBSITE NAME — text drawn to the right of the logo. y is the text baseline.
  brandName: { x: 40, y: 24, fontSize: 24 },

  // TRAVELLER INFO — title, "Prepared for", trip facts. Page 1 only.
  info: { x: 15, y: 48, width: 180 },

  // ITINERARY TEXT AREA — day-wise list. Page 1 starts below the info block;
  // later pages start higher up (nextPageTop).
  content: { x: 15, width: 180, firstPageTop: 92, nextPageTop: 50, bottom: 279 },

  // FOOTER — "Voyexa AI · Downloaded on <date, time>" on the left,
  // "Page x of y" on the right. y is the text baseline.
  footer: { y: 292.5, leftX: 15, rightX: 195, fontSize: 8 },

  // Text colours [r, g, b]. The defaults suit the default template (light
  // parchment body, dark navy header/footer bands). If your template is
  // dark, change body colours to light ones.
  colors: {
    headerText: [255, 255, 255], // website name (on the header band)
    body: [30, 33, 41], // main text
    muted: [96, 90, 74], // secondary text
    accent: [217, 142, 34], // "Day 1" labels, total
    line: [199, 187, 158], // card borders
    footerText: [237, 239, 244], // footer text (on the footer band)
    cardFill: [255, 255, 255], // place cards (drawn semi-transparent)
  },

  // Auto-fit: the text is first shrunk (down to `min`) to try to fit on ONE
  // page. If it still doesn't fit, it flows onto extra pages at `multiPage`
  // size, and the template is repeated on every page.
  fit: { min: 0.75, multiPage: 0.9, step: 0.05 },
};
