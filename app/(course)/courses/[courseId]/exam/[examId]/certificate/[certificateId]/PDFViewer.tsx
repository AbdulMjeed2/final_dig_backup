"use client";

import { useEffect, useRef, useState } from "react";
import { htmlToPdf } from "@/lib/html-to-pdf";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";
import { Certificate } from "@prisma/client";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import "react-pdf/dist/Page/TextLayer.css";
import PDF from "./Viewer";

export const PdfViewer = ({
  params,
}: {
  params: { courseId: string; examId: string; certificateId: string };
}) => {
  const htmlRef = useRef<HTMLDivElement>(null);
  const [certificatePdf, setCertificatePdf] = useState<string>("");
  const { userId } = useAuth();
  const router = useRouter();
  const [certificate, setCertificate] = useState<Certificate>();

  const [isGettingCertificate, setisGettingCertificate] = useState(false);

  useEffect(() => {
    (async () => {
      setisGettingCertificate(true);
      const url =
        "https://uz635cwohid0t4ce.public.blob.vercel-storage.com/Appreciation%20Certificate%20%D8%B4%D9%87%D8%A7%D8%AF%D8%A9%20%D8%AA%D9%82%D8%AF%D9%8A%D8%B1%20%D8%A3%D8%B2%D8%B1%D9%82%20%D9%88%D8%A3%D8%AE%D8%B6%D8%B1%20(2)-4GF2H0oU8fk7pv6dP4xuqGw4mVJUJE.pdf";
      const existingPdfBytes = await fetch(url).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      try {
        console.log("drawing your certificate");
        const response = await axios.get(
          `/api/courses/${params.courseId}/exam/${params.examId}/certificate/${params.certificateId}`
        );
        const fontUrl =
          "https://uz635cwohid0t4ce.public.blob.vercel-storage.com/Cairo-Regular-IfPEScEah1exU4X87UiQ3sPhWk8hQ6.ttf";
        pdfDoc.registerFontkit(fontkit);
        const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
        const customFont = await pdfDoc.embedFont(fontBytes);
        const textSize = 35;
        const date = new Date(response.data.dateOfIssuance);
        console.log("response.data", response.data);
        const textWidth = customFont.widthOfTextAtSize(
          response.data.nameOfStudent,
          textSize
        );
        const pageWidth = firstPage.getWidth();
        const centeredX = (pageWidth - textWidth) / 2;
        firstPage.drawText(response.data.nameOfStudent, {
          x: centeredX,
          y: 285,
          size: textSize,
          font: customFont,
          color: rgb(0, 0.53, 0.71),
        });

        // Calculate the text width for the course title
        const courseTitleWidth = customFont.widthOfTextAtSize(
          response.data.courseTitle,
          textSize
        );
        const centeredCourseTitleX = (pageWidth - courseTitleWidth) / 2;
        firstPage.drawText(response.data.courseTitle, {
          x: centeredCourseTitleX,
          y: 150,
          size: textSize,
          font: customFont,
          color: rgb(0, 0.53, 0.71),
        });

        firstPage.drawText(
          `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
          {
            x: 100,
            y: 72,
            size: 20,
            font: customFont,
            color: rgb(0, 0.53, 0.71),
          }
        );

        const pdfBytes = await pdfDoc.save();

        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

        const pdfUrl = URL.createObjectURL(pdfBlob);

        setCertificatePdf(pdfUrl);

        setCertificate(response.data);

        if (!response.data) {
          redirect(`/courses/${params.courseId}`);
        }
        return router.refresh();
      } catch (error) {
        console.error("Error getting certificate", error as any);
        toast.error("هناك شئ غير صحيح");
      } finally {
        setisGettingCertificate(false);
      }
    })();
  }, [params.certificateId, params.courseId, params.examId]);

  if (!userId) {
    return redirect("/");
  }
  const handleDownload = async () => {
    if (!certificatePdf) {
      toast.error("لم يتم العثور على ملف PDF للتحميل");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = certificatePdf;
      link.setAttribute("download", "certificate.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error during download", error);
      toast.error("حدث خطأ أثناء تحميل الشهادة");
    }
  };

  return (
    <>
      {isGettingCertificate ? (
        <div className="flex items-center justify-center h-full w-full">
          <div className="font-bold text-2xl text-slate-500 animate-pulse">
            ...تحضير شهادتك
          </div>
        </div>
      ) : certificate ? (
        <div className="flex flex-col space-y-8 ml-10 pb-8 mt-8 mr-8">
          <button
            className="self-end rounded-lg text-white font-bold bg-sky-600 max-w-fit py-2 px-3"
            onClick={handleDownload}
          >
            <div> تحميل PDF</div>
          </button>
          <PDF fileUrl={certificatePdf} />
        </div>
      ) : null}
    </>
  );
};

export default PdfViewer;
