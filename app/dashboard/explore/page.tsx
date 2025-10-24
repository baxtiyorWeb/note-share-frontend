"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "react-hot-toast";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Search, Globe, Clock, Heart, MessageCircle, Filter, X } from "lucide-react";

import type { Note } from "@/services/notes-service";
import { useExploreNotes, SortBy } from "@/hooks/use-note-explorer";
import { useToggleLike, useAddView } from "@/hooks/use-note-interactions";
import { useMyProfile } from "@/hooks/use-profile";
import { MinimalNoteCard } from "@/components/dashboard/note-card";
import { NoteDetailModal } from "@/components/dashboard/note-detail-modal";

const FilterTabs = React.memo(({ currentSort, onSortChange }: { currentSort: SortBy; onSortChange: (sortBy: SortBy) => void }) => {
  const tabs = [
    { key: "createdAt", label: "Eng so'nggilari", icon: Clock },
    { key: "popular", label: "Eng mashhurlari", icon: Heart },
    { key: "commented", label: "Eng ko'p izohlangan", icon: MessageCircle },
  ] as const;

  return (
    <div className="hidden md:flex flex-wrap gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner">
      {tabs.map(({ key, label, icon: Icon }) => (
        <motion.div key={key} whileTap={{ scale: 0.95 }}>
          <Button
            variant={currentSort === key ? "default" : "ghost"}
            onClick={() => onSortChange(key as SortBy)}
            className={`transition-all duration-200 ${currentSort === key
              ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-violet-400 cursor-pointer dark:hover:bg-slate-700/70"
              }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </Button>
        </motion.div>
      ))}
    </div>

  );
});
FilterTabs.displayName = "FilterTabs";

const filterModalVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: "100%", transition: { duration: 0.2 } },
};

// Pagination Controls Component
const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  const pageButtons = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageButtons.push(
      <Button
        key={i}
        variant={currentPage === i ? "default" : "outline"}
        size="sm"
        onClick={() => onPageChange(i)}
        className={`mx-1 transition-all duration-200 ${currentPage === i
          ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
      >
        {i}
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <span>Oldingi</span>
      </Button>
      {pageButtons}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <span>Keyingi</span>
      </Button>
    </div>
  );
};

export default function ExplorePage() {
  const [filters, setFilters] = useState({ sortBy: "createdAt" as SortBy, search: "", page: 1, limit: 12 });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { data, isLoading, isError } = useExploreNotes(filters);
  const { data: profileData } = useMyProfile();
  const toggleLikeMutation = useToggleLike(selectedNote?.id || 0);
  const addViewMutation = useAddView(selectedNote?.id || 0);

  const currentProfileId = profileData?.profile?.id;

  const notes = data?.pages.flatMap((page) => page.notes) ?? [];

  const totalNotes = data?.pages[0]?.notes?.length ?? 0;

  const totalPages = Math.ceil(totalNotes / (filters.limit || 12));
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const handleSortChange = useCallback((sortBy: SortBy) => {
    setFilters((prev) => ({ ...prev, sortBy, page: 1 }));
    setIsFilterModalOpen(false);
  }, []);

  const handleToggleLike = useCallback((noteId: number) => {
    if (!currentProfileId) {
      toast.error("Iltimos, avval tizimga kiring.");
      return;
    }
    toggleLikeMutation.mutate(undefined, {
      onSuccess: () => toast.success("Layk o'zgartirildi!"),
      onError: (error) => toast.error(`Layk xatosi: ${error.message}`),
    });
  }, [currentProfileId, toggleLikeMutation]);

  const handleOpenDetail = useCallback((note: Note) => {
    setSelectedNote(note);
    if (note.id) {
      addViewMutation.mutate(undefined);
    }
  }, [addViewMutation]);

  const handleCloseDetail = useCallback(() => {
    setSelectedNote(null);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setFilters((prev) => ({ ...prev, page }));
    }
  }, [totalPages]);

  const filterLabel = useMemo(() => {
    const noteCount = totalNotes;
    if (filters.search) return `Qidiruv natijalari: "${filters.search}" (${noteCount} ta)`;

    switch (filters.sortBy) {
      case "popular": return `Eng mashhur eslatmalar (${noteCount} ta)`;
      case "commented": return `Eng ko'p izohlangan eslatmalar (${noteCount} ta)`;
      case "createdAt": default: return `Eng so'nggi eslatmalar (${noteCount} ta)`;
    }
  }, [filters, totalNotes]);

  return (
    <DashboardLayout>
      <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 md:gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 md:pb-4"
        >
          <div className="p-2 md:p-3 rounded-full bg-blue-100 dark:bg-blue-500/10 flex-shrink-0 shadow-lg">
            <Globe className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">Kashfiyot</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Jamiyatning eng yaxshi eslatmalarini toping</p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3 md:gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
            <div className="relative w-full sm:w-2/3 md:w-1/2 lg:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 flex-shrink-0" />
              <Input
                id="search-explore"
                placeholder="Search for a note by title, content, or author..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="
      pl-9
      w-full
      h-10
      text-sm md:text-base
      bg-white dark:bg-slate-800
      border-t-0 border-r-0 border-l-0 dark:border-slate-700
      focus:ring-0 focus:border-violet-500/60
      placeholder:text-slate-400
      rounded-none
      transition-all duration-300
    "
              />
            </div>

          </motion.div>

          <div className="flex gap-2 items-center justify-between">
            <FilterTabs currentSort={filters.sortBy} onSortChange={handleSortChange} />
            <motion.div whileTap={{ scale: 0.9 }} className="md:hidden flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsFilterModalOpen(true)}
                size="sm"
                className="transition-colors dark:border-slate-700 dark:text-slate-300 shadow-md"
              >
                <Filter className="w-4 h-4 mr-1" /> Filtr
              </Button>
            </motion.div>
          </div>
        </div>

        <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-200 pt-2">
          {filterLabel}
        </h2>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          >
            {Array(filters.limit)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-lg" />
              ))}
          </motion.div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500 dark:text-red-400">
            Ma'lumotlarni yuklashda xato yuz berdi.
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 md:py-16 px-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
            <X className="mx-auto h-12 w-12 md:h-16 md:w-16 text-slate-400 dark:text-slate-600" />
            <h3 className="mt-4 text-base md:text-lg font-semibold text-slate-800 dark:text-slate-300">
              Natija topilmadi
            </h3>
            <p className="mt-1 text-sm text-slate-500">Filtrlarni yoki qidiruv so'zini o'zgartirib ko'ring.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            className="grid gap-4 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          >
            {notes.map((note) => (
              <MinimalNoteCard
                key={note.id}
                note={note}
                currentProfileId={currentProfileId}
                onToggleLike={() => handleToggleLike(note.id)}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </motion.div>
        )}

        {totalPages > 1 && (
          <PaginationControls
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        <AnimatePresence>
          {selectedNote && (
            <NoteDetailModal
              note={selectedNote}
              isOpen={!!selectedNote}
              onClose={handleCloseDetail}
              currentProfileId={currentProfileId}
              onToggleLike={() => handleToggleLike(selectedNote.id)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isFilterModalOpen && (
            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
              <motion.div
                className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none sm:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DialogContent
                  className="p-0 max-w-full w-full rounded-t-xl pointer-events-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
                >
                  {/* 🧩 motion.div shu yerda animatsiya qiladi */}
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={filterModalVariants}
                  >
                    <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800">
                      <DialogTitle className="text-lg font-bold">Filtrlash</DialogTitle>
                      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Yopish</span>
                      </DialogClose>
                    </DialogHeader>

                    <div className="p-4 space-y-2">
                      {[
                        { key: "createdAt", label: "Eng so'nggilari", icon: Clock },
                        { key: "popular", label: "Eng mashhurlari", icon: Heart },
                        { key: "commented", label: "Eng ko'p izohlangan", icon: MessageCircle },
                      ].map(({ key, label, icon: Icon }) => (
                        <motion.div key={key} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="ghost"
                            onClick={() => handleSortChange(key as SortBy)}
                            className={`w-full justify-start text-base py-2.5 h-auto transition-colors ${filters.sortBy === key
                              ? "bg-violet-500/10 text-violet-600 font-semibold dark:bg-violet-900/30 dark:text-violet-400"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              }`}
                          >
                            <Icon className="w-5 h-5 mr-3" />
                            {label}
                            {filters.sortBy === key && <span className="ml-auto">✓</span>}s
                          </Button>

                        </motion.div>
                      ))}
                    </div>

                    <div className="p-4 pt-0">
                      <Button
                        onClick={() => setIsFilterModalOpen(false)}
                        className="w-full bg-slate-900 hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500 h-10 shadow-xl"
                      >
                        Yopish
                      </Button>
                    </div>
                  </motion.div>
                </DialogContent>

              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}