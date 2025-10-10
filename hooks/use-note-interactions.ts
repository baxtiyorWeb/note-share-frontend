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
      queryClient.invalidateQueries({ queryKey: ['comments', variables.noteId] });
    }
  });
};

export const useGetComments = (noteId: number): UseQueryResult<Comment[], Error> => {
  return useQuery({
    queryKey: ['comments', noteId],
    queryFn: () => getComments(noteId),
    enabled: !!noteId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteComment = () => {
  return useMutation({
    mutationFn: async ({ commentId, noteId }: { commentId: number; noteId: number }) =>
      deleteComment(commentId, noteId),

    onSuccess: (_, variables) => {
      queryClient.setQueryData<Comment[]>(['comments', variables.noteId], (old) =>
        old ? old.filter((c) => c.id !== variables.commentId) : old
      );

      queryClient.invalidateQueries({ queryKey: ['comments', variables.noteId] });
    },
  });
};
