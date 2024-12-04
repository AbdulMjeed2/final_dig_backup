"use client";
import axios from "axios";
import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useConfettiStore } from "@/hooks/use-confetti-store";

interface PrepareCertificateModalProps {
  children: React.ReactNode;
  courseId: string;
  examId: string;
}

export const PrepareCertificateModal = ({
  children,
  courseId,
  examId,
}: PrepareCertificateModalProps) => {
  const router = useRouter();
  const { user } = useUser();
  const userFullName = useMemo(() => {
    return `${user?.firstName} ${user?.lastName || ""}`.trim();
  }, [user?.firstName, user?.lastName]);
  const confetti = useConfettiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);

  // Check if the user already has a certificate
  useEffect(() => {
    const checkCertificate = async () => {
      try {
        const response = await axios.get(
          `/api/courses/${courseId}/exam/${examId}/certificate`
        );
        if (response.status === 200 && response.data) {
          setCertificate(response.data); // Certificate exists
        }
      } catch (error) {
        console.error("Error fetching certificate:", error);
      }
    };
    checkCertificate();
  }, [courseId, examId]);

  const requestCertificate = async () => {
    try {
      setIsSubmitting(true);

      // Request to generate the certificate
      const certificateResponse = await axios.post(
        `/api/courses/${courseId}/exam/${examId}/certificate`,
        {
          nameOfStudent: userFullName,
        }
      );

      if (certificateResponse.status === 200) {
        if (certificateResponse.data.id) {
          toast.success("شهادتك جاهزة!");
          await axios.patch(
            `/api/courses/${courseId}/exam/${examId}/certificate/${certificateResponse.data.id}`,
            {
              nameOfStudent: userFullName,
            }
          );
          confetti.onOpen();
          setTimeout(() => {
            router.push(
              `/courses/${courseId}/exam/${examId}/certificate/${certificateResponse.data.id}`
            );
          }, 500);
        } else {
          setIsSubmitting(false);
          toast.error("الشهادة غير جاهزة، حاول مرة أخرى");
        }
      } else {
        setIsSubmitting(false);
        toast.error("لا يمكن إنشاء شهادة في هذا الوقت، آسف!");
      }
    } catch {
      setIsSubmitting(false);
      toast.error("هناك شئ غير صحيح");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">
            احصل على شهادتك
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right">
            تأكيد طلب إصدار الشهادة الخاصة بك
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-x-2" dir="rtl">
          {certificate ? (
            <Button disabled={true} className="bg-gray-500">
              لديك شهادة بالفعل
            </Button>
          ) : (
            <Button onClick={requestCertificate} disabled={isSubmitting}>
              {isSubmitting ? "جاري الطلب..." : "تأكيد"}
            </Button>
          )}
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
