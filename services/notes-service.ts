// services/notes-service.ts
import api from "@/config/api";
import { Note } from "@/types";

export interface CreateNoteData {
  title: string;
  content: string;
  isPublic: boolean;
  reminder_at?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  isPublic?: boolean;
  reminder_at?: string | null;
}

// CRUD
export const createNote = async (data: CreateNoteData): Promise<Note> => {
  const res = await api.post("/notes", data);
  return res.data;
};

export const getAllNotes = async (): Promise<Note[]> => {
  const res = await api.get("/notes");
  return res.data;
};

export const getSharedWithMeNotes = async (): Promise<Note[]> => {
  const res = await api.get("/notes/shared-with-me");
  return res.data;
};

export const getSavedNotes = async (): Promise<Note[]> => {
  const res = await api.get("/notes/saved-notes");
  return res.data;
};

export const getNoteById = async (id: number): Promise<Note> => {
  const res = await api.get(`/notes/${id}`);
  return res.data;
};

export const updateNote = async (id: number, data: UpdateNoteData): Promise<Note> => {
  const res = await api.patch(`/notes/${id}`, data);
  return res.data;
};

export const deleteNote = async (id: number): Promise<void> => {
  await api.delete(`/notes/${id}`);
};

export const shareNote = async (
  noteId: number,
  targetProfileId: number
): Promise<{ message: string; sharedWith: { id: number; username: string }[] }> => {
  const res = await api.post(`/notes/${noteId}/share`, { targetProfileId });
  return res.data;
};

export const saveNote = async (noteId: number): Promise<{ message: string; isSaved: boolean }> => {
  if (!noteId) {
    throw new Error("Note ID is required for save operation.");
  }
  const res = await api.post(`/notes/${noteId}/save`);
  return res.data;
};

export const unsaveNote = async (noteId: number): Promise<{ message: string; isSaved: boolean }> => {
  if (!noteId) {
    throw new Error("Note ID is required for unsave operation.");
  }
  const res = await api.delete(`/notes/${noteId}/save`);
  return res.data;
};