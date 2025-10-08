import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NoteEditor } from "@/components/dashboard/note-editor";

export default function NewNotePage() {
  return (
    <DashboardLayout>
      <NoteEditor />
    </DashboardLayout>
  );
}
