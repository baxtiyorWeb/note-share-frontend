"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useSharedNotes } from "@/hooks/use-note";
import { useAddView } from "@/hooks/use-note-interactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw"; // ✅ --- HTMLni render qilish uchun plaginni import qilamiz ---
import { Loader2, Share2, Clock, Heart, Eye, MessageCircle, X } from "lucide-react";

// --- INTERFACES ---
interface Profile {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: string | Date;
  profile: Profile;
  views: { id: number }[];
  likes: { id: number }[];
  comments: any[];
}


// --- HELPER FUNCTIONS ---
const getInitials = (profile: any) => {
  if (!profile) return "U";
  const name = profile.username || profile.firstName || "User";
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

/**
 * ✅ FIX: Bu funksiya kartochkadagi prevyu uchun HTML teglarni tozalaydi
 */
const stripHtml = (htmlString: string) => {
  if (!htmlString) return "";
  // Barcha <...> ko'rinishidagi teglarni bo'sh joy bilan almashtiradi
  const plainText = htmlString.replace(/<[^>]*>/g, ' ');
  // Ortiqcha probellarni tozalaydi
  return plainText.replace(/\s\s+/g, ' ').trim();
};


// --- MAIN PAGE COMPONENT ---
export default function SharedNotesPage() {
  const { data: sharedNotes, isLoading } = useSharedNotes();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addViewMutation = useAddView(selectedNote!?.id);

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
    if (note.id) {
      addViewMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Share2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Shared with Me</h1>
            <p className="text-muted-foreground">{sharedNotes?.length || 0} note{sharedNotes?.length !== 1 ? 's' : ''} shared</p>
          </div>
        </motion.div>

        {!sharedNotes || sharedNotes.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-lg mt-6">
            <Share2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No shared notes</h3>
            <p className="mt-1 text-sm text-gray-500">Notes that others share with you will appear here.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {sharedNotes.map((note) => (
              <motion.div key={note.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="h-full">
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-transparent hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={note.profile.avatar} />
                        <AvatarFallback>{getInitials(note.profile)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                        <CardDescription>Shared by {note.profile.username}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {/* ✅ FIX: Kartochkada tozalangan matnni ko'rsatamiz */}
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {stripHtml(note.content) || "No content."}
                    </p>
                  </CardContent>
                  <div className="p-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {note.likes.length}</span>
                      <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {note.comments.length}</span>
                      <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {note.views.length}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleViewNote(note)}>
                      View full note
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Full Note Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent style={{ maxWidth: "100%", width: "1000px", height: "90vh" }}
          className="flex flex-col p-0">
          {selectedNote && (
            <>
              <DialogHeader className="p-6 border-b flex-shrink-0 relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedNote.profile.avatar} />
                      <AvatarFallback>{getInitials(selectedNote.profile)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl font-bold">{selectedNote.title}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1">
                        Shared by {selectedNote.profile.username}
                        <span className="text-gray-400">•</span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(selectedNote.updatedAt)}
                        </Badge>
                      </DialogDescription>
                    </div>
                  </div>

                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]} // <--- PLAGIN SHU YERDA ISHLATILADI
                  >
                    {selectedNote.content || "*No content provided.*"}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {selectedNote.likes.length}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {selectedNote.comments.length}</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {selectedNote.views.length}</span>
                </div>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}