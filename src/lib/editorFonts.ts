// Inter and Playfair Display are only offered as font choices in the blog editor and used
// by blog posts written with them, so they load here instead of blocking every page.
const HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap";

if (typeof document !== "undefined" && !document.querySelector(`link[href="${HREF}"]`)) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = HREF;
  document.head.appendChild(link);
}

export {};
