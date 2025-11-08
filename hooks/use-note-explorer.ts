// hooks/use-note-explorer.ts
import { useInfiniteQuery, UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import { getExploreNotes } from "@/services/notes-service";
import { Note } from "@/types";

export type SortBy = "createdAt" | "popular" | "commented";

export interface ExploreFilters {
  sortBy: SortBy;
  search: string;
}

export interface NotesPage {
  notes: Note[];
  nextPage: number | undefined;
  total?: number;
  pages?: number;
}

export const useExploreNotes = (
  filters: ExploreFilters
): UseInfiniteQueryResult<InfiniteData<NotesPage>, Error> => {
  const size = 30;

  return useInfiniteQuery<
    NotesPage,
    Error,
    InfiniteData<NotesPage>,
    [string, ExploreFilters],
    number
  >({
    queryKey: ["exploreNotes", filters],
    initialPageParam: 1,

    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = {
        page: pageParam,
        size,
      };

      if (filters.search?.trim()) params.search = filters.search;
      params.sort = filters.sortBy || "createdAt";

      const data = await getExploreNotes(params);

      return {
        ...data,
        page: Number(data.page),
        size: size,
        nextPage: data.nextPage ? Number(data.nextPage) : undefined,
      };
    },

    getNextPageParam: (lastPage) => {
      return lastPage.nextPage;
    },

    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 1000 * 60 * 3,
  });
};
