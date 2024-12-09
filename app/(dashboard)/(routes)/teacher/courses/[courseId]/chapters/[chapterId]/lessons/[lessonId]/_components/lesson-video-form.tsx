"use client";

import * as z from "zod";
import axios from "axios";
import { Pencil, PlusCircle, Video, Trash } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Lesson } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import ReactPlayer from "react-player";

interface LessonVideoFormProps {
  initialData: Lesson;
  courseId: string;
  chapterId: string;
  lessonId: string;
}

const formSchema = z.object({
  videoUrl: z.string().min(1),
});

export const LessonVideoForm = ({
  initialData,
  courseId,
  chapterId,
  lessonId,
}: LessonVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const toggleEdit = () => setIsEditing((current) => !current);
  
  const router = useRouter();
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
        values
      );
      toast.success("تم تحديث الدرس");
      toggleEdit();
      router.refresh();
    } catch {
      //toast.error("هناك شئ غير صحيح");
      console.error("هناك شئ غير صحيح");
    }
  };
  
  const onDelete = async () => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
        { videoUrl: "" }
      );

      // Also delete from uploadthing
      await axios.delete('/api/uploadthing/', {
        data: {
          videoUrl: initialData.videoUrl
        }
      });

      toast.success("تم حذف الفيديو");
      toggleEdit();
      router.refresh();
    } catch {
      console.error("هناك شئ غير صحيح");
    }
  };
  
  return (
    <div className="mt-6 border bg-slate-100 max-h-full rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        فيديو الدرس
        <div>
          {initialData.videoUrl && (
            <Button onClick={onDelete} variant="ghost" className="mr-2">
              <Trash className="h-4 w-4 mr-2" />
              حذف الفيديو
            </Button>
          )}
          <Button onClick={toggleEdit} variant="ghost">
            {isEditing && <>إلغاء</>}
            {!isEditing && !initialData.videoUrl && (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                أضف فيديو
              </>
            )}
            {!isEditing && initialData.videoUrl && (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                تحرير الفيديو
              </>
            )} 
          </Button>
        </div>
      </div>
      {!isEditing &&
        (!initialData.videoUrl ? (
          <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
            <Video className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <ReactPlayer
              height={"100%"}
              width={"100%"}
              className="h-full"
              url={initialData.videoUrl}
              playing={false}
              controls={true}
            />
          </div>
        ))}
      {isEditing && (
        <div>
          <FileUpload
            endpoint="lessonVideo"
            onChange={(url) => {
              if (url) {
                onSubmit({ videoUrl: url });
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
