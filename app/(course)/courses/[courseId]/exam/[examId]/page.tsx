"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";

import { Preview } from "@/components/preview";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import { Prisma, Certificate, Course } from "@prisma/client";
import axios from "axios";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { getProgress } from "@/actions/get-progress";
import { Banner } from "@/components/banner";
import { PrepareCertificateModal } from "@/components/modals/exam-certificate-modal";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { escape } from "querystring";
import FroalaEditorView from "react-froala-wysiwyg/FroalaEditorView";
import { FormButton2 } from "../../_components/formButton2";

type ExamWithQuestionsAndOptions = Prisma.ExamGetPayload<{
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
  params: { courseId: string; examId: string };
}) => {
  const { userId } = useAuth();

  const confetti = useConfettiStore();

  const [exam, setExam] = useState<ExamWithQuestionsAndOptions | null>();

  const [course, setCourse] = useState<Course | null>();

  const [certificateId, setCertificateId] = useState("");

  const [progressCount, setProgressCount] = useState<number>();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasSubmitted, sethasSubmitted] = useState<boolean>(false);

  const [canSubmit, setCanSubmit] = useState<boolean>(false);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const [failedInExam, setFailedInExam] = useState<boolean>(false);

  const [isFirstExam, setFirstExam] = useState<boolean>(false);
  // State to store the user's selected options
  const [userSelections, setUserSelections] = useState<{
    [key: string]: number;
  }>({});

  // Calculate the time per question (5 minutes)
  const TIME_PER_QUESTION_MS = 5 * 60 * 1000;
  const router = useRouter();
  const [answeredQuestions, setAnswersQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [disableSelect, setDisableSelect] = useState(false);
  const [alreadyPassed, setAlreadyPassed] = useState(false);

  const [scorePercentage, setScorePercentage] = useState(0);
  useEffect(() => {
    async function get() {
      const { data } = await axios.get(
        `/api/courses/${params.courseId}/exam/${params.examId}/progress`
      );
      console.log(data);
      if (data) {
        setUserSelections(JSON.parse(data.options));
        setDisableSelect(true);
      }
    }
    get();
  }, []);
  const hasTakenTheExamBefore =
    exam && exam.userId !== "nil" && exam.beforeScore;

  const hasUserSelections = Object.keys(userSelections).length > 0;

  const handleOptionChange = (questionId: string, optionPosition: number) => {
    setUserSelections((prevSelections) => ({
      ...prevSelections,
      [questionId]: optionPosition,
    }));

    const isCorrectAnswer = (
      question: {
        options: {
          id: string;
          questionId: string;
          text: string;
          position: number;
        }[];
      } & {
        id: string;
        examId: string;
        prompt: string;
        position: number;
        answer: string;
        isPublished: boolean;
        explanation: string | null;
        createdAt: Date;
        updatedAt: Date;
      },
      optionPosition: number
    ) => {
      return parseInt(question.answer) === optionPosition;
    };

    // Within your render method
  };
  const handleRepeat = () => {
    setUserSelections({});
    sethasSubmitted(false);
    setFailedInExam(false);
    setCanSubmit(false);
    setDisableSelect(false);
    // Optionally reset other states if necessary
  };
  const isPreTestRetakeAllowed =
    exam?.starterExam && !hasSubmitted && !hasTakenTheExamBefore;
  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      sethasSubmitted(true);

      await axios.post("/api/results", {
        userId,
        courseId: params.courseId,
        examId: params.examId,
        points: Math.round(scorePercentage),
      });
      await axios.patch(
        `/api/courses/${params.courseId}/exam/${params.examId}/progress`,
        {
          percentage: scorePercentage,
          userId,
          userSelections,
        }
      );

      if (scorePercentage >= 50) {
        toast.success(`احسنت! لقد أحرزت علامة ${scorePercentage.toFixed(1)}.`);

        const certificateResponse = await axios.post(
          `/api/courses/${params.courseId}/exam/${params.examId}/certificate`
        );
        if (certificateResponse.status === 200) {
          toast.success("شهادتك جاهزة!");
          setCertificateId(certificateResponse.data.id);
          confetti.onOpen();
        }
      } else if (scorePercentage < 50) {
        setFailedInExam(true);
        toast.error(
          `لقد احرزت علامة ${scorePercentage.toFixed(
            1
          )}. يمكنك إعادة الاختبار بعد مراجعة الدورة التدريبية مرة أخرى.`
        );
      }
    } catch (error) {
      console.error("Error submitting exam or creating certificate:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Know if user has passed exam already
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(
          `/api/results?userId=${userId}&courseId=${params.courseId}&examId=${params.examId}`
        );
        console.log("results", response.data);

        if (response.data) {
          sethasSubmitted(true);
          setAlreadyPassed(true);
          setScorePercentage(response.data.points);
        }
      } catch (error) {
        console.error("Error fetching progress, or mostly because the user never passed this exam.", error);
      }
    })();
  }, [params.courseId, params.examId, userId]);

  // Get the exam data and update the time remaining
  useEffect(() => {
    // Calculate the total time based on the number of questions
    if (exam) {
      const totalTime = exam.questions.length * TIME_PER_QUESTION_MS;
      setTimeRemaining(totalTime);
    }
  }, [TIME_PER_QUESTION_MS, exam]);

  // Function to decrement the time remaining every second
  const countdown = () => {
    setTimeRemaining((prevTime) => {
      const newTime = Math.max(0, prevTime - 1000);
      return newTime;
    });
  };
  const handleNext = () => {
    router.refresh();
    setTimeout(() => {
      return router.push(`/courses/${course?.id}`);
    }, 1000);
  };
  /**
   * Disable the countdown to avoid multirendering
   */
  //   useEffect(() => {
  //     // Start the countdown timer when the component mounts
  //     const timerId = setInterval(countdown, 1000);

  //     // Clear the interval when the component unmounts
  //     return () => clearInterval(timerId);
  //   }, []);

  // useEffect(() => {
  //   if (
  //     (hasTakenTheExamBefore && exam.afterScore && exam.afterScore > 50) ||
  //     (hasSubmitted && hasTakenTheExamBefore)
  //   ) {
  //     sethasSubmitted(true);
  //   }
  // }, [exam?.afterScore, hasSubmitted, hasTakenTheExamBefore, params.courseId]);

  useEffect(() => {
    if (hasSubmitted) return;
    const totalQuestions = exam?.questions.length;

    let correct = 0;
    let answered = 0;
    let wrong = 0;

    if (!totalQuestions) return;

    exam?.questions.forEach((question) => {
      const questionId = question.id;
      const userSelectedPosition = userSelections[questionId];
      const correctAnswerPosition = parseInt(question.answer);

      if (userSelectedPosition !== undefined) {
        answered++;
        if (userSelectedPosition === correctAnswerPosition) {
          correct++;
        } else {
          wrong++;
        }
      }
    });

    setAnswersQuestions(answered);
    setCorrectAnswers(correct);
    setWrongAnswers(wrong);
    setScorePercentage((correct / totalQuestions) * 100);

    // Enable submission when all questions are answered
  }, [exam?.questions, userSelections, hasSubmitted]);

  useEffect(() => {
    if (answeredQuestions === exam?.questions.length) {
      setCanSubmit(true);
      console.log("ss");
    }
  }, [answeredQuestions, exam?.questions.length]);
  useEffect(() => {
    console.log(exam);
    if (exam?.starterExam) {
      setFirstExam(true);
    } else {
      setFirstExam(false);
    }
  }, [exam]);
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(`/api/courses/${params.courseId}`);
        setExam(
          response.data.exams.filter((e: any) => e.id == params.examId)[0]
        );

        console.log("====================================");
        console.log(response.data);
        console.log("====================================");

        setCourse(response.data);

        console.log("====================================");
        console.log(response.data.exams.certificate);
        console.log("====================================");
      } catch (error) {
        console.log("====================================");
        console.log(error);
        console.log("====================================");
        console.error("هناك شئ غير صحيح");
      }
    })();

    (async () => {
      if (!userId) return;

      const progressCount = await getProgress(userId, params.courseId);
      setProgressCount(progressCount);
    })();
  }, [params.courseId, userId]);

  if (!userId) {
    return redirect("/");
  }

  return (
    <>
      {exam ? (
        hasSubmitted ? (
          isFirstExam ? (
            <div
              dir="rtl"
              className="w-full p-20 flex h-full flex-col  gap-4   "
            >
              <div className="flex flex-col space-x-4 ">
                <h1 className="text-lg md:text-xl font-medium capitalize">
                  {" "}
                  عزيزتي المتدربة انتهى الاختبار القبلي وحصلتي على نسبة{" "}
                  {"%" + scorePercentage.toFixed(1)}{" "}
                </h1>
                <h1 className="text-base md:text-xl font-medium capitalize">
                  {" "}
                  وأتمنى لك المتعة والفائدة من دراسة هذه الدورة.{" "}
                </h1>
              </div>
              <div className="flex flex-col space-y-4 ">
                <p>مجموع الاسئلة: {exam?.questions.length}</p>
                <p>عدد الأسئلة الصحيحة: {Math.round((exam?.questions.length * scorePercentage) / 100)}</p>
                <p>عدد الأسئلة الخاطئة: {exam?.questions.length - Math.round((exam?.questions.length * scorePercentage) / 100)}</p>
                <p>النسبة المئوية: % {scorePercentage.toFixed(1)} </p>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className={
                  "bg-sky-500 text-white w-fit font-bold text-sm px-4 py-2 rounded-md"
                }
              >
                تقدم
              </button>
            </div>
          ) : scorePercentage > 60 ? (
            <div dir="rtl" className="w-full p-20 flex h-full flex-col  gap-4">
              <div className="flex flex-col space-x-4 ">
                <h1 className="text-lg md:text-xl font-medium capitalize">
                  {" "}
                  لقد اجتزت الاختبار بنجاح، ويمكنك الان الحصول على الشهادة
                </h1>
              </div>
              <div className="flex flex-col space-y-4 ">
                <p>مجموع الاسئلة: {exam?.questions.length}</p>
                <p>عدد الأسئلة الصحيحة: {Math.round((exam?.questions.length * scorePercentage) / 100)}</p>
                <p>عدد الأسئلة الخاطئة: {exam?.questions.length - Math.round((exam?.questions.length * scorePercentage) / 100)}</p>
                <p>النسبة المئوية: % {scorePercentage.toFixed(1)} </p>
              </div>
              <div>
                <PrepareCertificateModal
                  courseId={params.courseId}
                  examId={params.examId}
                  // certificateId={certificateId}
                >
                  <Button
                    size="sm"
                    className="bg-sky-500 text-white hover:bg-sky-400"
                  >
                    احصل على شهادتك
                  </Button>
                </PrepareCertificateModal>
              </div>
            </div>
          ) : (
            <div
              dir="rtl"
              className="w-full p-20 flex h-full flex-col  gap-4   "
            >
              <div className="flex flex-col space-x-4 ">
                <h1 className="text-lg md:text-xl font-medium capitalize">
                  {" "}
                  ينبغي عليك إعادة الدورة التدريبية مرة أخرى للاستفادة والحصول
                  على الشهادة.{" "}
                </h1>
              </div>
              <div className="flex flex-col space-y-4 ">
                <p>مجموع الاسئلة: {exam?.questions.length}</p>
                <p>عدد الأسئلة الصحيحة: {correctAnswers}</p>
                <p>عدد الأسئلة الخاطئة: {wrongAnswers}</p>
                <p>النسبة المئوية:% {scorePercentage.toFixed(1)}</p>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className={
                  "bg-sky-500 text-white w-fit font-bold text-sm px-4 py-2 rounded-md"
                }
              >
                تقدم
              </button>
            </div>
          )
        ) : (
          <>
            <div className="my-10 flex flex-col px-10 gap-4 py-4">
              {hasSubmitted ? (
                <Banner
                  variant={"success"}
                  label={`الأسئلة التي تمت الإجابة عليها: ${answeredQuestions}    |    الإجابات الصحيحة: ${correctAnswers}    |    إجابات خاطئة: ${wrongAnswers} `}
                />
              ) : (
                <div className="w-full flex flex-col gap-4 justify-center items-end">
                  <div className="flex space-x-4 items-center">
                    <h1 className="text-lg md:text-xl font-medium capitalize">
                      مجموع الأسئلة {exam?.questions.length}
                    </h1>

                    <span className="mx-4">|</span>

                    <h1 className="text-lg md:text-2xl font-medium capitalize">
                      {exam?.title}
                    </h1>
                    <span className="mx-4">|</span>
                    <h1 className="text-lg md:text-2xl font-medium capitalize">
                      {course?.title}
                    </h1>
                  </div>
                  {isFirstExam ? (
                    <div className="flex flex-col gap-5 w-full space-x-3 ">
                      <div className="text-md ml-auto text-right">
                        {" "}
                        <FroalaEditorView model={exam.description} />
                      </div>
                      <FormButton2
                        url={"#"}
                        // url={exam.url ? exam.url : "#"}
                        text="المقياس القبلي"
                        passedText="تم إكمال النموذج"
                      />
                    </div>
                  ) : (
                    <FormButton2
                      url={"#"}
                      // url={exam.url ? exam.url : "#"}
                      text="المقياس البعدي"
                      passedText="تم إكمال النموذج"
                    />
                  )}
                </div>
              )}

              <div className="flex flex-col items-center relative">
                {exam?.questions
                  .sort((a, b) => a.position - b.position)
                  .map((question, index) => (
                    <CarouselItem key={index} className="w-full mb-4">
                      <div className="bg-sky-100 border border-slate-200 rounded-lg p-4 max-w-full ">
                        <div className="w-full flex h-fit flex-col items-end">
                          <div className="font-medium text-slate-500 mb-4 text-right">
                            سؤال {question.position}
                          </div>
                          <div
                            className="text-slate-700 mb-4 font-bold text-lg"
                            dir="rtl"
                          >
                            <FroalaEditorView model={question.prompt} />
                          </div>
                          {question.explanation && (
                            <div
                              className="text-slate-700 font-bold -mr-4 -mt-1 mb-4"
                              dir="rtl"
                            >
                              <FroalaEditorView model={question.explanation} />
                            </div>
                          )}
                          <div className="flex flex-col items-end space-y-2 w-full mb-4 ">
                            {question.options
                              .sort((a, b) =>
                                a.position > b.position
                                  ? 1
                                  : b.position > a.position
                                  ? -1
                                  : 0
                              )
                              .map((option, index) => {
                                option.position = index + 1;
                                return (
                                  <div key={option.id}>
                                    {hasSubmitted || isSubmitting ? (
                                      <div className="flex space-x-2">
                                        <label
                                          className="capitalize text-sm"
                                          dir="rtl"
                                        >
                                          {option.text} {option.position}
                                        </label>
                                        <input
                                          className="mr-2"
                                          type="radio"
                                          name={question.id}
                                          value={index + 1}
                                          disabled={disableSelect}
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex space-x-2">
                                        <label
                                          className="block capitalize text-sm"
                                          dir="rtl"
                                        >
                                          {option.text}
                                        </label>

                                        <input
                                          className="mr-2"
                                          type="radio"
                                          name={question.id}
                                          value={index + 1}
                                          disabled={disableSelect}
                                          // This is if you want to cheat haha
                                          defaultChecked={
                                            option.position ===
                                            Number(question.answer)
                                          }
                                          onChange={() =>
                                            handleOptionChange(
                                              question.id,
                                              option.position
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}

                <div className="flex flex-col justify-end items-end w-full space-y-3">
                  {hasSubmitted && scorePercentage != undefined ? (
                    <div className="text-right w-1/2">
                      {`لقد سجلت النسبة المئوية ${scorePercentage.toFixed(
                        1
                      )}% ${
                        hasTakenTheExamBefore
                          ? "ستتم إضافة درجاتك وتجميعها مع النتيجة التي تحصل عليها عند إجراء الاختبار بعد تعلم الدورة"
                          : "تهانينا!"
                      } `}
                    </div>
                  ) : (
                    ""
                  )}
                  <div className="flex flex-row space-x-4 items-center">
                    {!disableSelect && (
                      <div className="flex flex-row-reverse gap-4 space-x-4 items-center">
                        {hasSubmitted && !isFirstExam ? (
                          ""
                        ) : (
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                              !canSubmit || isSubmitting || hasSubmitted
                            }
                            className={cn(
                              "bg-sky-500 text-white w-fit font-bold text-sm px-4 py-2 rounded-md",
                              (!canSubmit || isSubmitting || hasSubmitted) &&
                                "bg-slate-400 cursor-not-allowed"
                            )}
                          >
                            تقدم
                          </button>
                        )}

                        {certificateId !== "" &&
                          certificateId !== undefined &&
                          hasSubmitted &&
                          !isFirstExam &&
                          scorePercentage >= 50 && (
                            <PrepareCertificateModal
                              courseId={params.courseId}
                              examId={params.examId}
                              // certificateId={certificateId}
                            >
                              <Button
                                size="sm"
                                className="bg-sky-500 text-white hover:bg-sky-400"
                              >
                                احصل على شهادتك
                              </Button>
                            </PrepareCertificateModal>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <div className="font-bold text-2xl text-slate-500 animate-pulse">
            ...جارٍ تحميل الامتحان
          </div>
        </div>
      )}
    </>
  );
};

export default ExamIdPage;
