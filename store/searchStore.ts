// store/searchStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ================================
// Types
// ================================

export type SearchContext =
  | "pages"
  | "resources"
  | "tags"
  | "flashcards"
  | null;

// ================================
// Store Interface
// ================================

interface SearchStore {
  // State
  query: string;
  isSearchMode: boolean;
  isSearching: boolean;
  currentSearchContext: SearchContext;
  searchUIVisible: boolean; // NEW: Controls if search UI is visible

  // Actions
  setQuery: (query: string) => void;
  setSearchMode: (mode: boolean) => void;
  setSearching: (searching: boolean) => void;
  setSearchContext: (context: SearchContext) => void;
  setSearchUIVisible: (visible: boolean) => void; // NEW
  clearSearch: () => void;

  // Utilities
  canSearch: () => boolean;
  shouldShowSearch: () => boolean;
}

// ================================
// Store Implementation
// ================================

export const useSearchStore = create<SearchStore>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      query: "",
      isSearchMode: false,
      isSearching: false,
      currentSearchContext: null,
      searchUIVisible: false, // NEW: Search UI starts hidden

      // ================================
      // Actions
      // ================================

      setQuery: (query: string) => {
        set((state) => {
          state.query = query;

          // Auto-update search mode based on query
          if (query.length >= 3 && state.currentSearchContext) {
            state.isSearchMode = true;
          } else {
            state.isSearchMode = false;
          }
        });
      },

      setSearchMode: (mode: boolean) => {
        set((state) => {
          state.isSearchMode = mode;
        });
      },

      setSearching: (searching: boolean) => {
        set((state) => {
          state.isSearching = searching;
        });
      },

      setSearchContext: (context: SearchContext) => {
        set((state) => {
          // If context is changing, clear previous search and hide UI
          if (state.currentSearchContext !== context) {
            state.query = "";
            state.isSearchMode = false;
            state.isSearching = false;
            state.searchUIVisible = false;
          }

          state.currentSearchContext = context;
        });
      },

      setSearchUIVisible: (visible: boolean) => {
        set((state) => {
          state.searchUIVisible = visible;

          // If hiding UI, also clear search
          if (!visible) {
            state.query = "";
            state.isSearchMode = false;
            state.isSearching = false;
          }
        });
      },

      clearSearch: () => {
        set((state) => {
          state.query = "";
          state.isSearchMode = false;
          state.isSearching = false;
          state.searchUIVisible = false; // Also hide the UI
          // Keep currentSearchContext - user is still on the same route
        });
      },

      // ================================
      // Utilities
      // ================================

      canSearch: () => {
        const { currentSearchContext, query } = get();
        return currentSearchContext !== null && query.length >= 3;
      },

      shouldShowSearch: () => {
        return get().currentSearchContext !== null;
      },
    }))
  )
);

// ================================
// Selector Hooks for Performance
// ================================

export const useSearchQuery = () => useSearchStore((state) => state.query);
export const useSearchMode = () =>
  useSearchStore((state) => state.isSearchMode);
export const useSearching = () => useSearchStore((state) => state.isSearching);
export const useSearchContext = () =>
  useSearchStore((state) => state.currentSearchContext);
export const useSearchUIVisible = () =>
  useSearchStore((state) => state.searchUIVisible); // NEW
export const useCanSearch = () => useSearchStore((state) => state.canSearch());
export const useShouldShowSearch = () =>
  useSearchStore((state) => state.shouldShowSearch());
