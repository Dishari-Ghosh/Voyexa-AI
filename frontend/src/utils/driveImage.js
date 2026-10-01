// Converts a Google Drive share link into a URL that actually renders as
// an <img>. Drive share links (.../file/d/FILE_ID/view or ?id=FILE_ID)
// don't work directly in an <img src>; they need the /uc?export=view form.
export function toDriveImageUrl(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Already a direct image URL or a non-Drive URL - use as-is.
  if (!trimmed.includes("drive.google.com")) return trimmed;

  const fileIdMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (!fileIdMatch) return trimmed; // couldn't parse, fall back to raw input

  const fileId = fileIdMatch[1];
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
