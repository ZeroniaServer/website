import { useEffect, useState } from "react";

// Hash routing (static build, relative base): home is the empty hash, a game
// page is "#/<slug>".
export function currentSlug(): string {
  const m = window.location.hash.match(/^#\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : "";
}

export function useRoute(): string {
  const [slug, setSlug] = useState(currentSlug);
  useEffect(() => {
    const onChange = () => {
      setSlug(currentSlug());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return slug;
}

// Reload so the navbar/footer recompute their per-page variant from the hash.
export function goToPage(route: string) {
  if (currentSlug() === route.replace(/^\//, "")) return;
  window.location.hash = route;
  window.location.reload();
}

// On a game page the section won't exist, so stash the target and return home.
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  sessionStorage.setItem("pendingScroll", id);
  if (window.location.hash) window.location.hash = "";
  else window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function consumePendingScroll() {
  const id = sessionStorage.getItem("pendingScroll");
  if (!id) return;
  sessionStorage.removeItem("pendingScroll");
  requestAnimationFrame(() =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}
