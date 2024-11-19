"use client";

import { useState, useEffect } from "react";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const FormButton2 = () => {
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check local storage on component mount
  useEffect(() => {
    const formSubmitted = localStorage.getItem("formSubmitted");
    setHasSubmitted(formSubmitted === "true");
  }, []);

  const handleClick = () => {
    if (!hasSubmitted) {
      window.open("https://forms.google.com/your-form-url", "_blank");
      localStorage.setItem("formSubmitted", "true"); // Mark as submitted
      setHasSubmitted(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      disabled={hasSubmitted} // Disable the button if already submitted
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
            "flex-shrink-0",
            hasSubmitted ? "text-gray-400" : "text-green-500 hover:text-green-700"
          )}
        />
        <div className="text-sm">
          {hasSubmitted ? "Form Submitted" : "Form"}
        </div>
      </div>
    </button>
  );
};
