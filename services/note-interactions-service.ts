import api from "@/config/api";

export interface ViewResponse {
  message: string;
  totalViews: number;
}

export interface LikeResponse {
  liked: boolean;
  totalLikes: number;
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface AddCommentResponse {
  message: string;
  comment: Comment;
}

export const addView = async (noteId: number): Promise<ViewResponse> => {
  const response = await api.post(`/notes/${noteId}/view`);
  return response.data;
};

export const toggleLike = async (noteId: number): Promise<LikeResponse> => {
  const response = await api.post(`/notes/${noteId}/like`);
  return response.data;
};

export const addComment = async (noteId: number, text: string): Promise<AddCommentResponse> => {
  const response = await api.post(`/notes/${noteId}/comment`, { text });
  return response.data;
};

export const getComments = async (noteId: number): Promise<Comment[]> => {
  const response = await api.get(`/notes/${noteId}/comments`);
  return response.data;
};

export const deleteComment = async (commentId: number): Promise<{ message: string }> => {
  const response = await api.delete(`/notes/${commentId}/comment`);
  return response.data;
};