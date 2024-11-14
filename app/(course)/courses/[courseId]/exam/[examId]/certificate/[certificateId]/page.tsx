"use client";

import { useEffect, useRef, useState } from "react";
import { htmlToPdf } from "@/lib/html-to-pdf";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";
import { Certificate } from "@prisma/client";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import fontkit from "@pdf-lib/fontkit";

// Text layer for React-PDF.
import "react-pdf/dist/Page/TextLayer.css";
import dynamic from "next/dynamic";

const Component = dynamic(() => import("./PDFViewer"));

const CertificatePage = ({
  params,
}: {
  params: { courseId: string; examId: string; certificateId: string };
}) => {
  const htmlRef = useRef<HTMLDivElement>(null);

  return <Component params={params} />;
};

export default CertificatePage;
