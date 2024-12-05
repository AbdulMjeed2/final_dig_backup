"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Preview } from "@/components/preview";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import { Chapter, Course, Prisma } from "@prisma/client";
import axios from "axios";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { Banner } from "@/components/banner";
import Link from "next/link";
import FroalaEditorView from "react-froala-wysiwyg/FroalaEditorView";
import { Check, X } from "lucide-react";

type QuizWithQuestionsAndOptions = Prisma.QuizGetPayload<{
  include: {
    certificate: true;
    questions: {
      where: {
        isPublished: true;
      };
      include: {
        options: true;
      };
    };
  };
}>;

const ExamIdPage = ({
  params,
}: {
  params: { courseId: string; quizId: string; chapterId: string };
}) => {
  const { userId } = useAuth();

  const router = useRouter();

  const confetti = useConfettiStore();

  const [course, setCourse] = useState<Course | null>();

  const [quiz, setQuiz] = useState<QuizWithQuestionsAndOptions | null>();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasSubmitted, sethasSubmitted] = useState<boolean>(false);

  const [canSubmit, setCanSubmit] = useState<boolean>(false);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // State to store the user's selected options
  const [userSelections, setUserSelections] = useState<{
    [key: string]: number;
  }>({});

  // Calculate the time per question (5 minutes)
  const TIME_PER_QUESTION_MS = 5 * 60 * 1000;

  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [disableSelect, setDisableSelect] = useState(false);
  const [points, setPoints] = useState<number>(0);
  const [wrongAnswersQuiz, setWrongAnswersQuiz] = useState<string[]>([]);
  const hasTakenQuiz = quiz && quiz.userId !== "nil";

  // Check if userSelections has any members
  const hasUserSelections = Object.keys(userSelections).length > 0;
  useEffect(() => {
    async function get() {
      const { data } = await axios.get(
        `/api/courses/${params.courseId}/chapters/${params.chapterId}/quiz/${params.quizId}/progress`
      );

      if (data) {
        setUserSelections(JSON.parse(data.options));
        setDisableSelect(true);
      }
    }
    get();
  }, []);
  const handleOptionChange = (questionId: string, optionPosition: number) => {
    sethasSubmitted(false);
    setUserSelections((prevSelections) => ({
      ...prevSelections,
      [questionId]: optionPosition,
    }));
    setDisableSelect(false);
  };

  const resetQuiz = () => {
    setUserSelections({});
    sethasSubmitted(false);
    setDisableSelect(false);
  };

  const isOptionSelected = (questionId: string, optionPosition: number) => {
    return userSelections[questionId] === optionPosition;
  };

  const handleSubmit = useCallback(async () => {
    if (!quiz || !hasUserSelections) return;
    setDisableSelect(true);
    setIsSubmitting(true);
    sethasSubmitted(true);

    try {
      const response = await axios.patch(
        `/api/courses/${params.courseId}/chapters/${params.chapterId}/quiz/${quiz.id}`,
        {
          userId: userId,
        }
      );

      if (points !== undefined) {
        // Check to ensure points is defined
        const quizResponse = await axios.put(
          `/api/courses/${params.courseId}/chapters/${params.chapterId}/quiz/${quiz.id}/progress`,
          {
            points,
            userSelections,
          }
        );

        sethasSubmitted(true); // Set hasSubmitted to true only after successful submission

        if (points > 50) {
          toast.success(`احسنت لقد حصلت على ${points.toFixed(1)}`, {
            duration: 4000,
          });
        } else {
          toast.success(`لقد حصلت على ${points.toFixed(1)}`, {
            duration: 4000,
          });
        }
      } else {
        if (points !== undefined) {
          // Ensure points has a value before showing the toast
          toast.success(`لقد حصلت على ${points}`, {
            duration: 4000,
          });
        }
      }

      router.refresh();
    } catch (error) {
      toast.error("هناك خطأ ما");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    confetti,
    hasUserSelections,
    params.chapterId,
    params.courseId,
    points,
    quiz,
    router,
    userId,
  ]);

  // Fetch the quiz data and update the time remaining
  useEffect(() => {
    if (quiz) {
      // Calculate the total time based on the number of questions
      const totalTime = quiz.questions.length * TIME_PER_QUESTION_MS;
    }
  }, [TIME_PER_QUESTION_MS, quiz]);

  // Function to decrement the time remaining every second

  useEffect(() => {
    if (hasTakenQuiz && hasSubmitted) {
      sethasSubmitted(true);
    }
  }, [hasSubmitted, hasTakenQuiz]);

  useEffect(() => {
    if (hasSubmitted) return;
    const totalQuestions = quiz?.questions.length;

    let correct = 0;
    let answered = 0;
    let wrong = 0;

    if (!totalQuestions) return;

    const wrongAnswersQuizTemp: string[] = [];
    quiz?.questions.forEach((question) => {
      const questionId = question.id;
      const userSelectedPosition = userSelections[question.id];
      const correctAnswerPosition = parseInt(question.answer) - 1;
      if (userSelectedPosition !== undefined) {
        answered++;
        if (userSelectedPosition === correctAnswerPosition) {
          correct++;
        } else {
          wrong++;
          wrongAnswersQuizTemp.push(questionId);
        }
      }
    });
    setWrongAnswersQuiz(wrongAnswersQuizTemp);
    setAnsweredQuestions(answered);
    setCorrectAnswers(correct);
    setWrongAnswers(wrong);
    setPoints((correct / totalQuestions) * 100);

    // Enable submission when all questions are answered
    setCanSubmit(answered === totalQuestions);
  }, [userSelections, hasSubmitted, quiz?.questions]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [chapterResponse, courseResponse] = await Promise.all([
          axios.get(
            `/api/courses/${params.courseId}/chapters/${params.chapterId}`
          ),
          axios.get(`/api/courses/${params.courseId}`),
        ]);

        setQuiz(chapterResponse.data.quiz);
        setCourse(courseResponse.data);
      } catch (error) {
        //toast.error("هناك شئ غير صحيح");
        console.error("هناك شئ غير صحيح");
      }
    }

    fetchData();
  }, [params.chapterId, params.courseId, userId]);

  // New functionality to get the user's progress on the quiz
  useEffect(() => {
    async function get() {
      const { data } = await axios.get(
        `/api/courses/${params.courseId}/chapters/${params.chapterId}/quiz/${params.quizId}/progress`
      );
  
      if (data) {
        console.log(data);
        const userSelections = JSON.parse(data.options);
        setUserSelections(userSelections);
        setDisableSelect(true);
        sethasSubmitted(true);
  
        // Calculate wrongAnswersQuiz
        const wrongAnswersQuizTemp: string[] = [];
        quiz?.questions.forEach((question) => {
          const questionId = question.id;
          const userSelectedPosition = userSelections[question.id];
          const correctAnswerPosition = parseInt(question.answer) - 1;
          if (userSelectedPosition !== undefined && userSelectedPosition !== correctAnswerPosition) {
            wrongAnswersQuizTemp.push(questionId);
          }
        });
        setWrongAnswersQuiz(wrongAnswersQuizTemp);
      }
    }
    get();
  }, [params.courseId, params.chapterId, params.quizId, quiz]);

  
  if (!userId) {
    return redirect("/");
  }

  return (
    <>
      {quiz ? (
        <div>
          {hasSubmitted ? (
            <Banner
              variant={"success"}
              label={`:الأسئلة التي تمت الإجابة عليها ${answeredQuestions}    |    الإجابات الصحيحة: ${correctAnswers}    |    إجابات خاطئة: ${wrongAnswers} `}
            />
          ) : (
            <div className="w-full flex flex-col justify-center items-end h-12 pt-12 px-6">
              <div className="flex space-x-4 items-center mb-2" dir="rtl">
                <h1 className="text-lg md:text-2xl font-medium capitalize">
                  {course?.title}
                </h1>
                <span className="mx-4">|</span>

                <h1 className="text-lg md:text-2xl font-medium capitalize">
                  {quiz?.title}
                </h1>
                <span className="mx-4">|</span>
                <h1 className="text-lg md:text-2xl font-medium capitalize">
                  مجموع الأسئلة {quiz?.questions.length}
                </h1>
              </div>
              <div className="flex space-x-3 ">
                {/* <div className="text-md">
                  {canSubmit} أسئلة تمت الإجابة عليها {answeredQuestions}
                </div> */}
              </div>
            </div>
          )}

          <div className="flex flex-col px-10 mt-10  items-center relative">
            {quiz?.questions
              .sort((a, b) => a.position - b.position)
              .map((question, index) => (
                <CarouselItem key={index} className="w-full mb-4">
                  <div className="bg-sky-100 border border-slate-200 rounded-lg p-4 max-w-full">
                    <div className="w-full flex h-fit flex-col items-end">
                      <div className="font-medium text-slate-500 mb-4 text-right">
                        سؤال {index + 1}
                      </div>
            
                      <div
                        className="text-slate-700 font-bold text-lg mb-2"
                        dir="rtl"
                      >
                        <FroalaEditorView model={question.prompt} />
                      </div>
            
                      <div className="flex flex-col items-end space-y-2 w-full mb-4">
                        {question.options
                          .sort((a, b) => a.position - b.position)
                          .map((option, optionIndex) => (
                            <div
                              key={option.id}
                              className="w-full flex justify-end"
                            >
                              {hasSubmitted ? (
                                <div
                                  className={`flex w-[500px] max-w-full rounded-md p-2 transition-all space-x-2 justify-between ${
                                    isOptionSelected(question.id, optionIndex)
                                      ? option.position ===
                                        parseInt(question.answer)
                                        ? "bg-green-200"
                                        : "bg-red-100"
                                      : ""
                                  }`}
                                >
                                  {isOptionSelected(question.id, optionIndex) &&
                                    (optionIndex + 1 ===
                                    parseInt(question.answer) ? (
                                      <Check className="text-green-700" />
                                    ) : (
                                      <X className="text-red-700" />
                                    ))}
                                  <div className="flex gap-2 ml-auto">
                                    <label className="capitalize text-sm">
                                      {option.text}
                                    </label>
                                    <input
                                      className="mr-2"
                                      type="radio"
                                      name={question.id}
                                      disabled={disableSelect}
                                      checked={isOptionSelected(
                                        question.id,
                                        optionIndex
                                      )}
                                      onChange={() =>
                                        handleOptionChange(
                                          question.id,
                                          optionIndex
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                <label
                                  className="flex justify-end space-x-2 p-2 border w-[500px] cursor-pointer max-w-full border-[#dbe9fe] rounded-md"
                                  htmlFor={option.id}
                                >
                                  <span className="block capitalize text-sm">
                                    {option.text}
                                  </span>
                                  <input
                                    id={option.id}
                                    className="mr-2"
                                    type="radio"
                                    disabled={disableSelect}
                                    name={question.id}
                                    value={optionIndex + 1}
                                    checked={isOptionSelected(
                                      question.id,
                                      optionIndex
                                    )}
                                    onChange={() =>
                                      handleOptionChange(
                                        question.id,
                                        optionIndex
                                      )
                                    }
                                  />
                                </label>
                              )}
                            </div>
                          ))}
            
                        {/* Show explanation for wrong answers */}
                        {wrongAnswersQuiz.includes(question.id) && (
                          <div
                            className="mb-4 p-4 w-full flex flex-col gap-2 border border-black rounded-lg text-xs"
                            dir="rtl"
                          >
                            <p className="text-right text-lg">تفسير الاجابة</p>
                            {question.explanation ? (
                              <FroalaEditorView
                                config={{ direction: "rtl" }}
                                model={question.explanation}
                              />
                            ) : (
                              "لا يوجد تفسير"
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}

            <div className="flex flex-col justify-end items-end w-full space-y-3 mr-8 md:mr-20">
              <div className="flex flex-row space-x-4 items-center">
                {hasSubmitted ? (
                  <Link
                    href={`/courses/${params.courseId}`}
                    className={cn(
                      "bg-sky-600 mb-6 text-white w-fit font-bold text-sm px-4 py-2 rounded-md"
                    )}
                  >
                    اكمال الدورة التدريبية
                  </Link>
                ) : !disableSelect ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className={cn(
                      "bg-sky-700 mb-6 text-white w-fit font-bold text-sm px-4 py-2 rounded-md",
                      (!canSubmit || isSubmitting || hasSubmitted) &&
                        "bg-slate-400 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    تقدم
                  </button>
                ) : (
                  ""
                )}
                {disableSelect ? (
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className={cn(
                      "bg-sky-600 mb-6 text-white w-fit font-bold text-sm px-4 py-2 rounded-md"
                    )}
                  >
                    إعادة النشاط
                  </button>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <div className="font-bold text-2xl text-slate-500 animate-pulse">
            ...جارٍ تحميل الأسئلة
          </div>
        </div>
      )}
    </>
  );
};

export default ExamIdPage;
