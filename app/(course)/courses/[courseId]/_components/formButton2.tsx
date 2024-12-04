"use client";

import { useState, useEffect } from "react";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const FormButton2 = ({
  text,
  url,
  passedText,
}: {
  text: string;
  url: string;
  passedText: string;
}) => {
  // Need backend working to get the correct URL to the forms.

  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("formSubmitted")) {
      setHasSubmitted(true);
    }
  }, []);

  const handleClick = () => {
    if (!hasSubmitted) {
      window.open(url, "_blank");
      localStorage.setItem("formSubmitted", "true");
      setHasSubmitted(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      disabled={hasSubmitted}
      className={cn(
        "flex items-center justify-end w-full gap-x-2 text-sm font-[500] transition-all px-3 py-2 border-r-4",
        hasSubmitted
          ? "text-gray-400 border-gray-400 cursor-not-allowed"
          : "text-green-600 border-green-700 hover:text-green-700 hover:bg-green-300/20"
      )}
    >
      <div className="flex items-center justify-between text-right w-full gap-x-2">
        <PlayCircle
          size={18}
          className={cn(
            "flex-shrink-0 rounded-md",
            hasSubmitted
              ? "text-gray-400"
              : "text-green-500 hover:text-green-700"
          )}
        />
        <div className="text-sm">
          {hasSubmitted ? passedText : text}
        </div>
      </div>
    </button>
  );
};
