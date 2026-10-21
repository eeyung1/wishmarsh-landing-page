"use strict";
(() => {
  // api.ts
  var MOCK_CATEGORIES = [
    {
      id: "cat_birthdays",
      slug: "birthdays",
      title: "Birthdays",
      description: "Celebrate the big moments",
      icon: "calendar-heart"
    },
    {
      id: "cat_anniversaries",
      slug: "anniversaries",
      title: "Anniversaries",
      description: "Mark your special days",
      icon: "heart"
    },
    {
      id: "cat_condolences",
      slug: "condolences",
      title: "Condolences",
      description: "Share support and love",
      icon: "ribbon"
    },
    {
      id: "cat_baby_showers",
      slug: "baby-showers",
      title: "Baby Showers",
      description: "Welcome the little ones",
      icon: "gift"
    },
    {
      id: "cat_get_wells",
      slug: "get-wells",
      title: "Get Wells",
      description: "Lift spirits with kind wishes",
      icon: "sunburst"
    },
    {
      id: "cat_congratulations",
      slug: "congratulations",
      title: "Congratulations",
      description: "Cheer on new beginnings",
      icon: "star"
    }
  ];
  var MOCK_WISHES = [
    {
      id: "wish_tunde",
      author: "Tunde",
      message: "Happy Birthday \u2013 Tunde! \u2661",
      noteColor: "pink",
      rotationDeg: -6
    },
    {
      id: "wish_vibes",
      author: "",
      message: "Good Vibes Only! \u2661",
      noteColor: "yellow",
      rotationDeg: 4
    },
    {
      id: "wish_mama",
      author: "Mama",
      message: "God's favour always... \u2013 Mama \u2661",
      noteColor: "dark",
      rotationDeg: -3
    },
    {
      id: "wish_femi",
      author: "Femi",
      message: "You are loved!",
      noteColor: "white",
      rotationDeg: 7
    },
    {
      id: "wish_cousin",
      author: "Your cousin",
      message: "Huge congratulations!",
      noteColor: "white",
      rotationDeg: -8
    }
  ];
  var REQUEST_TIMEOUT_MS = 6e3;
  function resolveBaseUrl() {
    const fromEnv = typeof process !== "undefined" && process.env ? process.env["API_BASE_URL"] : void 0;
    return fromEnv && fromEnv.length > 0 ? fromEnv : "/api";
  }
  var _WishmarshApi = class _WishmarshApi {
    /** Base URL every request is issued against. */
    static getBaseUrl() {
      return _WishmarshApi.baseUrl;
    }
    /** Allows the host app to point the client at another environment. */
    static setBaseUrl(baseUrl) {
      _WishmarshApi.baseUrl = baseUrl.replace(/\/$/, "");
    }
    /* ------------------------------------------------------------------ */
    /* Events                                                             */
    /* ------------------------------------------------------------------ */
    /**
     * Initialise an event creation flow.
     * POST /api/events
     */
    static async createEvent(payload = {}) {
      try {
        const data = await _WishmarshApi.request(
          "/events",
          { method: "POST", body: JSON.stringify(payload) }
        );
        _WishmarshApi.lastCallUsedFallback = false;
        return data;
      } catch {
        _WishmarshApi.lastCallUsedFallback = true;
        return { eventId: "demo-123", redirectUrl: "/create" };
      }
    }
    /* ------------------------------------------------------------------ */
    /* Categories                                                         */
    /* ------------------------------------------------------------------ */
    /**
     * Fetch the event categories shown in the categories strip.
     * GET /api/categories
     */
    static async getCategories() {
      try {
        const data = await _WishmarshApi.request("/categories", {
          method: "GET"
        });
        _WishmarshApi.lastCallUsedFallback = false;
        return { data, isFallback: false };
      } catch {
        _WishmarshApi.lastCallUsedFallback = true;
        return { data: MOCK_CATEGORIES, isFallback: true };
      }
    }
    /* ------------------------------------------------------------------ */
    /* Wishes                                                             */
    /* ------------------------------------------------------------------ */
    /**
     * Fetch sample wish cards for the collage wish wall.
     * GET /api/wishes/sample
     */
    static async getSampleWishes() {
      try {
        const data = await _WishmarshApi.request("/wishes/sample", {
          method: "GET"
        });
        _WishmarshApi.lastCallUsedFallback = false;
        return { data, isFallback: false };
      } catch {
        _WishmarshApi.lastCallUsedFallback = true;
        return { data: MOCK_WISHES, isFallback: true };
      }
    }
    /* ------------------------------------------------------------------ */
    /* Authentication                                                     */
    /* ------------------------------------------------------------------ */
    /**
     * Authenticate an existing user.
     * POST /api/auth/login
     */
    static async login(payload) {
      var _a;
      try {
        const data = await _WishmarshApi.request("/auth/login", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        _WishmarshApi.lastCallUsedFallback = false;
        return data;
      } catch {
        _WishmarshApi.lastCallUsedFallback = true;
        return {
          token: "demo-token",
          user: {
            id: "demo-user",
            name: (_a = payload.email.split("@")[0]) != null ? _a : "Friend",
            email: payload.email
          }
        };
      }
    }
    /**
     * Register a new user.
     * POST /api/auth/register
     */
    static async register(payload) {
      var _a, _b;
      try {
        const data = await _WishmarshApi.request("/auth/register", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        _WishmarshApi.lastCallUsedFallback = false;
        return data;
      } catch {
        _WishmarshApi.lastCallUsedFallback = true;
        return {
          token: "demo-token",
          user: {
            id: "demo-user",
            name: (_b = (_a = payload.name) != null ? _a : payload.email.split("@")[0]) != null ? _b : "Friend",
            email: payload.email
          }
        };
      }
    }
    /* ------------------------------------------------------------------ */
    /* Transport                                                          */
    /* ------------------------------------------------------------------ */
    /** Issue a JSON request with a timeout, throwing on any failure. */
    static async request(path, init = {}) {
      var _a;
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(`${_WishmarshApi.baseUrl}${path}`, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(_a = init.headers) != null ? _a : {}
          },
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`Wishmarsh API request failed: ${response.status}`);
        }
        return await response.json();
      } finally {
        window.clearTimeout(timer);
      }
    }
  };
  _WishmarshApi.baseUrl = resolveBaseUrl();
  /** `true` when the most recent call fell back to local mock data. */
  _WishmarshApi.lastCallUsedFallback = false;
  var WishmarshApi = _WishmarshApi;

  // main.ts
  var STEPS = [
    {
      stepNumber: 1,
      title: "Create Event",
      description: "Add your details and choose a theme.",
      icon: "calendar-plus"
    },
    {
      stepNumber: 2,
      title: "Share Link",
      description: "Send it to your friends and family.",
      icon: "share"
    },
    {
      stepNumber: 3,
      title: "Collect Wishes",
      description: "Messages, gifts and goodwill.",
      icon: "inbox"
    },
    {
      stepNumber: 4,
      title: "Celebrate",
      description: "Relive the moments forever.",
      icon: "sparkle"
    }
  ];
  var CATEGORY_ICONS = {
    birthdays: "calendar-heart",
    anniversaries: "heart",
    condolences: "ribbon",
    "baby-showers": "gift",
    "get-wells": "sunburst",
    congratulations: "star"
  };
  var ICONS = {
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
    "calendar-plus": `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" stroke="currentColor" stroke-width="1.7"/>
    <path d="M3.5 9.8h17M8 3.2v3.8M16 3.2v3.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M12 13v5.4M9.3 15.7h5.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg>`,
    share: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="18" cy="5.8" r="2.6" stroke="currentColor" stroke-width="1.7"/>
    <circle cx="6" cy="12" r="2.6" stroke="currentColor" stroke-width="1.7"/>
    <circle cx="18" cy="18.2" r="2.6" stroke="currentColor" stroke-width="1.7"/>
    <path d="m8.3 10.8 7.4-3.8M8.3 13.2l7.4 3.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg>`,
    inbox: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3.4 13.4h4.1l1.4 2.7h6.2l1.4-2.7h4.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.4 13.4 6 5.7a2 2 0 0 1 1.9-1.4h8.2A2 2 0 0 1 18 5.7l2.6 7.7v4a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>`,
    sparkle: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.4 3.4c1.5 5.1 3.4 7 8.5 8.6-5.1 1.5-7 3.4-8.5 8.6-1.5-5.1-3.4-7-8.5-8.6 5.1-1.5 7-3.4 8.5-8.6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M18.6 2.6v3M17.1 4.1h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`
  };
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function icon(key) {
    var _a;
    return (_a = ICONS[key]) != null ? _a : ICONS.heart;
  }
  function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  }
  var avatarSeed = 0;
  function avatarSvg(name, hue) {
    avatarSeed += 1;
    const gradientId = `avatar-gradient-${avatarSeed}`;
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
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
  function toCategory(category) {
    var _a;
    return {
      title: category.title,
      description: category.description,
      icon: (_a = CATEGORY_ICONS[category.slug]) != null ? _a : "heart"
    };
  }
  function renderCategories(container, categories) {
    container.innerHTML = categories.map(
      (category, index) => `
      <article class="category" data-reveal style="--reveal-delay:${index * 60}ms">
        <span class="category__icon">${icon(category.icon)}</span>
        <h3 class="category__title">${escapeHtml(category.title)}</h3>
        <p class="category__desc">${escapeHtml(category.description)}</p>
      </article>`
    ).join("");
  }
  function toWishWallNote(note) {
    var _a;
    const colorMap = {
      pink: "pink",
      yellow: "yellow",
      dark: "dark",
      white: "white"
    };
    return {
      id: note.id,
      author: note.author,
      message: note.message,
      color: (_a = colorMap[note.noteColor]) != null ? _a : "pink",
      rotation: note.rotationDeg
    };
  }
  function partitionWishes(notes) {
    const notesOnly = [];
    const photos = [];
    for (const note of notes) {
      const isPhoto = note.noteColor === "white";
      if (isPhoto) {
        photos.push({
          id: note.id,
          author: note.author,
          rotation: note.rotationDeg,
          hue: hashString(note.id) % 360
        });
      } else {
        notesOnly.push(toWishWallNote(note));
      }
    }
    return { notes: notesOnly, photos };
  }
  function renderNotes(container, notes) {
    container.innerHTML = notes.map((note, index) => {
      const position = `note--${index % 3 + 1}`;
      const showAuthor = note.author.length > 0 && !note.message.toLowerCase().includes(note.author.toLowerCase());
      return `
      <article class="note note--${note.color} ${position}" data-reveal
        style="--rotation:${note.rotation}deg; --reveal-delay:${index * 80}ms"
        aria-label="Wish from ${escapeHtml(note.author || "a guest")}">
        <p class="note__message">${escapeHtml(note.message)}</p>
        ${showAuthor ? `<p class="note__author">\u2014 ${escapeHtml(note.author)}</p>` : ""}
      </article>`;
    }).join("");
  }
  function renderPhotos(container, photos) {
    container.innerHTML = photos.map((photo, index) => {
      const position = `polaroid--${index % 2 + 1}`;
      return `
      <figure class="polaroid ${position}" data-reveal
        style="--rotation:${photo.rotation}deg; --reveal-delay:${index * 100}ms">
        <div class="polaroid__img">${avatarSvg(photo.author, photo.hue)}</div>
        <figcaption class="polaroid__caption">\u2013 ${escapeHtml(photo.author)}</figcaption>
      </figure>`;
    }).join("");
  }
  function renderSteps(container, steps) {
    container.innerHTML = steps.map(
      (step, index) => `
      <li class="step" data-reveal style="--reveal-delay:${index * 90}ms">
        <span class="step__badge" aria-hidden="true">${step.stepNumber}</span>
        <div class="step__body">
          <div class="step__head">
            <span class="step__icon">${icon(step.icon)}</span>
            <h3 class="step__title">
              <span class="visually-hidden">Step ${step.stepNumber}: </span>${escapeHtml(step.title)}
            </h3>
          </div>
          <p class="step__desc">${escapeHtml(step.description)}</p>
        </div>
      </li>`
    ).join("");
  }
  function initNavigation() {
    const toggle = document.querySelector(".nav__toggle");
    const menu = document.querySelector(".nav__menu");
    if (!toggle || !menu) return;
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open ? "Close navigation menu" : "Open navigation menu"
      );
      menu.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) setOpen(false);
    });
  }
  function showToast(message) {
    const toast = document.querySelector(".toast");
    if (!toast) return;
    const text = toast.querySelector(".toast__message");
    if (text) text.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
  }
  function initAuthModal() {
    const modal = document.querySelector(".modal");
    const panelTitle = modal == null ? void 0 : modal.querySelector(".modal__title");
    const panelText = modal == null ? void 0 : modal.querySelector(".modal__text");
    const form = modal == null ? void 0 : modal.querySelector(".auth-form");
    const emailInput = modal == null ? void 0 : modal.querySelector("#auth-email");
    const passwordInput = modal == null ? void 0 : modal.querySelector("#auth-password");
    const nameField = modal == null ? void 0 : modal.querySelector(".field--name");
    const nameInput = modal == null ? void 0 : modal.querySelector("#auth-name");
    const submitLabel = modal == null ? void 0 : modal.querySelector(".auth-form__submit span");
    const toggleLink = modal == null ? void 0 : modal.querySelector(".auth-switch");
    const closeButtons = modal == null ? void 0 : modal.querySelectorAll("[data-close-modal]");
    if (!modal || !panelTitle || !panelText || !form) return;
    let mode = "login";
    let lastFocused = null;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const applyMode = (next) => {
      mode = next;
      const isLogin = next === "login";
      panelTitle.textContent = isLogin ? "Welcome back" : "Create your account";
      panelText.textContent = isLogin ? "Log in to manage your events and wish walls." : "Sign up to create your first wish wall in minutes.";
      if (submitLabel) submitLabel.textContent = isLogin ? "Log in" : "Sign up";
      if (nameField) nameField.hidden = isLogin;
      if (toggleLink) {
        toggleLink.textContent = isLogin ? "New to Wishmarsh? Sign up" : "Already have an account? Log in";
      }
    };
    const open = (next) => {
      applyMode(next);
      lastFocused = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");
      window.setTimeout(() => emailInput == null ? void 0 : emailInput.focus(), 180);
    };
    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      lastFocused == null ? void 0 : lastFocused.focus();
    };
    const trapFocus = (event) => {
      if (event.key !== "Tab" || !modal.classList.contains("is-open")) return;
      const focusables = Array.from(
        modal.querySelectorAll(focusableSelector)
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
    document.querySelectorAll("[data-auth]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        open(trigger.dataset.auth === "register" ? "register" : "login");
      });
    });
    closeButtons == null ? void 0 : closeButtons.forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) close();
      trapFocus(event);
    });
    toggleLink == null ? void 0 : toggleLink.addEventListener("click", (event) => {
      event.preventDefault();
      applyMode(mode === "login" ? "register" : "login");
    });
    form.addEventListener("submit", async (event) => {
      var _a, _b, _c;
      event.preventDefault();
      const email = (_a = emailInput == null ? void 0 : emailInput.value.trim()) != null ? _a : "";
      const password = (_b = passwordInput == null ? void 0 : passwordInput.value) != null ? _b : "";
      const name = (_c = nameInput == null ? void 0 : nameInput.value.trim()) != null ? _c : "";
      if (!email || !password) {
        showToast("Please enter your email and password.");
        return;
      }
      const submitButton = form.querySelector(
        ".auth-form__submit"
      );
      if (submitButton) submitButton.disabled = true;
      try {
        const result = mode === "login" ? await WishmarshApi.login({ email, password }) : await WishmarshApi.register({
          email,
          password,
          ...name ? { name } : {}
        });
        close();
        showToast(
          WishmarshApi.lastCallUsedFallback ? `Welcome, ${result.user.name}! (demo mode)` : `Welcome, ${result.user.name}!`
        );
        form.reset();
      } catch {
        showToast("Something went wrong. Please try again.");
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
  function initCreateEventFlow() {
    document.querySelectorAll("[data-create-event]").forEach((trigger) => {
      trigger.addEventListener("click", async (event) => {
        var _a, _b;
        event.preventDefault();
        const original = trigger.getAttribute("data-original-label");
        if (!original) trigger.setAttribute("data-original-label", (_a = trigger.textContent) != null ? _a : "");
        trigger.textContent = "Creating\u2026";
        try {
          const response = await WishmarshApi.createEvent({
            source: (_b = trigger.dataset.createEvent) != null ? _b : "landing-page",
            ...trigger.dataset.category ? { categorySlug: trigger.dataset.category } : {}
          });
          if (WishmarshApi.lastCallUsedFallback) {
            showToast(
              `Demo event ${response.eventId} created \u2014 connect the API to continue.`
            );
          } else {
            window.location.assign(response.redirectUrl);
          }
        } catch {
          showToast("We couldn't start your event. Please try again.");
        } finally {
          trigger.textContent = original != null ? original : "Create an event \u2192";
        }
      });
    });
  }
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || href === "#" || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const top = target.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
        history.replaceState(null, "", href);
      });
    });
  }
  function initYear() {
    const slot = document.querySelector("[data-year]");
    if (slot) slot.textContent = String((/* @__PURE__ */ new Date()).getFullYear());
  }
  var revealObserver = null;
  var observedElements = /* @__PURE__ */ new WeakSet();
  function observeRevealElements() {
    const elements = Array.from(
      document.querySelectorAll("[data-reveal]")
    ).filter((element) => !observedElements.has(element));
    if (elements.length === 0) return;
    if (!revealObserver || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    elements.forEach((element) => {
      observedElements.add(element);
      revealObserver == null ? void 0 : revealObserver.observe(element);
    });
  }
  function initRevealObserver() {
    if (typeof IntersectionObserver !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver == null ? void 0 : revealObserver.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      );
    }
    observeRevealElements();
  }
  async function loadCategories() {
    const container = document.querySelector("[data-categories]");
    if (!container) return;
    const { data } = await WishmarshApi.getCategories();
    renderCategories(
      container,
      data.map((category) => toCategory(category))
    );
    observeRevealElements();
  }
  async function loadWishWall() {
    const notesContainer = document.querySelector("[data-notes]");
    const photosContainer = document.querySelector("[data-photos]");
    if (!notesContainer || !photosContainer) return;
    const { data } = await WishmarshApi.getSampleWishes();
    const { notes, photos } = partitionWishes(data);
    renderNotes(notesContainer, notes);
    renderPhotos(photosContainer, photos);
    observeRevealElements();
  }
  function initSteps() {
    const container = document.querySelector("[data-steps]");
    if (!container) return;
    renderSteps(container, STEPS);
  }
  function boot() {
    initNavigation();
    initAuthModal();
    initCreateEventFlow();
    initSteps();
    initSmoothScroll();
    initYear();
    const categoriesContainer = document.querySelector(
      "[data-categories]"
    );
    const notesContainer = document.querySelector("[data-notes]");
    const photosContainer = document.querySelector("[data-photos]");
    if (categoriesContainer) {
      renderCategories(
        categoriesContainer,
        MOCK_CATEGORIES.map((category) => toCategory(category))
      );
    }
    if (notesContainer && photosContainer) {
      const { notes, photos } = partitionWishes(MOCK_WISHES);
      renderNotes(notesContainer, notes);
      renderPhotos(photosContainer, photos);
    }
    initRevealObserver();
    void Promise.all([loadCategories(), loadWishWall()]);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
//# sourceMappingURL=main.js.map
