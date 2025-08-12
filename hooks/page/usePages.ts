// hooks/page/usePages.ts
import { useCallback, useEffect, useState } from "react";
import { pageRepository } from "../../db/pageRepository";
import { type Page } from "../../db/schema";
import { captureAndFormatError } from "../../lib/sentry/errorHandler";

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load pages from database
  const loadPages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const activePages = await pageRepository.getActivePages();
      setPages(activePages);
    } catch (err) {
      const errorMessage = captureAndFormatError(err, {
        operation: "load pages",
        component: "usePages",
        level: "error",
      });
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new page
  const createPage = useCallback(
    async (title: string, contentType: "page" | "canvas" = "page") => {
      try {
        const newPage = await pageRepository.createPage({
          title,
          content: contentType === "canvas" ? "{}" : "<p>Start writing...</p>",
          content_type: contentType,
        });

        await loadPages(); // Refresh list
        return newPage;
      } catch (err) {
        const errorMessage = captureAndFormatError(err, {
          operation: "create page",
          component: "usePages",
          context: { title, contentType },
        });
        setError(errorMessage);
        throw err;
      }
    },
    [loadPages]
  );

  // Update page
  const updatePage = useCallback(
    async (id: number, updates: { title?: string; content?: string }) => {
      try {
        const updatedPage = await pageRepository.updatePage(id, updates);
        await loadPages(); // Refresh list
        return updatedPage;
      } catch (err) {
        const errorMessage = captureAndFormatError(err, {
          operation: "update page",
          component: "usePages",
          context: {
            pageId: id,
            updateFields: Object.keys(updates),
            hasTitle: !!updates.title,
            hasContent: !!updates.content,
          },
        });
        setError(errorMessage);
        throw err;
      }
    },
    [loadPages]
  );

  // Delete page
  const deletePage = useCallback(
    async (id: number) => {
      try {
        await pageRepository.deletePage(id);
        await loadPages(); // Refresh list
      } catch (err) {
        const errorMessage = captureAndFormatError(err, {
          operation: "delete page",
          component: "usePages",
          context: { pageId: id },
        });
        setError(errorMessage);
        throw err;
      }
    },
    [loadPages]
  );

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  return {
    pages,
    isLoading,
    error,
    createPage,
    updatePage,
    deletePage,
    refetch: loadPages,
  };
}
