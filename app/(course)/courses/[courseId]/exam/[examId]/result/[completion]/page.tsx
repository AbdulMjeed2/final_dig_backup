"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Banner } from "@/components/banner";
import { PrepareCertificateModal } from "@/components/modals/exam-certificate-modal";
import { Button } from "@/components/ui/button";  // Ensure the Button import is here

type ExamWithQuestionsAndOptions = {
  id: string;
  starterExam: boolean;
  questions: {
    id: string;
    answer: string;
  }[];
};

const ExamPassedResults = ({
  params,
}: {
  params: { courseId: string; examId: string };
}) => {
  const { userId } = useAuth();
  const router = useRouter();

  const [exam, setExam] = useState<ExamWithQuestionsAndOptions | null>(null);
  const [starterExam, setStarterExam] = useState(false);
  const [userSelections, setUserSelections] = useState<{
    [key: string]: number;
  }>({});
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [certificateId, setCertificateId] = useState<string>("");

  // Fetch exam data
  useEffect(() => {
    async function fetchExamData() {
      try {
        const response = await axios.get(`/api/courses/${params.courseId}`);
        const examData = response.data.exams.find(
          (e: any) => e.id === params.examId
        );
        setExam(examData || null);
      } catch (error) {
        console.error("Error fetching exam data:", error);
        toast.error("هناك شئ غير صحيح");
      }
    }
    fetchExamData();
  }, [params.courseId, params.examId]);

  // Update correct, wrong answers, and score percentage
  useEffect(() => {
    if (!exam) return;

    let correct = 0;
    let answered = 0;

    exam.questions.forEach((question) => {
      const userSelectedPosition = userSelections[question.id];
      const correctAnswerPosition = parseInt(question.answer);

      if (userSelectedPosition !== undefined) {
        answered++;
        if (userSelectedPosition === correctAnswerPosition) {
          correct++;
        }
      }
    });

    const wrong = answered - correct;

    setAnsweredQuestions(answered);
    setCorrectAnswers(correct);
    setWrongAnswers(wrong);
    setScorePercentage((correct / exam.questions.length) * 100);
  }, [exam, userSelections]);

  // Handle the condition of exam start
  useEffect(() => {
    if (exam?.starterExam) {
      setStarterExam(true);
    }
  }, [exam]);

  if (!userId) {
    return redirect("/");
  }

  // Navigate to the course page
  const handleNext = () => {
    router.push(`/courses/${params.courseId}`);
  };

  return (
    <div>
      <Banner
        variant={"success"}
        label={`الأسئلة التي تمت الإجابة عليها: ${answeredQuestions} | الإجابات الصحيحة: ${correctAnswers} | الإجابات الخاطئة: ${wrongAnswers}`}
      />
      {starterExam ? (
        <div dir="rtl" className="w-full p-20 flex h-full flex-col gap-4">
          <div className="flex flex-col space-x-4">
            <h1 className="text-lg md:text-xl font-medium capitalize">
              عزيزتي المتدربة انتهى الاختبار القبلي وحصلتي على نسبة{" "}
              {"%" + scorePercentage.toFixed(1)}
            </h1>
            <h1 className="text-base md:text-xl font-medium capitalize">
              وأتمنى لك المتعة والفائدة من دراسة هذه الدورة.
            </h1>
          </div>
          <div className="flex flex-col space-y-4">
            <p>مجموع الاسئلة: {exam?.questions.length}</p>
            <p>عدد الأسئلة الصحيحة: {correctAnswers}</p>
            <p>عدد الأسئلة الخاطئة: {wrongAnswers}</p>
            <p>النسبة المئوية: % {scorePercentage.toFixed(1)}</p>
          </div>
          {/* <button
            type="button"
            onClick={handleNext}
            className="bg-sky-500 text-white w-fit font-bold text-sm px-4 py-2 rounded-md"
          >
            تقدم
          </button> */}
        </div>
      ) : (
        <div dir="rtl" className="w-full p-20 flex h-full flex-col gap-4">
          <div className="flex flex-col space-x-4">
            <h1 className="text-lg md:text-xl font-medium capitalize">
              لقد اجتزت الاختبار بنجاح، ويمكنك الآن الحصول على الشهادة
            </h1>
          </div>
          <div className="flex flex-col space-y-4">
            <p>مجموع الاسئلة: {exam?.questions.length}</p>
            <p>عدد الأسئلة الصحيحة: {correctAnswers}</p>
            <p>عدد الأسئلة الخاطئة: {wrongAnswers}</p>
            <p>النسبة المئوية: % {scorePercentage.toFixed(1)}</p>
          </div>
            <PrepareCertificateModal
              courseId={params.courseId}
              examId={params.examId}
              // certificateId={certificateId}
            >
              <Button
                size="sm"
                className="bg-sky-500 text-white hover:bg-sky-400 w-fit"
              >
                احصل على شهادتك
              </Button>
            </PrepareCertificateModal>
        </div>
      )}
    </div>
  );
};

export default ExamPassedResults;
