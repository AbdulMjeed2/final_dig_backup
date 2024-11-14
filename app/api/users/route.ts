import { NextApiRequest, NextApiResponse } from "next";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCourses } from "@/actions/get-courses";
import { db } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";

export async function GET() {
  try {
    const users = await clerkClient.users.getUserList();
    console.log(users);
    const usersWithCompletedCourses = await Promise.all(
      users.data.map(async (user) => {
        const courses = await getCourses({ userId: user.id });
        const completedCourses = courses.filter((e) => e.progress == 100);
        console.log(user);
        return {
          ...user,
          completedCourses: completedCourses.length,
        };
      })
    );
    // console.log("data", usersWithCompletedCourses);
    return NextResponse.json({ data: usersWithCompletedCourses });
  } catch (error) {
    console.error("Error fetching users: ", error);
    return NextResponse.json({ error: "Failed to fetch users" });
  }
}
