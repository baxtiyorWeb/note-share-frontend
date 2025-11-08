// app/explore/page.tsx
"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, Filter, Globe, Sparkles, TrendingUp, MessageCircle, Heart, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MinimalNoteCard } from "@/components/dashboard/note-card";
import { NoteDetailModal } from "@/components/dashboard/note-detail-modal";

import { useExploreNotes, SortBy } from "@/hooks/use-note-explorer";
import { useToggleLike, useAddView } from "@/hooks/use-note-interactions";
import { useMyProfile } from "@/hooks/use-profile";
import { Note } from "@/types";

export default function ExplorePage() {
  const [filters, setFilters] = useState({
    sortBy: "createdAt" as SortBy,
    search: "",
    limit: 12,
  });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExploreNotes(filters);

  const { data: profileData } = useMyProfile();
  const currentProfileId = profileData?.profile?.id;

  const notes = useMemo(() => data?.pages.flatMap(p => p.notes) ?? [], [data]);
  const totalNotes = data?.pages[0]?.total ?? 0;
  const totalPages = data?.pages[0]?.pages ?? 1;
  const currentPage = data?.pages.length ?? 1;

  const toggleLikeMutation = useToggleLike(selectedNote?.id || 0);
  const addViewMutation = useAddView(selectedNote?.id || 0);

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSort = useCallback((sortBy: SortBy) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleToggleLike = useCallback((noteId: number) => {
    if (!currentProfileId) return toast.error("Kirish kerak");
    toggleLikeMutation.mutate(undefined, {
      onSuccess: () => toast.success("Layk qo‘yildi!"),
    });
  }, [currentProfileId, toggleLikeMutation]);

  const handleOpen = useCallback((note: Note) => {
    setSelectedNote(note);
    addViewMutation.mutate();
  }, [addViewMutation]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!observerRef.current || isFetchingNextPage || !hasNextPage) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const stats = useMemo(() => ({
    total: totalNotes,
    label: filters.search
      ? `“${filters.search}” bo‘yicha`
      : filters.sortBy === "popular" ? "Eng mashhurlari"
        : filters.sortBy === "commented" ? "Eng faol izohlangan"
          : "latest knowledge"
  }), [filters, totalNotes]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 shadow-xl">
              <Globe className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to the World of Knowledge
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Discover and share the best knowledge
          </p>
        </motion.div>

        {/* Search + Filter */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Search by science, author, topic..."
              className="pl-12 h-12 text-lg rounded-full shadow-lg border-0 bg-white dark:bg-slate-800"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { key: "createdAt", label: "New", icon: Sparkles },
              { key: "popular", label: "Popular", icon: TrendingUp },
              { key: "commented", label: "Active", icon: MessageCircle },
            ].map(({ key, label, icon: Icon }) => {
              const isActive = filters.sortBy === key;
              return (
                <Button
                  key={key}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => handleSort(key as SortBy)}
                  className={`rounded-full transition-all duration-300 ${isActive
                    ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md"
                    : "hover:bg-gradient-to-r hover:from-violet-600 hover:to-blue-600 hover:text-white"
                    }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="text-center mb-8">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong className="text-violet-600 dark:text-violet-400">{stats.total}</strong> {stats.label}
          </p>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <NotesSkeleton />
        ) : notes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto"
            >
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <MinimalNoteCard
                    note={note}
                    currentProfileId={currentProfileId}
                    onToggleLike={handleToggleLike}
                    onOpenDetail={handleOpen}
                    onDelete={() => { console.log("delete") }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Infinite Scroll Trigger */}
            {hasNextPage && (
              <div ref={observerRef} className="flex justify-center mt-12">
                {isFetchingNextPage ? (
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                ) : (
                  <div className="h-10" />
                )}
              </div>
            )}

            {/* Classic Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(0, currentPage - 3);
                  if (page >= totalPages) return null;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page + 1 ? "default" : "outline"}
                      className={currentPage === page + 1 ? "bg-gradient-to-r from-violet-600 to-blue-600" : ""}
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                      {page + 1}
                    </Button>
                  );
                }).filter(Boolean)}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-slate-500">...</span>
                    <Button variant="outline">{totalPages}</Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  disabled={!hasNextPage}
                  onClick={() => fetchNextPage()}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* End of Results */}
            {!hasNextPage && notes.length > 0 && (
              <p className="text-center text-slate-500 mt-12 text-sm">
                All notes loaded
              </p>
            )}
          </>
        )}

        {/* Modal */}
        <AnimatePresence>
          {selectedNote && (
            <NoteDetailModal
              note={selectedNote}
              isOpen={!!selectedNote}
              onClose={() => setSelectedNote(null)}
              currentProfileId={currentProfileId}
              onToggleLike={() => handleToggleLike(selectedNote.id)}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

/* === Kichik komponentlar === */
function NotesSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
      {Array(12).fill(0).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
        <Search className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Hech narsa topilmadi</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-2">Boshqa kalit so‘z bilan qidiring</p>
    </div>
  );
}