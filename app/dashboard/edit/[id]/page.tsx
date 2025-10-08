import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { NoteEditor } from "@/components/dashboard/note-editor"

export default function EditNotePage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <NoteEditor noteId={params.id} />
    </DashboardLayout>
  )
}
