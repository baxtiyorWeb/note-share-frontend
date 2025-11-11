// 📁 src/types/note.ts

export interface Profile {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  name?: string;
  notesCount?: number;
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
  totalViews?: number;
  totalLikes: number;
  totalComments: number;
  commentsCount: number;
  viewsCount?: number;
  likesCount?: number;
  profile: Profile;
  sharedWith?: Profile[];
  createdAt?: any;
  is_code_mode?: boolean;
  code_language?: string;
  reminder_at?: string;
  tags?: string;
  isPublic?: boolean;
  seo_slug?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  allow_comments?: boolean;
  share_to_twitter?: boolean;

}

export interface User {
  id: number;
  email: string;
  profile: Profile;
}
