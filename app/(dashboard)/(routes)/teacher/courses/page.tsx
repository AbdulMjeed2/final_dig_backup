"use client";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import useStore from "@/store/coursesStore";
import useCoursesStore from "@/store/coursesStore";

const CoursesPage = () => {
  const { courses, fetchItems, loading } = useCoursesStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="p-6">
      <DataTable columns={columns} data={courses} isLoading={loading} />
    </div>
  );
};

export default CoursesPage;
