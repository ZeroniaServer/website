import { useEffect, useState } from "react";
import { resolveSlug } from "./games";

// Path routing: home is "/", a game page is "/<slug>". Aliases resolve to
// their canonical slug so the whole app only ever sees canonical slugs.
function rawSlug(): string {
  const segment = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  return decodeURIComponent(segment);
}

export function currentSlug(): string {
  return resolveSlug(rawSlug());
}

// Canonicalize alias URLs and trailing slashes once on load.
{
  const canonical = currentSlug();
  const path = canonical ? `/${canonical}` : "/";
  if (window.location.pathname !== path)
    window.history.replaceState(null, "", path);
}

export function useRoute(): string {
  const [slug, setSlug] = useState(currentSlug);
  useEffect(() => {
    const onChange = () => {
      setSlug(currentSlug());
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);
  return slug;
}

// Full page load so the navbar/footer recompute their per-page variant.
export function goToPage(route: string) {
  const slug = resolveSlug(route.replace(/^\//, ""));
  if (currentSlug() === slug) return;
  window.location.href = slug ? `/${slug}` : "/";
}

// On a game page the section won't exist, so stash the target and return home.
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  sessionStorage.setItem("pendingScroll", id);
  window.location.href = "/";
}

export function consumePendingScroll() {
  const id = sessionStorage.getItem("pendingScroll");
  if (!id) return;
  sessionStorage.removeItem("pendingScroll");
  requestAnimationFrame(() =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}
