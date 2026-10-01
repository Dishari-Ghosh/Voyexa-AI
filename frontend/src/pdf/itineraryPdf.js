// Builds the downloadable itinerary PDF from the template background.
//
//   template image (src/assets/pdf/template.png)   -> page background
//   logo (src/assets/brand/logo.png)               -> top-left, optional
//   text                                           -> placed per pdfTemplate.config.js
//
// Text size adapts to the amount of content (see PDF_LAYOUT.fit).
// jsPDF is loaded on demand, so it doesn't slow down the rest of the site.
import { PDF_LAYOUT as L } from "./pdfTemplate.config.js";
import { BRAND_NAME, brandLogoUrl } from "../utils/brand.js";
import { ZONE_COLORS } from "../components/cards/zoneColors.js";
import regularUrl from "../assets/fonts/PlusJakartaSans_400Regular.ttf?url";
import boldUrl from "../assets/fonts/PlusJakartaSans_700Bold.ttf?url";
import displayUrl from "../assets/fonts/Fraunces_600SemiBold.ttf?url";

const templateFiles = import.meta.glob("../assets/pdf/template.{png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
});
const templateUrl = Object.values(templateFiles)[0] || null;

const SANS = "PlusJakartaSans";
const DISPLAY = "Fraunces";
const PT = 0.3528; // 1 pt in mm
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const GROUP_LABEL = { Solo: "Solo trip", Couples: "Couples trip", Family: "Family trip", Friends: "Friends trip" };

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

export function formatDownloadedAt(date = new Date()) {
  const d = date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const t = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${d}, ${t}`;
}

// ---------- asset loading (browser) ----------

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return res.arrayBuffer();
}

function bufferToDataUrl(buffer, mime) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

async function loadImageAsset(url) {
  if (!url) return null;
  try {
    const buffer = await fetchBuffer(url);
    const isPng = /\.png(\?|$)/i.test(url) || /^data:image\/png/.test(url);
    const mime = isPng ? "image/png" : "image/jpeg";
    const dataUrl = bufferToDataUrl(buffer, mime);
    const size = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    return { dataUrl, format: isPng ? "PNG" : "JPEG", w: size?.w || 1, h: size?.h || 1 };
  } catch (err) {
    console.warn("PDF image skipped:", err);
    return null;
  }
}

export async function loadPdfAssets() {
  const [regular, bold, display, template, logo] = await Promise.all([
    fetchBuffer(regularUrl),
    fetchBuffer(boldUrl),
    fetchBuffer(displayUrl),
    loadImageAsset(templateUrl),
    loadImageAsset(brandLogoUrl),
  ]);
  return { fonts: { regular, bold, display }, template, logo };
}

// ---------- drawing ----------

function registerFont(doc, buffer, family, style) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  const file = `${family}-${style}.ttf`;
  doc.addFileToVFS(file, btoa(binary));
  doc.addFont(file, family, style);
}

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const lineH = (pt) => pt * PT * 1.35;

function dailyCost(p) {
  return p.Entry_Fee_INR + p.Activity_Cost_Min + p.HotelcostpernightINR_Min + p.FoodcostperdayINR_Min;
}

// shrink a single line of text until it fits `maxWidth` mm
function fitFontSize(doc, text, maxWidth, startPt, minPt) {
  let pt = startPt;
  doc.setFontSize(pt);
  while (pt > minPt && doc.getTextWidth(text) > maxWidth) {
    pt -= 0.5;
    doc.setFontSize(pt);
  }
  return pt;
}

function setFont(doc, family, style, pt, color) {
  doc.setFont(family, style);
  doc.setFontSize(pt);
  if (color) doc.setTextColor(...color);
}

function drawBackground(doc, assets) {
  const { width, height } = L.page;
  if (assets.template) {
    doc.addImage(assets.template.dataUrl, assets.template.format, 0, 0, width, height, "template", "FAST");
    return;
  }
  // no template file: plain parchment page with header / footer bands
  doc.setFillColor(240, 235, 222);
  doc.rect(0, 0, width, height, "F");
  doc.setFillColor(20, 26, 43);
  doc.rect(0, 0, width, 40, "F");
  doc.rect(0, 285, width, 12, "F");
  doc.setFillColor(242, 169, 60);
  doc.rect(0, 40, width, 1.4, "F");
}

function drawBrand(doc, assets) {
  const { logo, brandName } = L;
  if (assets.logo) {
    const ratio = assets.logo.w / assets.logo.h;
    const w = ratio >= 1 ? logo.size : logo.size * ratio;
    const h = ratio >= 1 ? logo.size / ratio : logo.size;
    doc.addImage(assets.logo.dataUrl, assets.logo.format, logo.x + (logo.size - w) / 2, logo.y + (logo.size - h) / 2, w, h, "logo", "FAST");
  }
  const x = assets.logo ? brandName.x : logo.x;
  setFont(doc, DISPLAY, "bold", brandName.fontSize, L.colors.headerText);
  const first = "Voyexa ";
  doc.text(first, x, brandName.y);
  const w = doc.getTextWidth(first);
  doc.setTextColor(242, 169, 60);
  doc.text("AI", x + w, brandName.y);
}

function drawFooters(doc, downloadedAt) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    setFont(doc, SANS, "normal", L.footer.fontSize, L.colors.footerText);
    doc.text(`${BRAND_NAME}  ·  Downloaded on ${downloadedAt}`, L.footer.leftX, L.footer.y);
    doc.text(`Page ${i} of ${total}`, L.footer.rightX, L.footer.y, { align: "right" });
  }
}

function drawInfoBlock(doc, { form, states, placeCount, totalDays }) {
  const { x, y, width } = L.info;
  const c = L.colors;
  const name = (form.travellerName || "").trim() || "Traveller";

  setFont(doc, DISPLAY, "bold", 20, c.body);
  doc.text(`${totalDays}-day itinerary`, x, y + 6.5);

  setFont(doc, SANS, "normal", 7.5, c.muted);
  doc.text("PREPARED FOR", x, y + 14.5);

  const pt = fitFontSize(doc, name, width - 40, 15, 9);
  setFont(doc, SANS, "bold", pt, c.body);
  doc.text(name, x, y + 20.5);
  const nameW = doc.getTextWidth(name);
  const group = GROUP_LABEL[form.suitableFor];
  if (group) {
    setFont(doc, SANS, "normal", 9, c.muted);
    doc.text(`·  ${group}`, x + nameW + 3, y + 20.5);
  }

  const cols = [
    ["TRAVEL MONTH", form.month ? MONTHS[form.month - 1] : "Flexible"],
    ["BUDGET / DAY", form.budgetPerDay ? money(form.budgetPerDay) : "—"],
    ["TRIP LENGTH", `${totalDays} day${totalDays === 1 ? "" : "s"}`],
    ["PLACES", `${placeCount} in ${states.length} state${states.length === 1 ? "" : "s"}`],
  ];
  const colW = width / cols.length;
  doc.setDrawColor(...c.line);
  doc.setLineWidth(0.3);
  doc.line(x, y + 26.5, x + width, y + 26.5);
  cols.forEach(([label, value], i) => {
    const cx = x + i * colW;
    setFont(doc, SANS, "normal", 7, c.muted);
    doc.text(label, cx, y + 32);
    const vpt = fitFontSize(doc, value, colW - 3, 10.5, 7);
    setFont(doc, SANS, "bold", vpt, c.body);
    doc.text(value, cx, y + 37.5);
  });
}

// One "unit" = something that must not be split across pages.
function buildUnits(doc, dayGroups, totalCost, s) {
  const c = L.colors;
  const W = L.content.width;
  const units = [];

  const padY = 2.4 * s;
  const padX = 4 * s;
  const rightColW = 32 * s;
  const gap = 1.8 * s;
  const namePt = 11 * s;
  const subPt = 8.5 * s;

  const rowUnit = (place, isFirstOfDay, group) => {
    const textW = W - 2 * padX - rightColW - 2;
    setFont(doc, SANS, "bold", namePt);
    const nameLines = doc.splitTextToSize(place.Place_Name, textW);
    setFont(doc, SANS, "normal", subPt);
    const subText = `${place.City}, ${place.State}  ·  ${place.Typical_Duration}`;
    const subLines = doc.splitTextToSize(subText, textW);
    const leftH = nameLines.length * lineH(namePt) + subLines.length * lineH(subPt);
    const rightH = lineH(namePt) + lineH(subPt);
    const rowH = Math.max(leftH, rightH) + 2 * padY;
    const accent = hexToRgb(ZONE_COLORS[place.Zone] || "#8B93A7");

    const headH = isFirstOfDay ? 10 * s + 1.5 : 0;
    return {
      h: headH + rowH + gap,
      draw(x, y) {
        let yy = y;
        if (isFirstOfDay) {
          setFont(doc, DISPLAY, "bold", 15 * s, c.body);
          doc.text(`Day ${group.day}`, x, yy + 6.5 * s, { baseline: "alphabetic" });
          const n = group.places.length;
          setFont(doc, SANS, "normal", 8.5 * s, c.muted);
          doc.text(`${n} place${n === 1 ? "" : "s"}`, x + W, yy + 6.5 * s, { align: "right" });
          doc.setDrawColor(...c.accent);
          doc.setLineWidth(0.5);
          doc.line(x, yy + 8.6 * s, x + W, yy + 8.6 * s);
          yy += headH;
        }
        // card: semi-transparent fill so it works on any template
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.6 }));
        doc.setFillColor(...c.cardFill);
        doc.rect(x, yy, W, rowH, "F");
        doc.restoreGraphicsState();
        doc.setDrawColor(...c.line);
        doc.setLineWidth(0.25);
        doc.rect(x, yy, W, rowH, "S");
        doc.setFillColor(...accent);
        doc.rect(x, yy, 1.3, rowH, "F");

        let ty = yy + padY;
        setFont(doc, SANS, "bold", namePt, c.body);
        nameLines.forEach((ln) => {
          doc.text(ln, x + padX, ty + namePt * PT * 0.95);
          ty += lineH(namePt);
        });
        setFont(doc, SANS, "normal", subPt, c.muted);
        subLines.forEach((ln) => {
          doc.text(ln, x + padX, ty + subPt * PT * 0.95);
          ty += lineH(subPt);
        });

        const rx = x + W - padX;
        setFont(doc, SANS, "bold", namePt, c.body);
        doc.text(`★ ${place.Popularity_Rating}`, rx, yy + padY + namePt * PT * 0.95, { align: "right" });
        setFont(doc, SANS, "normal", subPt, c.muted);
        doc.text(`from ${money(dailyCost(place))}/day`, rx, yy + padY + lineH(namePt) + subPt * PT * 0.95, { align: "right" });
      },
    };
  };

  dayGroups.forEach((group, gi) => {
    group.places.forEach((place, pi) => {
      const u = rowUnit(place, pi === 0, group);
      if (pi === 0 && gi > 0) {
        u.h += 3 * s; // extra breathing room between days
        const inner = u.draw;
        u.draw = (x, y) => inner(x, y + 3 * s);
      }
      units.push(u);
    });
  });

  const totalH = 12 * s;
  units.push({
    h: totalH + 2,
    draw(x, y) {
      doc.setDrawColor(...c.accent);
      doc.setLineWidth(0.5);
      doc.line(x, y + 2, x + W, y + 2);
      setFont(doc, SANS, "normal", 10 * s, c.body);
      doc.text("Estimated total daily cost", x, y + 2 + 7 * s);
      setFont(doc, DISPLAY, "bold", 15 * s, c.accent);
      doc.text(money(totalCost), x + W, y + 2 + 7.4 * s, { align: "right" });
    },
  });
  return units;
}

function paginate(units) {
  const { firstPageTop, nextPageTop, bottom } = L.content;
  const pages = [[]];
  let y = firstPageTop;
  units.forEach((u) => {
    if (y + u.h > bottom && pages[pages.length - 1].length > 0) {
      pages.push([]);
      y = nextPageTop;
    }
    pages[pages.length - 1].push({ unit: u, y });
    y += u.h;
  });
  return pages;
}

// Chooses the text scale: shrink to fit one page, else flow onto more pages.
function chooseLayout(doc, dayGroups, totalCost) {
  const { min, multiPage, step } = L.fit;
  for (let s = 1; s >= min - 1e-9; s -= step) {
    const pages = paginate(buildUnits(doc, dayGroups, totalCost, s));
    if (pages.length === 1) return { scale: s, pages };
  }
  return { scale: multiPage, pages: paginate(buildUnits(doc, dayGroups, totalCost, multiPage)) };
}

// input: { form, dayGroups, totalCost, downloadedAt? }   assets: from loadPdfAssets()
export async function buildItineraryPdf(input, assets, JsPDF) {
  const { form, dayGroups, totalCost } = input;
  const downloadedAt = input.downloadedAt || formatDownloadedAt();

  const doc = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  registerFont(doc, assets.fonts.regular, SANS, "normal");
  registerFont(doc, assets.fonts.bold, SANS, "bold");
  registerFont(doc, assets.fonts.display, DISPLAY, "bold");

  const placeCount = dayGroups.reduce((n, g) => n + g.places.length, 0);
  const states = [...new Set(dayGroups.flatMap((g) => g.places.map((p) => p.State)))];
  const { pages, scale } = chooseLayout(doc, dayGroups, totalCost);

  pages.forEach((items, i) => {
    if (i > 0) doc.addPage();
    drawBackground(doc, assets);
    drawBrand(doc, assets);
    if (i === 0) {
      drawInfoBlock(doc, { form, states, placeCount, totalDays: form.numDays || dayGroups.length || 1 });
    }
    items.forEach(({ unit, y }) => unit.draw(L.content.x, y));
  });

  drawFooters(doc, downloadedAt);
  doc.__voyexaScale = scale; // exposed for tests / debugging
  return doc;
}

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function downloadItineraryPdf(input) {
  const [{ jsPDF }, assets] = await Promise.all([import("jspdf"), loadPdfAssets()]);
  const doc = await buildItineraryPdf(input, assets, jsPDF);
  const who = slug(input.form.travellerName || "trip");
  const day = new Date().toISOString().slice(0, 10);
  doc.save(`Voyexa-AI-itinerary-${who}-${day}.pdf`);
}
