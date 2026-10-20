/** Font library is requested only when a user enters the status editor. */
export function loadEditorFonts() {
  if (document.getElementById("madar-editor-fonts")) return;
  const link = document.createElement("link");
  link.id = "madar-editor-fonts";
  link.rel = "stylesheet";
  const families = ["Tajawal:wght@400;500;700", "Reem Kufi:wght@400;600;700", "Amiri:wght@400;700", "Changa:wght@400;600;800", "Aref Ruqaa:wght@400;700", "Lemonada:wght@400;600;700", "El Messiri:wght@400;600;700", "Markazi Text:wght@400;600;700", "Lateef:wght@400;700", "Almarai:wght@400;700;800", "Blaka", "Blaka Ink", "Rakkas", "Jomhuria", "Marhey:wght@400;600;700", "Kufam:wght@400;700;900", "Scheherazade New:wght@400;700", "Noto Nastaliq Urdu:wght@400;700"];
  link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f.replaceAll(" ", "+")}`).join("&")}&display=swap`;
  document.head.appendChild(link);
}