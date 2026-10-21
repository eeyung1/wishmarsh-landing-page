/**
 * Wishmarsh — API service layer.
 *
 * A strongly typed, decoupled client for the core Wishmarsh backend.
 * Every call degrades gracefully to local mock data so the landing page
 * remains fully usable as a standalone, frontend-only build.
 *
 * Expected endpoints
 * -----------------
 *  POST /api/events           → initialise an event creation flow
 *  GET  /api/categories       → event category list
 *  GET  /api/wishes/sample    → sample wish cards for the collage wall
 *  POST /api/auth/login       → authentication entry point
 *  POST /api/auth/register    → user registration entry point
 */

/* ---------------------------------------------------------------------------
 * Ambient environment declaration (safe in browsers and in Node-based builds)
 * ------------------------------------------------------------------------- */
declare const process:
  | { env?: Record<string, string | undefined> }
  | undefined;

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/** A single event category shown in the categories strip. */
export interface EventCategory {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Key of the inline SVG icon to render (never an external icon font). */
  icon: string;
}

/** A wish card rendered inside the collage wish wall. */
export interface WishNote {
  id: string;
  author: string;
  message: string;
  /** Optional remote avatar; falls back to an inline SVG placeholder. */
  avatarUrl?: string;
  noteColor: "pink" | "yellow" | "dark" | "white";
  rotationDeg: number;
}

/** Payload sent when a visitor starts the "Create an event" flow. */
export interface CreateEventPayload {
  categorySlug?: string;
  source?: string;
}

/** Response returned when an event draft has been initialised. */
export interface CreateEventResponse {
  eventId: string;
  redirectUrl: string;
}

/** Credentials used by the login / register flows. */
export interface AuthPayload {
  email: string;
  password: string;
  name?: string;
}

/** Authenticated user returned by the auth endpoints. */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/* ---------------------------------------------------------------------------
 * Mock data (used whenever the backend is unreachable)
 * ------------------------------------------------------------------------- */

export const MOCK_CATEGORIES: EventCategory[] = [
  {
    id: "cat_birthdays",
    slug: "birthdays",
    title: "Birthdays",
    description: "Celebrate the big moments",
    icon: "calendar-heart",
  },
  {
    id: "cat_anniversaries",
    slug: "anniversaries",
    title: "Anniversaries",
    description: "Mark your special days",
    icon: "heart",
  },
  {
    id: "cat_condolences",
    slug: "condolences",
    title: "Condolences",
    description: "Share support and love",
    icon: "ribbon",
  },
  {
    id: "cat_baby_showers",
    slug: "baby-showers",
    title: "Baby Showers",
    description: "Welcome the little ones",
    icon: "gift",
  },
  {
    id: "cat_get_wells",
    slug: "get-wells",
    title: "Get Wells",
    description: "Lift spirits with kind wishes",
    icon: "sunburst",
  },
  {
    id: "cat_congratulations",
    slug: "congratulations",
    title: "Congratulations",
    description: "Cheer on new beginnings",
    icon: "star",
  },
];

export const MOCK_WISHES: WishNote[] = [
  {
    id: "wish_tunde",
    author: "Tunde",
    message: "Happy Birthday – Tunde! ♡",
    noteColor: "pink",
    rotationDeg: -6,
  },
  {
    id: "wish_vibes",
    author: "",
    message: "Good Vibes Only! ♡",
    noteColor: "yellow",
    rotationDeg: 4,
  },
  {
    id: "wish_mama",
    author: "Mama",
    message: "God's favour always... – Mama ♡",
    noteColor: "dark",
    rotationDeg: -3,
  },
  {
    id: "wish_femi",
    author: "Femi",
    message: "You are loved!",
    noteColor: "white",
    rotationDeg: 7,
  },
  {
    id: "wish_cousin",
    author: "Your cousin",
    message: "Huge congratulations!",
    noteColor: "white",
    rotationDeg: -8,
  },
];

/* ---------------------------------------------------------------------------
 * Service
 * ------------------------------------------------------------------------- */

/** Result of a service call: the payload plus a flag telling us if it fell back. */
export interface ServiceResult<T> {
  data: T;
  /** `true` when the backend was unreachable and mock data was served. */
  isFallback: boolean;
}

const REQUEST_TIMEOUT_MS = 6000;

function resolveBaseUrl(): string {
  const fromEnv =
    typeof process !== "undefined" && process.env
      ? process.env["API_BASE_URL"]
      : undefined;
  return fromEnv && fromEnv.length > 0 ? fromEnv : "/api";
}

export class WishmarshApi {
  private static baseUrl = resolveBaseUrl();

  /** `true` when the most recent call fell back to local mock data. */
  public static lastCallUsedFallback = false;

  /** Base URL every request is issued against. */
  public static getBaseUrl(): string {
    return WishmarshApi.baseUrl;
  }

  /** Allows the host app to point the client at another environment. */
  public static setBaseUrl(baseUrl: string): void {
    WishmarshApi.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Initialise an event creation flow.
   * POST /api/events
   */
  public static async createEvent(
    payload: CreateEventPayload = {},
  ): Promise<CreateEventResponse> {
    try {
      const data = await WishmarshApi.request<CreateEventResponse>(
        "/events",
        { method: "POST", body: JSON.stringify(payload) },
      );
      WishmarshApi.lastCallUsedFallback = false;
      return data;
    } catch {
      // Graceful fallback for standalone frontend testing
      WishmarshApi.lastCallUsedFallback = true;
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
  public static async getCategories(): Promise<ServiceResult<EventCategory[]>> {
    try {
      const data = await WishmarshApi.request<EventCategory[]>("/categories", {
        method: "GET",
      });
      WishmarshApi.lastCallUsedFallback = false;
      return { data, isFallback: false };
    } catch {
      WishmarshApi.lastCallUsedFallback = true;
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
  public static async getSampleWishes(): Promise<ServiceResult<WishNote[]>> {
    try {
      const data = await WishmarshApi.request<WishNote[]>("/wishes/sample", {
        method: "GET",
      });
      WishmarshApi.lastCallUsedFallback = false;
      return { data, isFallback: false };
    } catch {
      WishmarshApi.lastCallUsedFallback = true;
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
  public static async login(payload: AuthPayload): Promise<AuthResponse> {
    try {
      const data = await WishmarshApi.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      WishmarshApi.lastCallUsedFallback = false;
      return data;
    } catch {
      WishmarshApi.lastCallUsedFallback = true;
      return {
        token: "demo-token",
        user: {
          id: "demo-user",
          name: payload.email.split("@")[0] ?? "Friend",
          email: payload.email,
        },
      };
    }
  }

  /**
   * Register a new user.
   * POST /api/auth/register
   */
  public static async register(payload: AuthPayload): Promise<AuthResponse> {
    try {
      const data = await WishmarshApi.request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      WishmarshApi.lastCallUsedFallback = false;
      return data;
    } catch {
      WishmarshApi.lastCallUsedFallback = true;
      return {
        token: "demo-token",
        user: {
          id: "demo-user",
          name: payload.name ?? payload.email.split("@")[0] ?? "Friend",
          email: payload.email,
        },
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Transport                                                          */
  /* ------------------------------------------------------------------ */

  /** Issue a JSON request with a timeout, throwing on any failure. */
  private static async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${WishmarshApi.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Wishmarsh API request failed: ${response.status}`);
      }

      return (await response.json()) as T;
    } finally {
      window.clearTimeout(timer);
    }
  }
}

export default WishmarshApi;
