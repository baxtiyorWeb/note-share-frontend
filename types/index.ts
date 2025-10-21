// 📁 app/dashboard/notes/types/index.ts

export interface Profile {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  name?: string;
}

export interface NoteView {
  id: number;
  createdAt: string;
  viewer: Profile;
}

export interface NoteLike {
  id: number;
  createdAt: string;
  profile: Profile;
}

export interface NoteComment {
  id: number;
  text: string;
  createdAt: string;
  author: Profile;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
  views: NoteView[];
  likes: NoteLike[];
  comments: NoteComment[];
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  profile: Profile; // Eslatma muallifi
  sharedWith?: Profile[];
}