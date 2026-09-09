import { useEffect, useState } from "react";
import { resolveSlug } from "./games";

// Get the page slug.
function rawSlug(): string {
  const segment = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  return decodeURIComponent(segment);
}

export function currentSlug(): string {
  return resolveSlug(rawSlug());
}

// Preserve run suffixes.
function runPathSuffix(): string {
  const [, run] = window.location.pathname.split("/").filter(Boolean);
  return run?.startsWith("run=") ? `/${run}` : "";
}

// Normalize the page URL.
{
  const canonical = currentSlug();
  const path = canonical ? `/${canonical}${runPathSuffix()}` : "/";
  if (window.location.pathname !== path)
    window.history.replaceState(null, "", `${path}${window.location.search}${window.location.hash}`);
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

// Reload for page styling.
export function goToPage(route: string) {
  const slug = resolveSlug(route.replace(/^\//, ""));
  if (currentSlug() === slug) return;
  window.location.href = slug ? `/${slug}` : "/";
}

// Save the home section target.
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
