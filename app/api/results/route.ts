import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId");
    const courseId = searchParams.get("courseId");
    const examId = searchParams.get("examId");
 
    if (!userId || !courseId || !examId) {
      return NextResponse.json(
        { message: "Missing required parameters: userId, courseId, or examId." },
        { status: 400 }
      );
    }

    // Fetch the result from the database
    const result = await db.result.findFirst({
      where: {
        userId: userId,
        courseId: courseId,
        examId: examId,
      },
    });

    if (!result) {
      return NextResponse.json(
        { message: "Result not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
} 
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, courseId, examId, points } = body;

    // Validate the required fields
    if (!userId || !courseId || !examId || points === undefined) {
      return NextResponse.json(
        { message: "Missing required fields: userId, courseId, examId, or points." },
        { status: 400 }
      );
    }

    // Create a new result in the database
    const newResult = await db.result.create({
      data: {
        userId,
        courseId,
        examId,
        points,
      },
    });

    return NextResponse.json(newResult, { status: 201 });
  } catch (error) {
    console.error("Error creating result:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}