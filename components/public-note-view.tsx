"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Save } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface PublicNoteViewProps {
  noteId: string;
}

const mockPublicNotes: Record<
  string,
  { title: string; content: string; author: string }
> = {
  "1": {
    title: "Meeting Notes",
    content:
      "# Meeting Notes\n\nDiscussed project timeline and deliverables...\n\n## Action Items\n- Review requirements\n- Update timeline\n- Schedule follow-up",
    author: "John Doe",
  },
  "2": {
    title: "Ideas for New Feature",
    content:
      "# Ideas for New Feature\n\nUser authentication, note sharing, collaboration...\n\n## Features\n- Real-time collaboration\n- Version history\n- Comments",
    author: "Jane Smith",
  },
  "3": {
    title: "Shopping List",
    content: "# Shopping List\n\n- Milk\n- Eggs\n- Bread\n- Coffee\n- Butter",
    author: "John Doe",
  },
};

export function PublicNoteView({ noteId }: PublicNoteViewProps) {
  const [note, setNote] = useState<{
    title: string;
    content: string;
    author: string;
  } | null>(null);
  const [isLoggedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mockPublicNotes[noteId]) {
      setNote(mockPublicNotes[noteId]);
    }
  }, [noteId]);

  const handleSaveToMyNotes = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    console.log("[v0] Note saved to my notes");
    alert("Note saved to your notes!");
  };

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Note not found</h1>
          <p className="text-muted-foreground">
            This note doesn&apos;t exist or has been deleted.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-semibold text-xl">NoteShare</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button
                size="sm"
                onClick={handleSaveToMyNotes}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save to My Notes"}
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-4">
        <article className="container mx-auto max-w-4xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-balance">
                {note.title}
              </h1>
              <p className="text-muted-foreground">Shared by {note.author}</p>
            </div>

            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                }}
              >
                {note.content}
              </ReactMarkdown>
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Want to create and share your own notes?
          </p>
          <Button asChild>
            <Link href="/signup">Get Started with NoteShare</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
