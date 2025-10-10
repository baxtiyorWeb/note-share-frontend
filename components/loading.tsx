import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]" >
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }
      }>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </motion.div>
    </div>
  );
}