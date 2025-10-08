import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  shareNote,
  getSharedWithMeNotes
} from '@/services/notes-service'; // API service'laringizni to'g'ri yo'ldan import qiling
import type { Note, CreateNoteData, UpdateNoteData } from '@/services/notes-service'; // Tiplaringizni import qiling

// Barcha note'larni olish uchun hook
export const useNotes = (): UseQueryResult<Note[], Error> => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: getAllNotes,
  });
};

// ID bo'yicha bitta note'ni olish uchun hook
export const useNote = (id: number): UseQueryResult<Note, Error> => {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => getNoteById(id),
    enabled: !!id, // Faqat id mavjud bo'lgandagina ishga tushadi
  });
};

// 🚀 Yangi note yaratish uchun optimistik hook
export const useCreateNote = (): UseMutationResult<Note, Error, CreateNoteData> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });

      const previousNotes = queryClient.getQueryData<Note[]>(['notes']);

      queryClient.setQueryData<Note[]>(['notes'], (old = []) => [
        {
          id: Date.now(),
          title: newNote.title,
          content: newNote.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profile: {} as any,
          views: {} as any,
          likes: {} as any,
          comments: [] as any,
        },
        ...old,
      ]);

      return { previousNotes };
    },
    onError: (err, newNote, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

};

// 🚀 Note'ni tahrirlash uchun optimistik hook
export const useUpdateNote = (): UseMutationResult<Note, Error, { id: number; data: UpdateNoteData }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateNote(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      await queryClient.cancelQueries({ queryKey: ['note', id] });

      const previousNotes = queryClient.getQueryData<Note[]>(['notes']);
      const previousNote = queryClient.getQueryData<Note>(['note', id]);

      // Umumiy ro'yxatni optimistik yangilaymiz
      queryClient.setQueryData<Note[]>(['notes'], (old = []) =>
        old.map(note => (note.id === id ? { ...note, ...data } : note))
      );

      // Alohida note sahifasini optimistik yangilaymiz
      if (previousNote) {
        queryClient.setQueryData<Note>(['note', id], { ...previousNote, ...data });
      }

      return { previousNotes, previousNote };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes);
      }
      if (context?.previousNote) {
        queryClient.setQueryData(['note', variables.id], context.previousNote);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
    },
  });
};

// 🚀 Note'ni o'chirish uchun optimistik hook
export const useDeleteNote = (): UseMutationResult<void, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ['notes'] });

      const previousNotes = queryClient.getQueryData<Note[]>(['notes']);

      // Ro'yxatdan o'chirilayotgan note'ni olib tashlaymiz
      queryClient.setQueryData<Note[]>(['notes'], (old = []) =>
        old.filter(note => note.id !== noteId)
      );

      return { previousNotes };
    },
    onError: (err, noteId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

// 🚀 Note'ni ulashish (share) uchun hook (bu yerda optimistik yondashuv shart emas, chunki UI o'zgarishi minimal)
export const useShareNote = (): UseMutationResult<{ message: string; }, Error, { noteId: number; targetProfileId: number }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, targetProfileId }) => shareNote(noteId, targetProfileId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', variables.noteId] });
    },
  });


};
export const useSharedNotes = (): UseQueryResult<Note[], Error> => {
  return useQuery({
    queryKey: ['sharedNotes'],
    queryFn: getSharedWithMeNotes,
  });
};

