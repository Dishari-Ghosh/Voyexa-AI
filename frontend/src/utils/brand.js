// The website logo. Drop your logo at:
//
//     src/assets/brand/logo.png      (or logo.jpg)
//
// Recommended: square, 512 x 512 px, transparent-background PNG.
// If the file exists it shows next to "Voyexa AI" in the site header and in
// the top-left corner of every itinerary PDF. If it doesn't exist yet,
// nothing breaks — the site and the PDF just show the name without a logo.
const logoFiles = import.meta.glob("../assets/brand/logo.{png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const BRAND_NAME = "Voyexa AI";
export const brandLogoUrl = Object.values(logoFiles)[0] || null;
