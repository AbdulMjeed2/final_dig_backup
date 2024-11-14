"use client";

import { getCourses } from "@/actions/get-courses";
import Loading from "@/app/loading-spinner";
import { clerkClient, User } from "@clerk/nextjs/server";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const UserCard = () => {
  const [users, setUsers] = useState<(User & { completedCourses?: number })[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const res = await fetch("/api/users");
      const resData = await res.json();
      console.log(resData);
      setUsers(resData?.data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <div className="w-full  p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4 ">
        <h5 className="text-xl w-full font-bold leading-none text-gray-600 dark:text-white text-center">
          تقرير المتدربين
        </h5>
      </div>
      <div className="flow-root">
        <table className="w-full divide-y relative divide-gray-200 dark:divide-gray-700">
          <tr className="w-full ">
            <td className="text-center"></td>
            <td className="text-center">الكورسات المكتملة</td>
            <td className="text-center"></td>
          </tr>
          {users?.map((user, index) => {
            return (
              <tr
                key={index}
                className="py-16 leading-[55px]  justify-center items-center w-full sm:py-4"
              >
                <td className="flex h-[55px] items-center">
                  <div className="flex-shrink-0">
                    <img
                      className="w-8 h-8 rounded-full"
                      src={user.imageUrl}
                      alt="Neil image"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 ms-4">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {`${user.firstName} ${
                        user.lastName ? user.lastName : ""
                      }`}
                    </p>
                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                      {user.emailAddresses[0].emailAddress}
                    </p>
                  </div>
                </td>
                <td className="text-center"> {user?.completedCourses} </td>
                <td className="text-center">
                  <Link
                    className="text-white font-normal text-xl transition-all shadow-3xl rounded-md hover:bg-[rgba(0,118,255,0.9)] bg-[#2655a3] px-6 py-[2px] outline-0 cursor-pointer border-none "
                    href={`/teacher/students/${user.id}`}
                  >
                    تقرير
                  </Link>
                </td>
              </tr>
            );
          })}
          {loading && (
            <div className="flex justify-center items-center">
              <Loading />
            </div>
          )}
        </table>
      </div>
    </div>
  );
};

export default UserCard;
