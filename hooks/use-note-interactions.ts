// src/hooks/useNoteInteractions.ts
import { useMutation, useQuery, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import {
  addView,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
  ViewResponse,
  LikeResponse,
  AddCommentResponse,
  Comment
} from '@/services/note-interactions-service';

export const useAddView = (noteId: number): UseMutationResult<ViewResponse, Error, void> => {
  return useMutation({
    mutationFn: () => addView(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['sharedNotes'] });
    },
  });
};

export const useToggleLike = (noteId: number): UseMutationResult<LikeResponse, Error, void> => {
  return useMutation({
    mutationFn: () => toggleLike(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['sharedNotes'] });
    },
  });
};

export const useAddComment = (): UseMutationResult<AddCommentResponse, Error, { noteId: number; text: string }> => {
  return useMutation({
    mutationFn: ({ noteId, text }) => addComment(noteId, text),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['comments', variables.noteId], (old: Comment[] | undefined) =>
        old ? [...old, data.comment] : [data.comment]
      );
    },
  });
};

export const useGetComments = (noteId: number): UseQueryResult<Comment[], Error> => {
  return useQuery({
    queryKey: ['comments', noteId],
    queryFn: () => getComments(noteId),
    enabled: !!noteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDeleteComment = (): UseMutationResult<{ message: string }, Error, number> => {
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(['comments'], (old: Comment[] | undefined) =>
        old ? old.filter(c => c.id !== commentId) : old
      );
    },
  });
};