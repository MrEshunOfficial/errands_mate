"use client";

import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

type ReportCard = {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
  badge?: string;
};

const REPORTS: ReportCard[] = [
  {
    title: "Bookings Report",
    description:
      "Summary of all bookings including status breakdowns, completion rates, and timelines.",
    icon: ClipboardList,
    accent: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    badge: "Bookings",
  },
  {
    title: "Revenue Report",
    description:
      "Platform earnings, provider payouts, commission breakdown, and financial trends.",
    icon: DollarSign,
    accent:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    badge: "Finance",
  },
  {
    title: "Users Report",
    description:
      "New registrations, active user counts, client vs. provider split, and churn metrics.",
    icon: Users,
    accent:
      "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    badge: "Users",
  },
  {
    title: "Services Report",
    description:
      "Published, pending, and rejected services by category, provider, and approval rate.",
    icon: Briefcase,
    accent:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    badge: "Services",
  },
  {
    title: "Disputes Report",
    description:
      "Open and resolved disputes, resolution times, and escalation patterns.",
    icon: FileText,
    accent: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    badge: "Disputes",
  },
  {
    title: "Scheduling Report",
    description:
      "Errand scheduling patterns, peak booking days, and provider availability gaps.",
    icon: Calendar,
    accent:
      "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
    badge: "Schedule",
  },
];

function ReportItem({ report }: { report: ReportCard }) {
  const Icon = report.icon;
  return (
    <div className="group flex items-start gap-4 p-5 rounded-2xl border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-stone-900 hover:border-teal-300 dark:hover:border-teal-700/50 transition-colors">
      <div
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${report.accent}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            {report.title}
          </p>
          {report.badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
              {report.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          {report.description}
        </p>
      </div>
      <button
        disabled
        title="Export coming soon"
        className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-60 group-hover:opacity-80 transition-opacity">
        <Download size={12} />
        Export
      </button>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          Reports
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Generate and export platform reports. For live metrics, visit the{" "}
          <Link
            href="/admin/analytics"
            className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-0.5">
            Analytics dashboard
            <ArrowRight size={12} />
          </Link>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <BarChart3
            size={16}
            className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
          />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Export functionality coming soon
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Report generation is under development. Use the{" "}
              <Link
                href="/admin/analytics"
                className="underline underline-offset-2">
                Analytics
              </Link>{" "}
              page for current platform data.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          Available Reports
        </p>
        <div className="space-y-2">
          {REPORTS.map((r) => (
            <ReportItem key={r.title} report={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
