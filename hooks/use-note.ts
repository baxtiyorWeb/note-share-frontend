// hooks/use-note.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  shareNote,
  getSharedWithMeNotes,
  saveNote,
  unsaveNote,
  getSavedNotes,
} from "@/services/notes-service";
import { Note } from "@/types";
import toast from "react-hot-toast";

export const useNotes = () => {
  return useQuery({
    queryKey: ["notes"],
    queryFn: getAllNotes,
  });
};

export const useSavedNotes = () => {
  return useQuery({
    queryKey: ["saved-notes"],
    queryFn: getSavedNotes,
  });
};

export const useNote = (id: number) => {
  return useQuery({
    queryKey: ["note", id],
    queryFn: () => getNoteById(id),
    enabled: !!id,
  });
};

export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note created!");
    },
  });
};

export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateNote(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["note", id] });
      qc.invalidateQueries({ queryKey: ["saved-notes"] });
      toast.success("Note updated!");
    },
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["saved-notes"] });
      toast.success("Note deleted!");
    },
  });
};

export const useToggleSaveNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, isSaved }: { noteId: number; isSaved: boolean }) =>
      isSaved ? unsaveNote(noteId) : saveNote(noteId),
    onMutate: async ({ noteId, isSaved }) => {
      await qc.cancelQueries({ queryKey: ["notes"] });
      await qc.cancelQueries({ queryKey: ["saved-notes"] });
      await qc.cancelQueries({ queryKey: ["note", noteId] });

      const prevNotes = qc.getQueryData<Note[]>(["notes"]);
      const prevSaved = qc.getQueryData<Note[]>(["saved-notes"]);
      const prevNote = qc.getQueryData<Note>(["note", noteId]);

      // Optimistik update
      qc.setQueryData<Note[]>(["notes"], (old = []) =>
        old.map((n) => (n.id === noteId ? { ...n, isSaved: !isSaved } : n))
      );
      qc.setQueryData<Note>(["note", noteId], (old) =>
        old ? { ...old, isSaved: !isSaved } : old
      );

      if (isSaved) {
        qc.setQueryData<Note[]>(["saved-notes"], (old = []) =>
          old.filter((n) => n.id !== noteId)
        );
      } else {
        if (prevNote) {
          qc.setQueryData<Note[]>(["saved-notes"], (old = []) => [
            { ...prevNote, isSaved: true },
            ...old,
          ]);
        }
      }

      return { prevNotes, prevSaved, prevNote };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevNotes) qc.setQueryData(["notes"], context.prevNotes);
      if (context?.prevSaved) qc.setQueryData(["saved-notes"], context.prevSaved);
      if (context?.prevNote) qc.setQueryData(["note", context.prevNote.id], context.prevNote);
      toast.error("Failed to update save status");
    },
    onSettled: (_data, _error, { noteId }) => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["saved-notes"] });
      qc.invalidateQueries({ queryKey: ["note", noteId] });
    },
  });
};