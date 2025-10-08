import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import MyNotesPage from "@/components/dashboard/notes-list"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Notes</h1>
          <p className="text-muted-foreground mt-2">Manage and organize your notes</p>
        </div>
        <MyNotesPage />
      </div>
    </DashboardLayout>
  )
}
