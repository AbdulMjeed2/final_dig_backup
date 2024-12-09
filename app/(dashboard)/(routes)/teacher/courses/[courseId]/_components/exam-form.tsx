"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trash, Loader2, Pencil, PlusCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Course, Exam } from "@prisma/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@radix-ui/react-label";

interface ExamFormProps {
  initialData: any;
  courseId: string;
}

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["exam", "form"]),
  examUrl: z.string().min(0), // Required only if type is 'form'
});

export const ExamForm = ({ initialData, courseId }: ExamFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      examUrl: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/exam`, values);
      toast.success("تم إنشاء الامتحان/الرابط");
      setIsCreating(false);
      router.refresh();
    } catch (error) {
      //toast.error("هناك شئ غير صحيح");
      console.error("هناك شئ غير صحيح");
    }
  };

  const FinalExams = initialData.exams?.filter(
    (e: any) => e.starterExam === false
  );

  const onEdit = (id: string | undefined) => {
    router.push(`/teacher/courses/${courseId}/exam/${id}`);
  };

  const onDelete = async (id: string | undefined) => {
    try {
      await axios.delete(`/api/courses/${courseId}/exam/${id}`);
      toast.success("تم حذف العنصر");
      router.refresh();
    } catch (error) {
      toast.error("فشل في الحذف");
    }
  };

  return (
    <div className="relative mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        امتحان الدورة / رابط النموذج
        {!(FinalExams.length > 0) && (
          <Button onClick={() => setIsCreating(true)} variant="ghost">
            <PlusCircle className="h-4 w-4 mr-2" />
            إضافة
          </Button>
        )}
      </div>
      {isCreating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="flex items-center gap-2 border p-2 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          value="exam"
                          checked={field.value === "exam"}
                          onChange={field.onChange}
                        />
                        الاختبار
                      </label>
                      <label className="flex items-center gap-2 border p-2 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          value="form"
                          checked={field.value === "form"}
                          onChange={field.onChange}
                        />
                        المقياس
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Label>-عنوان:</Label>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. 'امتحان تطوير الويب'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Label className="mt-2">وصف:</Label>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="e.g. '...هذا سيساعدك'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("type") === "form" && (
              <FormField
                control={form.control}
                name="examUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g. https://example.com/form"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button
              disabled={!isValid || isSubmitting}
              type="submit"
              className="mt-4"
            >
              إنشاء
            </Button>
          </form>
        </Form>
      )}
      {!isCreating && (
        <div
          className={cn("text-sm mt-2", !FinalExams && "text-slate-500 italic")}
        >
          {FinalExams.map((exam: any, index: number) => (
            <div
              key={index}
              className={cn(
                "flex justify-between items-center py-3 pl-3 gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm"
              )}
            >
              <div className="ml-auto pr-2 flex items-center gap-x-2">
                <Badge
                  className={cn(
                    "bg-slate-500",
                    exam.isPublished && "bg-sky-700"
                  )}
                >
                  {exam.isPublished ? "نشرت" : "مسودة"}
                </Badge>
                <Trash
                  onClick={() => onDelete(exam.id)}
                  className="w-4 h-4 cursor-pointer hover:opacity-75 transition"
                />
                {!exam.examUrl && (
                  <Pencil
                    onClick={() => onEdit(exam.id)}
                    className="w-4 h-4 cursor-pointer hover:opacity-75 transition"
                  />
                )}
              </div>
              <div>{exam.examUrl ? exam.examUrl : exam.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
