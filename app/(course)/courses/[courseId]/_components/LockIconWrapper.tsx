// LockIconWrapper.tsx
import { LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockIconWrapperProps {
  className?: string;
  size?: number;
}

const LockIconWrapper = ({ className, size = 22 }: LockIconWrapperProps) => (
  <LockIcon
    size={size}
    className={cn("min-w-[22px] min-h-[22px]", className)}
  />
);

export default LockIconWrapper;
