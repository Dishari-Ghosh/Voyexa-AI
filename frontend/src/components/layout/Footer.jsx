import { brandLogoUrl } from "../../utils/brand.js";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 font-display text-text">
            {brandLogoUrl && <img src={brandLogoUrl} alt="" className="h-5 w-5 object-contain" />}
            Voyexa AI
          </p>
          <p>1,163 places across 36 states and union territories.</p>
        </div>
      </div>
    </footer>
  );
}
