import { PublicNoteView } from "@/components/public-note-view";

export default function PublicNotePage({ params }: { params: { id: string } }) {
  return <PublicNoteView noteId={params.id} />;
}
