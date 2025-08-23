// lib/search/searchRoutes.ts
import { SearchContext } from "../store/searchStore";

// ================================
// Types
// ================================

export interface SearchRouteConfig {
  context: SearchContext;
  placeholder: string;
  minQueryLength?: number;
  debounceMs?: number;
  enabled?: boolean;
}

// ================================
// Route Configurations
// ================================

export const SEARCH_ROUTES: Record<string, SearchRouteConfig> = {
  // Workspace Pages
  "/workspace/pages": {
    context: "pages",
    placeholder: "Search pages...",
    minQueryLength: 3,
    debounceMs: 300,
    enabled: true,
  },

  // Individual Page Routes (also searchable for page content)
  "/workspace/pages/[id]": {
    context: "pages",
    placeholder: "Search in page...",
    minQueryLength: 2,
    debounceMs: 200,
    enabled: false, // Could enable for in-page search later
  },

  // Resources (when you add this route)
  "/resources": {
    context: "resources",
    placeholder: "Search resources...",
    minQueryLength: 3,
    debounceMs: 300,
    enabled: true,
  },

  // Review - search flashcards
  "/review": {
    context: "flashcards",
    placeholder: "Search flashcards...",
    minQueryLength: 2,
    debounceMs: 250,
    enabled: true,
  },

  // Future routes can be easily added:

  // "/tags": {
  //   context: "tags",
  //   placeholder: "Search tags...",
  //   minQueryLength: 2,
  //   debounceMs: 200,
  //   enabled: true,
  // },

  // "/templates": {
  //   context: "pages",
  //   placeholder: "Search templates...",
  //   minQueryLength: 3,
  //   debounceMs: 300,
  //   enabled: true,
  // },
};

// ================================
// Utility Functions
// ================================

/**
 * Get search configuration for a specific route
 * @param pathname - Current route pathname
 * @returns Search config or null if route doesn't support search
 */
export const getSearchConfig = (pathname: string): SearchRouteConfig | null => {
  // Direct match first
  if (SEARCH_ROUTES[pathname]) {
    return SEARCH_ROUTES[pathname];
  }

  // Handle dynamic routes - match patterns with [id]
  for (const [routePattern, config] of Object.entries(SEARCH_ROUTES)) {
    if (routePattern.includes("[id]")) {
      // Convert pattern to regex: /(tabs)/workspace/pages/[id] -> /(tabs)/workspace/pages/.+
      const regexPattern = routePattern.replace(/\[id\]/g, ".+");
      const regex = new RegExp(`^${regexPattern}$`);

      if (regex.test(pathname)) {
        return config;
      }
    }
  }

  return null;
};

/**
 * Check if a route supports search
 * @param pathname - Current route pathname
 * @returns boolean
 */
export const isSearchableRoute = (pathname: string): boolean => {
  const config = getSearchConfig(pathname);
  return config !== null && config.enabled !== false;
};

/**
 * Get all searchable routes (useful for debugging/admin)
 * @returns Array of route patterns that support search
 */
export const getSearchableRoutes = (): string[] => {
  return Object.entries(SEARCH_ROUTES)
    .filter(([_, config]) => config.enabled !== false)
    .map(([route, _]) => route);
};

/**
 * Get default search configuration
 * @returns Default config for fallback cases
 */
export const getDefaultSearchConfig = (): SearchRouteConfig => ({
  context: null,
  placeholder: "Search...",
  minQueryLength: 3,
  debounceMs: 300,
  enabled: false,
});

// ================================
// Route-Specific Helpers
// ================================

/**
 * Get search context from pathname
 * @param pathname - Current route
 * @returns SearchContext or null
 */
export const getSearchContextFromRoute = (pathname: string): SearchContext => {
  const config = getSearchConfig(pathname);
  return config?.context || null;
};

/**
 * Get debounce delay for current route
 * @param pathname - Current route
 * @returns Debounce delay in milliseconds
 */
export const getDebounceDelay = (pathname: string): number => {
  const config = getSearchConfig(pathname);
  return config?.debounceMs || 300;
};

/**
 * Get minimum query length for current route
 * @param pathname - Current route
 * @returns Minimum characters needed to trigger search
 */
export const getMinQueryLength = (pathname: string): number => {
  const config = getSearchConfig(pathname);
  return config?.minQueryLength || 3;
};
