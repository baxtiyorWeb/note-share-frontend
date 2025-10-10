import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NotebookPen, Plus } from "lucide-react";
import Link from "next/link";

export function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center min-h-[60vh] text-center">
      <div className="flex flex-col items-center gap-6 p-10 rounded-2xl bg-muted/50 border-2 border-dashed">
        <NotebookPen className="w-12 h-12 text-primary" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Your Notebook is Empty</h2>
          <p className="text-muted-foreground max-w-sm">Let&apos;s start by creating your first note!</p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/new"><Plus className="w-5 h-5 mr-2" /> Create First Note</Link>
        </Button>
      </div>
    </motion.div>
  );
}