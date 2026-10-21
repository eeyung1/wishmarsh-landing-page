/**
 * Wishmarsh — landing page application logic.
 *
 * Responsibilities
 * ----------------
 *  - Render the dynamic sections (categories, wish wall collage, steps)
 *    from strongly typed data served by the API service layer.
 *  - Provide every icon and doodle as inline SVG (no icon fonts).
 *  - Wire up the navigation, auth modal, CTA flow, toast and reveal
 *    animations.
 */

import {
  WishmarshApi,
  MOCK_CATEGORIES,
  MOCK_WISHES,
  type EventCategory,
  type WishNote,
} from "./api";

/* ===========================================================================
 * Types
 * ======================================================================== */

/** Every inline SVG icon the page can render. */
export type IconKey =
  | "calendar-heart"
  | "heart"
  | "ribbon"
  | "gift"
  | "sunburst"
  | "star"
  | "calendar"
  | "chain"
  | "heart-bubble"
  | "sparkles";

/** UI model for a category card in the categories strip. */
export interface Category {
  title: string;
  description: string;
  icon: IconKey;
}

/** UI model for one of the four "How it works" steps. */
export interface Step {
  stepNumber: number;
  title: string;
  description: string;
  icon: IconKey;
}

/** UI model for a sticky note inside the collage wish wall. */
export interface WishWallNote {
  id: string;
  author: string;
  message: string;
  color: "pink" | "yellow" | "dark" | "white";
  rotation: number;
}

/** UI model for a polaroid photo card inside the collage wish wall. */
export interface WishWallPhoto {
  id: string;
  author: string;
  src?: string;
  rotation: number;
  hue: number;
}

/* ===========================================================================
 * Static content
 * ======================================================================== */

const STEPS: Step[] = [
  {
    stepNumber: 1,
    title: "Create Event",
    description: "Add your details and choose a theme.",
    icon: "calendar",
  },
  {
    stepNumber: 2,
    title: "Share Link",
    description: "Send it to your friends and family.",
    icon: "chain",
  },
  {
    stepNumber: 3,
    title: "Collect Wishes",
    description: "Messages, gifts and goodwill.",
    icon: "heart-bubble",
  },
  {
    stepNumber: 4,
    title: "Celebrate",
    description: "Relive the moments forever.",
    icon: "sparkles",
  },
];

/** Icon key used for each mock category, keyed by category slug. */
const CATEGORY_ICONS: Record<string, IconKey> = {
  birthdays: "calendar-heart",
  anniversaries: "heart",
  condolences: "ribbon",
  "baby-showers": "gift",
  "get-wells": "sunburst",
  congratulations: "star",
};

/* ===========================================================================
 * Inline SVG icon library
 * ======================================================================== */

const ICONS: Record<IconKey, string> = {
  "calendar-heart": `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" stroke="currentColor" stroke-width="1.7"/>
    <path d="M3.5 9.8h17M8 3.2v3.8M16 3.2v3.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M12 19.4s-3.3-2.1-3.3-4.4a1.85 1.85 0 0 1 3.3-1.2 1.85 1.85 0 0 1 3.3 1.2c0 2.3-3.3 4.4-3.3 4.4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 20.3S4 14.8 4 9.5A4.55 4.55 0 0 1 12 6.6 4.55 4.55 0 0 1 20 9.5c0 5.3-8 10.8-8 10.8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>`,
  ribbon: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 12c-2.6-3.4-5.6-4.6-7.2-3.2S2.4 14 4.4 15s6-1.4 7.6-3z"/>
      <path d="M12 12c2.6-3.4 5.6-4.6 7.2-3.2S21.6 14 19.6 15s-6-1.4-7.6-3z"/>
      <path d="M12 12c-1.4 3.2-2.8 5.4-4.4 8.6M12 12c1.4 3.2 2.8 5.4 4.4 8.6"/>
      <circle cx="12" cy="11.4" r="1.5"/>
    </g>
  </svg>`,
  gift: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.4" y="9.2" width="17.2" height="11.4" rx="2.2" stroke="currentColor" stroke-width="1.7"/>
    <path d="M2.8 9.2h18.4M12 9.2v11.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M12 9.2S10.6 4 8.2 4a2.4 2.4 0 0 0 0 5.2M12 9.2s1.4-5.2 3.8-5.2a2.4 2.4 0 0 1 0 5.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  sunburst: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.1" stroke="currentColor" stroke-width="1.7"/>
    <g stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
      <path d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6M5.1 5.1l1.9 1.9M17 17l1.9 1.9M18.9 5.1 17 7M7 17l-1.9 1.9"/>
    </g>
  </svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m12 3.3 2.75 5.65 6.05.85-4.4 4.3 1.05 6.15L12 17.25l-5.45 3-1.05-6.15-4.4-4.3 6.05-.85z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" stroke="currentColor" stroke-width="1.7"/>
    <path d="M3.5 9.8h17M8 3.2v3.8M16 3.2v3.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M8 13h2M14 13h2M8 16.6h2M14 16.6h2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg>`,
  chain: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.4 13.6a4.1 4.1 0 0 0 5.8 0l2.4-2.4a4.1 4.1 0 0 0-5.8-5.8l-1.4 1.4"/>
      <path d="M13.6 10.4a4.1 4.1 0 0 0-5.8 0l-2.4 2.4a4.1 4.1 0 1 0 5.8 5.8l1.4-1.4"/>
    </g>
  </svg>`,
  "heart-bubble": `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20.5 11.4c0 3.8-3.8 6.9-8.5 6.9-.9 0-1.7-.1-2.5-.3L4.6 19.4l1.1-3.1a6.4 6.4 0 0 1-2.2-4.9C3.5 7.6 7.3 4.5 12 4.5s8.5 3.1 8.5 6.9z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M12 14.1s-2.7-1.7-2.7-3.5a1.45 1.45 0 0 1 2.7-.9 1.45 1.45 0 0 1 2.7.9c0 1.8-2.7 3.5-2.7 3.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.2 3.4c1.2 4.1 2.7 5.6 6.8 6.8-4.1 1.2-5.6 2.7-6.8 6.8-1.2-4.1-2.7-5.6-6.8-6.8 4.1-1.2 5.6-2.7 6.8-6.8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M17.6 13.2c.6 2.1 1.3 2.8 3.4 3.4-2.1.6-2.8 1.3-3.4 3.4-.6-2.1-1.3-2.8-3.4-3.4 2.1-.6 2.8-1.3 3.4-3.4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,
};

/* ===========================================================================
 * Helpers
 * ======================================================================== */

/** Escape a string before it is injected into markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Look up an inline SVG by key, falling back to the heart glyph. */
function icon(key: IconKey): string {
  return ICONS[key] ?? ICONS.heart;
}

/** Deterministic pseudo-random value derived from a string. */
function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

let avatarSeed = 0;

/** Build an inline SVG avatar placeholder for the polaroid thumbnails. */
function avatarSvg(name: string, hue: number): string {
  avatarSeed += 1;
  const gradientId = `avatar-gradient-${avatarSeed}`;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return `<svg viewBox="0 0 80 80" role="img" aria-label="${escapeHtml(name)}">
    <defs>
      <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue} 72% 88%)"/>
        <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 60% 72%)"/>
      </linearGradient>
    </defs>
    <rect width="80" height="80" fill="url(#${gradientId})"/>
    <circle cx="40" cy="31" r="14" fill="rgba(255,255,255,0.75)"/>
    <path d="M12 80c0-16 12.6-25 28-25s28 9 28 25z" fill="rgba(255,255,255,0.75)"/>
    <text x="40" y="73" text-anchor="middle" font-family="'Caveat', cursive" font-size="16"
      fill="hsl(${hue} 55% 30%)">${escapeHtml(initials || "W")}</text>
  </svg>`;
}

/* ===========================================================================
 * Rendering — categories
 * ======================================================================== */

/** Convert an API category into the UI model used by the renderer. */
function toCategory(category: EventCategory): Category {
  return {
    title: category.title,
    description: category.description,
    icon: CATEGORY_ICONS[category.slug] ?? "heart",
  };
}

function renderCategories(container: HTMLElement, categories: Category[]): void {
  container.innerHTML = categories
    .map(
      (category, index) => `
      <article class="category" data-reveal style="--reveal-delay:${index * 60}ms">
        <span class="category__icon">${icon(category.icon)}</span>
        <h3 class="category__title">${escapeHtml(category.title)}</h3>
        <p class="category__desc">${escapeHtml(category.description)}</p>
      </article>`,
    )
    .join("");
}

/* ===========================================================================
 * Rendering — wish wall collage
 * ======================================================================== */

/** Map an API wish note onto the collage UI model. */
function toWishWallNote(note: WishNote): WishWallNote {
  const colorMap: Record<WishNote["noteColor"], WishWallNote["color"]> = {
    pink: "pink",
    yellow: "yellow",
    dark: "dark",
    white: "white",
  };

  return {
    id: note.id,
    author: note.author,
    message: note.message,
    color: colorMap[note.noteColor] ?? "pink",
    rotation: note.rotationDeg,
  };
}

/** Split the API payload into sticky notes and polaroid photo cards. */
function partitionWishes(notes: WishNote[]): {
  notes: WishWallNote[];
  photos: WishWallPhoto[];
} {
  const notesOnly: WishWallNote[] = [];
  const photos: WishWallPhoto[] = [];

  for (const note of notes) {
    const isPhoto = Boolean(note.photoUrl);
    if (isPhoto) {
      photos.push({
        id: note.id,
        author: note.author,
        ...(note.photoUrl ? { src: note.photoUrl } : {}),
        rotation: note.rotationDeg,
        hue: hashString(note.id) % 360,
      });
    } else {
      notesOnly.push(toWishWallNote(note));
    }
  }

  return { notes: notesOnly, photos };
}

function renderNotes(container: HTMLElement, notes: WishWallNote[]): void {
  container.innerHTML = notes
    .map((note, index) => {
      const position = `note--${(index % 5) + 1}`;
      // Only show a separate byline when the message does not already name the author.
      const showAuthor =
        note.author.length > 0 &&
        !note.message.toLowerCase().includes(note.author.toLowerCase());

      return `
      <article class="note note--${note.color} ${position}" data-reveal
        style="--rotation:${note.rotation}deg; --reveal-delay:${index * 80}ms"
        aria-label="Wish from ${escapeHtml(note.author || "a guest")}">
        <p class="note__message">${escapeHtml(note.message)}</p>
        ${showAuthor ? `<p class="note__author">— ${escapeHtml(note.author)}</p>` : ""}
      </article>`;
    })
    .join("");
}

function renderPhotos(container: HTMLElement, photos: WishWallPhoto[]): void {
  container.innerHTML = photos
    .map((photo, index) => {
      const position = `polaroid--${(index % 4) + 1}`;
      const image = photo.src
        ? `<img src="${escapeHtml(photo.src)}" alt="A memory shared on the Wishmarsh wall" width="240" height="180" loading="lazy" decoding="async" />`
        : avatarSvg(photo.author || "Wishmarsh", photo.hue);

      return `
      <figure class="polaroid ${position}" data-reveal
        style="--rotation:${photo.rotation}deg; --reveal-delay:${index * 100}ms">
        <div class="polaroid__img">${image}</div>
      </figure>`;
    })
    .join("");
}

/* ===========================================================================
 * Rendering — steps
 * ======================================================================== */

function renderSteps(container: HTMLElement, steps: Step[]): void {
  container.innerHTML = steps
    .map(
      (step, index) => `
      <li class="step" data-reveal style="--reveal-delay:${index * 90}ms">
        <span class="step__badge" aria-hidden="true">${step.stepNumber}</span>
        <div class="step__body">
          <span class="step__icon">${icon(step.icon)}</span>
          <h3 class="step__title">
            <span class="visually-hidden">Step ${step.stepNumber}: </span>${escapeHtml(step.title)}
          </h3>
          <p class="step__desc">${escapeHtml(step.description)}</p>
        </div>
      </li>`,
    )
    .join("");
}

/* ===========================================================================
 * Interactions
 * ======================================================================== */

/** Toggle the mobile navigation panel. */
function initNavigation(): void {
  const toggle = document.querySelector<HTMLButtonElement>(".nav__toggle");
  const menu = document.querySelector<HTMLElement>(".nav__menu");
  if (!toggle || !menu) return;

  const setOpen = (open: boolean): void => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu",
    );
    menu.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) setOpen(false);
  });
}

/** Show a transient message at the bottom of the viewport. */
function showToast(message: string): void {
  const toast = document.querySelector<HTMLElement>(".toast");
  if (!toast) return;

  const text = toast.querySelector<HTMLElement>(".toast__message");
  if (text) text.textContent = message;

  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
}

/** Open the authentication modal in either "login" or "register" mode. */
function initAuthModal(): void {
  const modal = document.querySelector<HTMLElement>(".modal");
  const panelTitle = modal?.querySelector<HTMLElement>(".modal__title");
  const panelText = modal?.querySelector<HTMLElement>(".modal__text");
  const form = modal?.querySelector<HTMLFormElement>(".auth-form");
  const emailInput = modal?.querySelector<HTMLInputElement>("#auth-email");
  const passwordInput = modal?.querySelector<HTMLInputElement>("#auth-password");
  const nameField = modal?.querySelector<HTMLElement>(".field--name");
  const nameInput = modal?.querySelector<HTMLInputElement>("#auth-name");
  const submitLabel = modal?.querySelector<HTMLElement>(".auth-form__submit span");
  const toggleLink = modal?.querySelector<HTMLAnchorElement>(".auth-switch");
  const closeButtons = modal?.querySelectorAll<HTMLElement>("[data-close-modal]");

  if (!modal || !panelTitle || !panelText || !form) return;

  let mode: "login" | "register" = "login";
  let lastFocused: HTMLElement | null = null;

  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  const applyMode = (next: "login" | "register"): void => {
    mode = next;
    const isLogin = next === "login";
    panelTitle.textContent = isLogin ? "Welcome back" : "Create your account";
    panelText.textContent = isLogin
      ? "Log in to manage your events and wish walls."
      : "Sign up to create your first wish wall in minutes.";
    if (submitLabel) submitLabel.textContent = isLogin ? "Log in" : "Sign up";
    if (nameField) nameField.hidden = isLogin;
    if (toggleLink) {
      toggleLink.textContent = isLogin
        ? "New to Wishmarsh? Sign up"
        : "Already have an account? Log in";
    }
  };

  const open = (next: "login" | "register"): void => {
    applyMode(next);
    lastFocused = document.activeElement as HTMLElement | null;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    window.setTimeout(() => emailInput?.focus(), 180);
  };

  const close = (): void => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    lastFocused?.focus();
  };

  /** Keep keyboard focus inside the dialog while it is open. */
  const trapFocus = (event: KeyboardEvent): void => {
    if (event.key !== "Tab" || !modal.classList.contains("is-open")) return;

    const focusables = Array.from(
      modal.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter((element) => element.offsetParent !== null);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.querySelectorAll<HTMLElement>("[data-auth]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open(trigger.dataset.auth === "register" ? "register" : "login");
    });
  });

  closeButtons?.forEach((button) => button.addEventListener("click", close));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) close();
    trapFocus(event);
  });

  toggleLink?.addEventListener("click", (event) => {
    event.preventDefault();
    applyMode(mode === "login" ? "register" : "login");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim() ?? "";
    const password = passwordInput?.value ?? "";
    const name = nameInput?.value.trim() ?? "";

    if (!email || !password) {
      showToast("Please enter your email and password.");
      return;
    }

    const submitButton = form.querySelector<HTMLButtonElement>(
      ".auth-form__submit",
    );
    if (submitButton) submitButton.disabled = true;

    try {
      const result =
        mode === "login"
          ? await WishmarshApi.login({ email, password })
          : await WishmarshApi.register({
              email,
              password,
              ...(name ? { name } : {}),
            });

      close();
      showToast(
        WishmarshApi.lastCallUsedFallback
          ? `Welcome, ${result.user.name}! (demo mode)`
          : `Welcome, ${result.user.name}!`,
      );
      form.reset();
    } catch {
      showToast("Something went wrong. Please try again.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

/** Wire every "Create an event" CTA to the event creation endpoint. */
function initCreateEventFlow(): void {
  document
    .querySelectorAll<HTMLElement>("[data-create-event]")
    .forEach((trigger) => {
      trigger.addEventListener("click", async (event) => {
        event.preventDefault();

        const original = trigger.getAttribute("data-original-label");
        if (!original) trigger.setAttribute("data-original-label", trigger.textContent ?? "");
        trigger.textContent = "Creating…";

        try {
          const response = await WishmarshApi.createEvent({
            source: trigger.dataset.createEvent ?? "landing-page",
            ...(trigger.dataset.category
              ? { categorySlug: trigger.dataset.category }
              : {}),
          });

          if (WishmarshApi.lastCallUsedFallback) {
            showToast(
              `Demo event ${response.eventId} created — connect the API to continue.`,
            );
          } else {
            window.location.assign(response.redirectUrl);
          }
        } catch {
          showToast("We couldn't start your event. Please try again.");
        } finally {
          trigger.textContent = original ?? "Create an event →";
        }
      });
    });
}

/** Smooth-scroll to in-page anchors with a nav-aware offset. */
function initSmoothScroll(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;

      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      event.preventDefault();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top = target.getBoundingClientRect().top + window.scrollY - 24;

      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", href);
    });
  });
}

/** Keep the footer copyright year current. */
function initYear(): void {
  const slot = document.querySelector<HTMLElement>("[data-year]");
  if (slot) slot.textContent = String(new Date().getFullYear());
}

/* ===========================================================================
 * Boot
 * ======================================================================== */

/** Shared observer so freshly rendered nodes can be observed later on. */
let revealObserver: IntersectionObserver | null = null;
const observedElements = new WeakSet<Element>();

/** Observe any not-yet-observed reveal elements. */
function observeRevealElements(): void {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-reveal]"),
  ).filter((element) => !observedElements.has(element));

  if (elements.length === 0) return;

  if (
    !revealObserver ||
    typeof IntersectionObserver === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  elements.forEach((element) => {
    observedElements.add(element);
    revealObserver?.observe(element);
  });
}

/** Fade sections in as they scroll into view. */
function initRevealObserver(): void {
  if (
    typeof IntersectionObserver !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
  }

  observeRevealElements();
}

async function loadCategories(): Promise<void> {
  const container = document.querySelector<HTMLElement>("[data-categories]");
  if (!container) return;

  const { data } = await WishmarshApi.getCategories();
  renderCategories(
    container,
    data.map((category: EventCategory) => toCategory(category)),
  );
  observeRevealElements();
}

async function loadWishWall(): Promise<void> {
  const notesContainer = document.querySelector<HTMLElement>("[data-notes]");
  const photosContainer = document.querySelector<HTMLElement>("[data-photos]");
  if (!notesContainer || !photosContainer) return;

  const { data } = await WishmarshApi.getSampleWishes();
  const { notes, photos } = partitionWishes(data);

  renderNotes(notesContainer, notes);
  renderPhotos(photosContainer, photos);
  observeRevealElements();
}

function initSteps(): void {
  const container = document.querySelector<HTMLElement>("[data-steps]");
  if (!container) return;
  renderSteps(container, STEPS);
}

function boot(): void {
  initNavigation();
  initAuthModal();
  initCreateEventFlow();
  initSteps();
  initSmoothScroll();
  initYear();

  // Render the bundled mock data straight away so the page is never empty
  // (and never blocked on a slow or unreachable API).
  const categoriesContainer = document.querySelector<HTMLElement>(
    "[data-categories]",
  );
  const notesContainer = document.querySelector<HTMLElement>("[data-notes]");
  const photosContainer = document.querySelector<HTMLElement>("[data-photos]");

  if (categoriesContainer) {
    renderCategories(
      categoriesContainer,
      MOCK_CATEGORIES.map((category) => toCategory(category)),
    );
  }

  if (notesContainer && photosContainer) {
    const { notes, photos } = partitionWishes(MOCK_WISHES);
    renderNotes(notesContainer, notes);
    renderPhotos(photosContainer, photos);
  }

  initRevealObserver();

  // Refresh with live data as soon as the API answers.
  void Promise.all([loadCategories(), loadWishWall()]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
