
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import NotesListPage from "@/components/dashboard/notes-list"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <NotesListPage />
    </DashboardLayout>
  )
}