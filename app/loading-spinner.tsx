import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-white/60 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-sky-700" />
    </div>
  );
}
