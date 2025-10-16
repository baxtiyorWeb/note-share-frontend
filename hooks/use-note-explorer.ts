// hooks/use-note-explorer.ts
import { useInfiniteQuery, UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import { getExploreNotes } from "@/services/notes-service";
import type { Note } from "@/services/notes-service";

export type SortBy = "createdAt" | "popular" | "commented";

export interface ExploreFilters {
  sortBy: SortBy;
  search: string;
}

export interface NotesPage {
  notes: Note[];
  nextPage: number | undefined; // backenddan keladigan keyingi sahifa raqami (yo'q bo'lsa undefined)
}

// ✅ Eʼtibor: return tipi endi InfiniteData<NotesPage>
export const useExploreNotes = (
  filters: ExploreFilters
): UseInfiniteQueryResult<InfiniteData<NotesPage>, Error> => {
  const limit = 12;

  return useInfiniteQuery<
    NotesPage,                 // TQueryFnData (har bir sahifaning shakli)
    Error,                     // TError
    InfiniteData<NotesPage>,   // TData (butun natija)
    [string, ExploreFilters],  // TQueryKey
    number                     // TPageParam
  >({
    queryKey: ["exploreNotes", filters],
    initialPageParam: 1,

    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = {
        page: pageParam,
        limit,
      };

      if (filters.search?.trim()) params.search = filters.search;
      // backend 'createdAt' default bo'lsa, uni yuborish ham mumkin:
      params.sortBy = filters.sortBy || "createdAt";

      // Backend javobi: { notes: Note[], nextPage?: number }
      const data = await getExploreNotes(params);
      return data;
    },

    getNextPageParam: (lastPage) => lastPage.nextPage,

    // v5 mos sozlamalar
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 1000 * 60 * 3, // (v5: cacheTime -> gcTime)
  });
};
