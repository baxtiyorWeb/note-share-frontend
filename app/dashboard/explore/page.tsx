// app/explore/page.tsx
"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, Loader2 } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MinimalNoteCard } from "@/components/dashboard/note-card";
import { NoteDetailModal } from "@/components/dashboard/note-detail-modal";

// Assuming these hooks/types are defined elsewhere and use standard English naming
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

  const toggleLikeMutation = useToggleLike(selectedNote?.id || 0);
  const addViewMutation = useAddView(selectedNote?.id || 0);

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSort = useCallback((sortBy: SortBy) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleToggleLike = useCallback((noteId: number) => {
    if (!currentProfileId) return toast.error("Login required to perform this action");
    toggleLikeMutation.mutate(undefined, {
      onSuccess: () => toast.success("Note liked!"),
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

  const statsLabel = useMemo(() => {
    if (filters.search) return `Results for “${filters.search}”`;
    if (filters.sortBy === "popular") return "Most Popular Knowledge";
    if (filters.sortBy === "commented") return "Most Active Discussions";
    return "Latest Knowledge";
  }, [filters]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header and Controls */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 md:mb-12"
          >
            {/* Minimal Header */}
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-6 border-b pb-2 border-slate-200 dark:border-slate-800">
              Explore Knowledge
            </h1>

            {/* Search and Sort */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-grow md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by science, author, topic..."
                  className="pl-9 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-violet-500"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "createdAt", label: "New" },
                  { key: "popular", label: "Popular" },
                  { key: "commented", label: "Active" },
                ].map(({ key, label }) => {
                  const isActive = filters.sortBy === key;
                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort(key as SortBy)}
                      className={`rounded-lg text-sm transition-colors ${isActive
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : "text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Stats and Grid Title */}
          <div className="mb-6">
            <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200">
              {statsLabel}
              {totalNotes > 0 && (
                <span className="text-sm font-normal ml-2 text-slate-500 dark:text-slate-400">
                  ({totalNotes})
                </span>
              )}
            </h2>
          </div>

          {/* Notes Grid */}
          {isLoading && notes.length === 0 ? (
            <NotesSkeleton />
          ) : notes.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {notes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MinimalNoteCard
                      note={note}
                      currentProfileId={currentProfileId}
                      onToggleLike={handleToggleLike}
                      onOpenDetail={handleOpen}
                      onDelete={() => { console.log("delete logic here") }}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Infinite Scroll Trigger / Load More */}
              <div ref={observerRef} className="flex justify-center mt-12">
                {isFetchingNextPage ? (
                  <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                ) : hasNextPage ? (
                  <Button
                    onClick={() => fetchNextPage()}
                    variant="outline"
                    className="rounded-full px-6 text-violet-600 border-violet-600 hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Load More
                  </Button>
                ) : notes.length > 0 ? (
                  <p className="text-center text-slate-500 text-sm">
                    All knowledge loaded
                  </p>
                ) : null}
              </div>
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
      </div>
    </DashboardLayout>
  );
}

function NotesSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array(8).fill(0).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-xl dark:bg-slate-800" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900">
      <div className="p-4 rounded-full bg-slate-200 dark:bg-slate-800 w-fit mx-auto mb-4">
        <Search className="w-8 h-8 text-slate-500 dark:text-slate-400" />
      </div>
      <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">No results found</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-2">Try searching with a different keyword or changing the filter</p>
    </div>
  );
}