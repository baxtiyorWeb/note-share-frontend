// src/services/notes-service.ts
import api from "@/config/api";
import { NoteComment, NoteLike, NoteView } from "@/types";
import { Profile } from "./profile-service";

export interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
  views: NoteView[];
  likes: NoteLike[];
  comments: NoteComment[];
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
  profile: Profile;
}
export interface CreateNoteData {
  title: string;
  content: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export const createNote = async (data: CreateNoteData): Promise<Note> => {
  const response = await api.post('/notes', data);
  return response.data;
};

// Bu endi FAQAT o'zingizning notelaringizni oladi
export const getAllNotes = async (): Promise<Note[]> => {
  const response = await api.get('/notes');
  return response.data;
};

// ✅ YANGI FUNKSIYA QO'SHILDI
export const getSharedWithMeNotes = async (): Promise<Note[]> => {
  const response = await api.get('/notes/shared-with-me');
  return response.data;
}

export const getNoteById = async (id: number): Promise<Note> => {
  const response = await api.get(`/notes/${id}`);
  return response.data;
};

export const updateNote = async (id: number, data: UpdateNoteData): Promise<Note> => {
  const response = await api.patch(`/notes/${id}`, data);
  return response.data;
};

export const deleteNote = async (id: number): Promise<void> => {
  await api.delete(`/notes/${id}`);
};

export const shareNote = async (noteId: number, targetProfileId: number): Promise<{ message: string; sharedWith: { id: number; username: string }[] }> => {
  const response = await api.post(`/notes/${noteId}/share`, { targetProfileId });
  return response.data;
};