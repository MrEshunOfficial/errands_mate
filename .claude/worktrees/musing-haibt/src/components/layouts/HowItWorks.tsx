"use client";
import React, { useState } from "react";
import {
  UserCheck,
  Search,
  FileText,
  Zap,
  Bell,
  Send,
  CheckCircle,
  Star,
  Shield,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  ChevronRight,
  Radio,
  Clock,
  AlertCircle,
  ThumbsUp,
  Wallet,
  ScanLine,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlowStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: "success" | "info" | "warning" | "purple";
  details: string[];
  statusLabel?: string; // mirrors the TaskStatus / BookingStatus enums
}

interface StatusBadgeProps {
  label: string;
  variant: "success" | "info" | "warning" | "purple" | "orange";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant }) => {
  const styles: Record<string, string> = {
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    purple:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
    orange:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${styles[variant]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

const ConnectorArrow: React.FC = () => (
  <div className="hidden lg:flex items-center justify-center flex-shrink-0 w-8">
    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
  </div>
);

// ─── Lifecycle Diagram ────────────────────────────────────────────────────────

type LifecycleStage = {
  label: string;
  variant: StatusBadgeProps["variant"];
  note?: string;
};

const LifecycleDiagram: React.FC<{
  stages: LifecycleStage[];
  title: string;
}> = ({ stages, title }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5">
    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
      {title}
    </p>
    <div className="flex flex-wrap items-center gap-2">
      {stages.map((stage, i) => (
        <React.Fragment key={stage.label}>
          <div className="flex flex-col items-center gap-1">
            <StatusBadge label={stage.label} variant={stage.variant} />
            {stage.note && (
              <span className="text-[9px] text-slate-400 dark:text-slate-500 text-center max-w-[80px] leading-tight">
                {stage.note}
              </span>
            )}
          </div>
          {i < stages.length - 1 && (
            <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// ─── Step Card ────────────────────────────────────────────────────────────────

const StepCard: React.FC<{
  step: FlowStep;
  index: number;
  accentClass: string;
  bgClass: string;
}> = ({ step, index, accentClass, bgClass }) => (
  <div
    className={`relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}>
    {/* Accent top bar */}
    <div className={`h-1 w-full ${accentClass}`} />

    <div className="p-6 flex flex-col gap-4 flex-1">
      {/* Step number + icon */}
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
          {step.icon}
        </div>
        <span className="text-3xl font-black text-slate-100 dark:text-slate-800 select-none leading-none">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Badge */}
      {step.badge && step.badgeVariant && (
        <StatusBadge label={step.badge} variant={step.badgeVariant} />
      )}

      {/* Text */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 leading-snug">
          {step.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* Details */}
      <ul className="space-y-1.5 mt-auto">
        {step.details.map((d) => (
          <li
            key={d}
            className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-500 flex-shrink-0" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ─── Method Comparison ────────────────────────────────────────────────────────

const MethodCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tags: string[];
  gradient: string;
  border: string;
  iconBg: string;
}> = ({ icon, title, subtitle, tags, gradient, border, iconBg }) => (
  <div
    className={`rounded-2xl border-2 ${border} ${gradient} p-5 flex flex-col gap-3`}>
    <div
      className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
        {title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
        {subtitle}
      </p>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {tag}
        </span>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface HowItWorksProps {
  userRole?: "client" | "provider" | "visitor";
}

const HowItWorks: React.FC<HowItWorksProps> = ({ userRole = "visitor" }) => {
  const [activeTab, setActiveTab] = useState<"client" | "provider">(
    userRole === "provider" ? "provider" : "client",
  );

  // ── Client Steps ─────────────────────────────────────────────────────────────
  // Reflects both Task flow and ServiceRequest flow from the type interfaces.
  const clientSteps: FlowStep[] = [
    {
      id: "register",
      icon: <UserCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      title: "Create Your Account",
      description:
        "Sign up and complete your client profile with your location and preferences.",
      badge: "2 minutes",
      badgeVariant: "info",
      details: [
        "Register with email or Google, Apple, or Facebook",
        "Add your GhanaPost GPS address for precise matching",
        "Set preferred service categories",
        "Save multiple delivery addresses",
      ],
    },
    {
      id: "find",
      icon: <Search className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      title: "Choose How to Find Help",
      description:
        "Browse providers directly, or post a task and let our system do the work.",
      badge: "Two paths",
      badgeVariant: "purple",
      details: [
        "Method 1: Browse by category, filter by price & location",
        "Method 2: Post a task with your budget and schedule",
        "Both paths converge into a secure booking",
        "View provider ratings, credentials, and pricing tiers",
      ],
    },
    {
      id: "match",
      icon: <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      title: "Get Matched or Browse Results",
      description:
        "Our system scores providers across 6 dimensions. No match? Your task floats to all nearby providers.",
      badge: "Smart Matching",
      badgeVariant: "warning",
      details: [
        "Scored by title, tags, category, description, location & price",
        "Uses both your registered address and live GPS",
        "Unmatched tasks become floating — visible to all nearby providers",
        "Providers can express interest with a personalised message",
      ],
    },
    {
      id: "request",
      icon: <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      title: "Request Your Provider",
      description:
        "Choose from matched or interested providers, agree on details, and confirm.",
      badge: "Secure",
      badgeVariant: "success",
      details: [
        "Review provider interest messages and profiles",
        "Send a service request with your preferred date and time slot",
        "Optional deposit held securely until service is complete",
        "Direct messaging with your provider",
      ],
    },
    {
      id: "complete",
      icon: <ThumbsUp className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      title: "Validate & Pay",
      description:
        "After the service, you confirm completion or raise a dispute. Your rating releases payment.",
      badge: "Protected",
      badgeVariant: "info",
      details: [
        "Mark the booking as complete when satisfied",
        "Dispute with a reason if the service wasn't delivered",
        "Admin mediates disputed bookings",
        "Leave a rating and review to help the community",
      ],
    },
  ];

  // ── Provider Steps ───────────────────────────────────────────────────────────
  const providerSteps: FlowStep[] = [
    {
      id: "register",
      icon: <ScanLine className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      title: "Register & Get Verified",
      description:
        "Build your provider profile, list your services, and complete identity verification.",
      badge: "Verified in 24hrs",
      badgeVariant: "info",
      details: [
        "Upload ID (National ID, Passport, Driver's Licence, or Voters' ID)",
        "Add services with detailed pricing tiers (fixed, hourly, per-unit)",
        "Set your GhanaPost GPS service area",
        "Configure deposit requirements and working hours",
      ],
    },
    {
      id: "discover",
      icon: <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      title: "Get Matched or Discover Tasks",
      description:
        "Receive system-matched tasks or browse floating tasks in your area — two streams of work.",
      badge: "Dual stream",
      badgeVariant: "purple",
      details: [
        "System auto-matches your services to new client tasks",
        "Browse floating tasks no provider claimed yet",
        "Filter by category, distance, and budget",
        "See full task details, location, and client budget",
      ],
    },
    {
      id: "interest",
      icon: <Send className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      title: "Express Interest",
      description:
        "For floating tasks, send a personalised message to stand out. The client then chooses.",
      badge: "Stand out",
      badgeVariant: "warning",
      details: [
        "Write a message explaining why you're the right fit",
        "Client is notified immediately",
        "For direct browse requests, simply accept or decline",
        "Your profile and ratings are visible to the client",
      ],
    },
    {
      id: "deliver",
      icon: (
        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      ),
      title: "Deliver & Earn",
      description:
        "Complete the booking, receive client validation, and get paid securely.",
      badge: "Build reputation",
      badgeVariant: "success",
      details: [
        "Update booking status: Confirmed → In Progress → Awaiting Validation",
        "Client validates completion or raises a dispute",
        "Earn 5-star reviews that improve your match score",
        "Payment via mobile money, card, or bank transfer",
      ],
    },
  ];

  const steps = activeTab === "client" ? clientSteps : providerSteps;

  // Accent colours per step index, per tab
  const clientAccents = [
    "bg-sky-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-rose-500",
  ];
  const clientBgs = [
    "bg-sky-50 dark:bg-sky-900/30",
    "bg-violet-50 dark:bg-violet-900/30",
    "bg-amber-50 dark:bg-amber-900/30",
    "bg-emerald-50 dark:bg-emerald-900/30",
    "bg-rose-50 dark:bg-rose-900/30",
  ];
  const providerAccents = [
    "bg-sky-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-emerald-500",
  ];
  const providerBgs = [
    "bg-sky-50 dark:bg-sky-900/30",
    "bg-violet-50 dark:bg-violet-900/30",
    "bg-amber-50 dark:bg-amber-900/30",
    "bg-emerald-50 dark:bg-emerald-900/30",
  ];

  const accents = activeTab === "client" ? clientAccents : providerAccents;
  const bgs = activeTab === "client" ? clientBgs : providerBgs;

  // ── Task lifecycle (mirrors TaskStatus enum) ─────────────────────────────────
  const taskLifecycle: LifecycleStage[] = [
    { label: "Pending", variant: "info", note: "Matching running" },
    { label: "Matched", variant: "success", note: "Providers found" },
    { label: "Floating", variant: "warning", note: "Open to all" },
    { label: "Requested", variant: "purple", note: "Client chose" },
    { label: "Accepted", variant: "orange" as any, note: "Provider agreed" },
    { label: "Converted", variant: "success", note: "Booking created" },
  ];

  // ── Booking lifecycle (mirrors BookingStatus enum) ───────────────────────────
  const bookingLifecycle: LifecycleStage[] = [
    { label: "Confirmed", variant: "info" },
    { label: "In Progress", variant: "warning" },
    { label: "Awaiting Validation", variant: "purple" },
    { label: "Validated", variant: "success", note: "Payment released" },
    { label: "Disputed", variant: "orange" as any, note: "Admin review" },
  ];

  // ── Platform trust pillars ───────────────────────────────────────────────────
  const trustPillars = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "ID-Verified Providers",
      desc: "National ID, Passport, or Drivers' Licence required before going live.",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-900/30",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "GhanaPost GPS Matching",
      desc: "Precise location matching using registered address and live GPS simultaneously.",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      title: "Escrow-Style Payments",
      desc: "Deposits held securely. Full payment only releases after client validation.",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/30",
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: "Dispute Resolution",
      desc: "Dedicated admin mediation for disputed bookings — no one is left without recourse.",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/30",
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: "Flexible Role Switching",
      desc: "Switch between client and provider roles at any time — provider data is preserved.",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-900/30",
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: "Reputation-Driven Matching",
      desc: "Provider ratings feed back into the match score, surfacing quality providers first.",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/30",
    },
  ];

  return (
    <section className="w-full bg-white dark:bg-slate-950 py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        {/* ── Header ── */}
        <div className="max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-4">
            <span className="w-6 h-px bg-slate-300 dark:bg-slate-700" />
            Platform Guide
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            {activeTab === "client"
              ? "Two paths to get any service done — browse and request directly, or post a task and let our matching system find the right provider for you."
              : "Two streams of work — get matched to client tasks automatically, or discover floating tasks in your area and express your interest."}
          </p>
        </div>

        {/* ── Tab Switcher (visitors only) ── */}
        {userRole === "visitor" && (
          <div className="flex gap-2 mb-12">
            <button
              onClick={() => setActiveTab("client")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === "client"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}>
              <Users className="w-4 h-4" />
              For Clients
            </button>
            <button
              onClick={() => setActiveTab("provider")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                activeTab === "provider"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}>
              <Briefcase className="w-4 h-4" />
              For Providers
            </button>
          </div>
        )}

        {/* ── Client Method Cards ── */}
        {activeTab === "client" && (
          <div className="grid sm:grid-cols-2 gap-4 mb-12 max-w-3xl">
            <MethodCard
              icon={
                <Search className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              }
              title="Method 1 — Browse & Request"
              subtitle="Explore verified providers by category, compare pricing tiers, and send a direct service request."
              tags={["Direct", "Browse by category", "Instant request"]}
              gradient="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20"
              border="border-sky-200 dark:border-sky-800"
              iconBg="bg-sky-100 dark:bg-sky-900"
            />
            <MethodCard
              icon={
                <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              }
              title="Method 2 — Post a Task"
              subtitle="Describe what you need, set a budget, and let our matching system find the best nearby providers."
              tags={["Smart Matching", "Floating fallback", "Compare interest"]}
              gradient="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20"
              border="border-violet-200 dark:border-violet-800"
              iconBg="bg-violet-100 dark:bg-violet-900"
            />
          </div>
        )}

        {/* ── Steps Grid ── */}
        <div
          className={`grid gap-4 mb-12 ${
            activeTab === "client"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          }`}>
          {steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              accentClass={accents[i]}
              bgClass={bgs[i]}
            />
          ))}
        </div>

        {/* ── Lifecycle Diagrams ── */}
        <div className="grid md:grid-cols-2 gap-4 mb-14">
          <LifecycleDiagram
            title="Task status lifecycle"
            stages={taskLifecycle}
          />
          <LifecycleDiagram
            title="Booking status lifecycle"
            stages={bookingLifecycle}
          />
        </div>

        {/* ── Floating Task Callout ── */}
        {activeTab === "client" && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 mb-14 flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">
                What if no provider is matched?
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your task becomes{" "}
                <strong className="text-amber-700 dark:text-amber-400">
                  Floating
                </strong>{" "}
                — visible to every verified provider in your area. They can
                express interest with a personalised message, and you pick the
                one you prefer. You're never left without options.
              </p>
            </div>
            <StatusBadge label="Floating" variant="warning" />
          </div>
        )}

        {/* ── Provider Insight Callout ── */}
        {activeTab === "provider" && (
          <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-6 mb-14 flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">
                How does the matching score work?
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your match score is calculated by the backend across six
                weighted dimensions:{" "}
                <strong className="text-violet-700 dark:text-violet-400">
                  service title, description, tags, category, location
                  proximity, and pricing
                </strong>
                . Complete profiles with detailed service descriptions
                consistently rank higher.
              </p>
            </div>
          </div>
        )}

        {/* ── Trust Pillars ── */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-14">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Built on trust & transparency
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:block">
              Core platform guarantees
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustPillars.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p.bg} ${p.color}`}>
                  {p.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                    {p.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-3">
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm">
            <FileText className="w-4 h-4" />
            Full Platform Guide
          </a>
          <a
            href={
              activeTab === "client" ? "/register" : "/register?role=provider"
            }
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            Get started
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
