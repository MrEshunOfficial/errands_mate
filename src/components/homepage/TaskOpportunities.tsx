"use client";

// components/homepage/provider/TaskOpportunities.tsx

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Service } from "@/types/services/service.types";

interface TaskOpportunitiesProps {
  services: Service[];
}

interface CountProps {
  value: number;
  label: string;
  color: string;
}

function Count({ value, label, color }: CountProps) {
  return (
    <div className="text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

export default function TaskOpportunities({
  services,
}: TaskOpportunitiesProps) {
  const router = useRouter();

  const counts: CountProps[] = [
    {
      value: services.length,
      label: "Active services",
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      value: services.filter((s) => s.isActive).length,
      label: "Currently active",
      color: "text-gray-700 dark:text-gray-300",
    },
    {
      value: services.filter((s) => !!(s.approvedAt && !s.rejectedAt)).length,
      label: "Approved",
      color: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Task Opportunities
        </h3>
        <button
          onClick={() => router.push("/provider/tasks/available")}
          className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors group">
          View all
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 divide-x divide-gray-100 dark:divide-gray-700">
        {counts.map((c) => (
          <Count key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}
