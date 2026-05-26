"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  UserCheck,
  Search,
  FileText,
  MapPin,
  Zap,
  Bell,
  Send,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Shield,
  Star,
  ThumbsUp,
  ScanLine,
  RefreshCw,
  ArrowRight,
  Users,
  Briefcase,
  Radio,
  ArrowUpRight,
  CircleDot,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "client" | "provider";

interface Step {
  number: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  details: string[];
  callout?: { type: "info" | "warn"; text: string };
  statusTrack?: StatusPill[];
  trackLabel?: string;
}

interface StatusPill {
  label: string;
  color: "zinc" | "blue" | "amber" | "violet" | "emerald" | "rose";
  note?: string;
}

// ─── Pill colour maps — light + dark ─────────────────────────────────────────

const pillColors: Record<StatusPill["color"], string> = {
  zinc: "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600",
  blue: "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  amber:
    "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
  violet:
    "bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700",
  emerald:
    "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
  rose: "bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700",
};

const pillDot: Record<StatusPill["color"], string> = {
  zinc: "bg-zinc-400",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
};

// ─── Primitives ───────────────────────────────────────────────────────────────

const Pill: React.FC<{ pill: StatusPill }> = ({ pill }) => (
  <div className="flex flex-col items-center gap-1">
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full border ${pillColors[pill.color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${pillDot[pill.color]}`} />
      {pill.label}
    </span>
    {pill.note && (
      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center max-w-[68px] leading-tight">
        {pill.note}
      </span>
    )}
  </div>
);

const StatusTrack: React.FC<{ pills: StatusPill[]; label: string }> = ({
  pills,
  label,
}) => (
  <div className="mt-5 rounded-xl border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-4">
    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
      {label}
    </p>
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill, i) => (
        <React.Fragment key={pill.label}>
          <Pill pill={pill} />
          {i < pills.length - 1 && (
            <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const Divider: React.FC = () => (
  <div className="flex items-center gap-4 py-4">
    <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-700" />
    <CircleDot className="w-3 h-3 text-zinc-300 dark:text-zinc-600" />
    <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-700" />
  </div>
);

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-5">
    {children}
  </p>
);

// ─── Step Card ────────────────────────────────────────────────────────────────

const StepCard: React.FC<{ step: Step; first: boolean }> = ({
  step,
  first,
}) => (
  <div className="relative pl-16 md:pl-20">
    {/* Number bubble */}
    <div
      className={`absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border shadow-sm transition-colors ${
        first
          ? "bg-amber-500 text-white border-amber-400"
          : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
      }`}>
      {step.number}
    </div>

    {/* Card */}
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-zinc-50 dark:bg-zinc-700/60 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
          {step.icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {step.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
            {step.subtitle}
          </p>
        </div>
      </div>

      {/* Detail list */}
      <ul className="space-y-2.5">
        {step.details.map((d) => (
          <li
            key={d}
            className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="leading-relaxed">{d}</span>
          </li>
        ))}
      </ul>

      {/* Callout */}
      {step.callout && (
        <div
          className={`mt-4 rounded-lg p-3.5 text-xs leading-relaxed ${
            step.callout.type === "warn"
              ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300"
              : "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300"
          }`}>
          {step.callout.text}
        </div>
      )}

      {/* Status track */}
      {step.statusTrack && (
        <StatusTrack
          pills={step.statusTrack}
          label={step.trackLabel ?? "Status lifecycle"}
        />
      )}
    </div>
  </div>
);

// ─── Method Card ──────────────────────────────────────────────────────────────

const MethodCard: React.FC<{
  icon: React.ReactNode;
  badge: string;
  title: string;
  subtitle: string;
  steps: string[];
  accent: string; // icon wrapper bg + text colour (light + dark supplied by caller)
  border: string; // card border colour (light + dark supplied by caller)
  bg: string; // card background gradient (light + dark supplied by caller)
}> = ({ icon, badge, title, subtitle, steps, accent, border, bg }) => (
  <div
    className={`rounded-2xl border-2 ${border} ${bg} p-6 flex flex-col gap-4`}>
    <div className="flex items-start justify-between">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-0.5">
        {badge}
      </span>
    </div>
    <div>
      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">
        {title}
      </h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {subtitle}
      </p>
    </div>
    <ol className="space-y-1.5 mt-auto">
      {steps.map((s, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <span className="w-4 h-4 rounded-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-[9px] font-bold text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="leading-relaxed">{s}</span>
        </li>
      ))}
    </ol>
  </div>
);

// ─── Client Guide ─────────────────────────────────────────────────────────────

const ClientGuide: React.FC = () => {
  const steps: Step[] = [
    {
      number: "01",
      title: "Create your account",
      subtitle: "Sign up and complete your client profile",
      icon: <UserCheck className="w-4 h-4" />,
      details: [
        "Register via email or connect with Google, Apple, GitHub, or Facebook",
        "Add your GhanaPost GPS address and an optional nearby landmark for accurate location matching",
        "Save multiple service addresses and designate a default",
        "Verify your email and mobile number to unlock full platform access",
        "Set your preferred service categories and communication preferences",
      ],
    },
    {
      number: "02",
      title: "Choose how to find a provider",
      subtitle: "Browse & Request directly, or Post a Task",
      icon: <Search className="w-4 h-4" />,
      details: [
        "Method 1 — Browse & Request: Explore services by category, compare pricing tiers (fixed, hourly, per-unit, or tiered packages), and send a direct service request to your chosen provider",
        "Method 2 — Post a Task: Describe what you need with a title, tags, and category; set a budget range, schedule priority, and preferred date — the system will find matching providers for you",
        "Both methods produce a confirmed booking once the provider accepts",
      ],
    },
    {
      number: "03",
      title: "Get matched to the right provider",
      subtitle:
        "The platform finds the best fit — or opens your task to everyone nearby",
      icon: <Zap className="w-4 h-4" />,
      details: [
        "After you post, the platform scores nearby providers on how well their services, location, and pricing align with your task",
        "If good matches are found, you see a ranked list of providers — best fit first",
        "If no provider is a strong enough match, your task becomes Floating — visible to every verified provider in your area",
        "Floating task providers can send you a personalized message explaining why they're the right fit",
        "You choose who to hire from either list — you're never locked in automatically",
      ],
      callout: {
        type: "warn",
        text: "A floating task is never abandoned — it stays open and visible until you select someone or the task expires.",
      },
      statusTrack: [
        { label: "Pending", color: "zinc", note: "Scoring running" },
        { label: "Matched", color: "blue", note: "Providers ranked" },
        { label: "Floating", color: "amber", note: "Open to all" },
        { label: "Cancelled", color: "rose", note: "Before booking" },
        { label: "Expired", color: "rose", note: "No provider chosen" },
      ],
      trackLabel:
        "Task status lifecycle — a separate Request is created when you choose a provider",
    },
    {
      number: "04",
      title: "Request a provider & confirm",
      subtitle: "Select your provider and lock in the booking",
      icon: <Send className="w-4 h-4" />,
      details: [
        "Review matched providers (sorted by score) or interested providers (for floating tasks)",
        "Send a service request specifying your preferred date, time slot, service location, estimated budget, and any special instructions",
        "Provider can accept, decline, or propose a new schedule — budget is always negotiable",
        "Once the provider accepts, your task converts into a confirmed booking with all terms locked in",
      ],
    },
    {
      number: "05",
      title: "Track the service & confirm completion",
      subtitle: "You control when the booking is marked done",
      icon: <ThumbsUp className="w-4 h-4" />,
      details: [
        "Booking is CONFIRMED once the provider accepts — communicate directly to coordinate logistics",
        "The provider marks the booking IN_PROGRESS when work begins",
        "When the provider submits completion proof (notes + photos), the booking enters AWAITING_VALIDATION",
        "Review the proof and confirm completion — or raise a dispute with a written reason",
        "If disputed, the provider can submit a rebuttal; an admin then mediates and decides the outcome",
        "After confirming, leave a star rating and written review to help the community",
      ],
      callout: {
        type: "info",
        text: "Completion is never confirmed automatically — your explicit validation is the only trigger. You are always in control.",
      },
      statusTrack: [
        { label: "Confirmed", color: "blue", note: "Booking locked" },
        { label: "In Progress", color: "amber", note: "Work begun" },
        {
          label: "Awaiting Validation",
          color: "violet",
          note: "Proof submitted",
        },
        { label: "Completed", color: "emerald", note: "You confirmed" },
        { label: "Disputed", color: "rose", note: "You disputed" },
        { label: "Rebuttal", color: "violet", note: "Provider responds" },
        { label: "Resolved", color: "emerald", note: "Admin decided" },
      ],
      trackLabel: "Booking status lifecycle",
    },
  ];

  return (
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-2xl">
        As a client, you browse for verified providers or post a task with your
        budget and let the platform find the right person nearby. Once matched,
        you control the entire experience — from booking to completion. Nothing
        is finalised until you confirm the work is done.
      </p>
      <Eyebrow>Two ways to hire</Eyebrow>
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        <MethodCard
          badge="Method 01"
          icon={<Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          title="Browse & Request"
          subtitle="Explore verified providers by category. Compare pricing tiers and reviews, then send a direct service request."
          steps={[
            "Browse service categories",
            "View and compare provider profiles and pricing",
            "Send a service request with date, time, and location",
            "Provider accepts → Booking confirmed",
          ]}
          accent="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          border="border-blue-100 dark:border-blue-900/60"
          bg="bg-gradient-to-br from-blue-50/80 dark:from-blue-900/20 to-white dark:to-zinc-800"
        />
        <MethodCard
          badge="Method 02"
          icon={
            <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          }
          title="Post a Task"
          subtitle="Describe your need, set a budget, and let the matching system score and surface the best-fit providers."
          steps={[
            "Describe the task: title, category, description, and relevant tags",
            "Set schedule priority and preferred date",
            "System scores nearby providers across 5 dimensions",
            "No match? Task becomes floating — open to all nearby providers",
            "Review providers and send a request to your preferred choice",
          ]}
          accent="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
          border="border-violet-100 dark:border-violet-900/60"
          bg="bg-gradient-to-br from-violet-50/80 dark:from-violet-900/20 to-white dark:to-zinc-800"
        />
      </div>

      <Divider />

      <div className="mt-10">
        <Eyebrow>Step by step</Eyebrow>
        <div className="relative">
          <div className="absolute left-5 top-10 bottom-10 w-px bg-zinc-100 dark:bg-zinc-700 hidden md:block" />
          <div className="space-y-5">
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} first={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Provider Guide ───────────────────────────────────────────────────────────

const ProviderGuide: React.FC = () => {
  const steps: Step[] = [
    {
      number: "01",
      title: "Register & build your profile",
      subtitle: "Set up your professional provider presence",
      icon: <ScanLine className="w-4 h-4" />,
      details: [
        "Sign up via email or connect with Google, Apple, GitHub, or Facebook",
        "Create your Provider Profile: business name, service offerings, and GhanaPost GPS service area",
        "Submit your Ghana Card — enter your card number and upload clear photos of both sides for identity verification",
        "Configure working hours per day of the week — or mark yourself always available",
        "Set your service coverage area using your GhanaPost GPS address",
      ],
    },
    {
      number: "02",
      title: "List your services",
      subtitle: "Define what you offer and how you price it",
      icon: <Briefcase className="w-4 h-4" />,
      details: [
        "Create services under the appropriate category — each is submitted for admin review before going live",
        "Choose a pricing model: Fixed rate, Hourly, Per-unit, Negotiable, or Free",
        "Optionally add tiered packages (Basic / Standard / Premium) with separate descriptions and prices",
        "Define additional fees (e.g. travel fee) with their amounts and whether they are optional for the client",
        "Specify your currency and whether displayed prices are tax-inclusive",
        "Add detailed descriptions and accurate tags — these directly affect how often you are matched to tasks",
      ],
      callout: {
        type: "info",
        text: "Richer service descriptions and well-chosen tags improve your position in the matching score across all 5 scoring dimensions. Pricing is not a scoring factor.",
      },
    },
    {
      number: "03",
      title: "Get matched or discover floating tasks",
      subtitle: "Two streams of work come to you",
      icon: <Bell className="w-4 h-4" />,
      details: [
        "Auto-matched tasks: the backend scores your services against every new client task across 5 dimensions — title relevance, description relevance, tag alignment, category match, and location proximity",
        "Your score determines your rank in the client's matched provider list",
        "Floating tasks: browse all tasks where no provider met the minimum match score, filtered by category and distance from your location",
        "Both streams update in real time as new tasks are posted",
      ],
    },
    {
      number: "04",
      title: "Express interest in floating tasks",
      subtitle: "Put yourself forward with a personalized message",
      icon: <Send className="w-4 h-4" />,
      details: [
        "On any floating task, tap 'Express Interest' and write a message explaining why you are the right fit",
        "Your interest and message are recorded on the task and the client is notified immediately",
        "The client reviews all interested providers and sends a request to their preferred choice",
        "For tasks you were auto-matched to, simply wait for the client's direct request — no action needed",
        "You can withdraw your interest from a floating task at any time before the client requests you",
      ],
    },
    {
      number: "05",
      title: "Accept requests, deliver & earn",
      subtitle: "Complete the work and build your reputation",
      icon: <TrendingUp className="w-4 h-4" />,
      details: [
        "When a client sends a request, review the full details — then accept, decline, or propose a new schedule",
        "Accepting creates a confirmed booking — coordinate logistics directly with the client",
        "Mark the booking In Progress when work begins; submit completion proof (notes + photos) when done",
        "The booking enters Awaiting Validation — the client reviews your proof and confirms or disputes",
        "If disputed, submit a rebuttal; an admin then mediates and decides the outcome",
        "Each completed booking earns client ratings that improve your future match scores",
      ],
      callout: {
        type: "warn",
        text: "Consistently declining requests or expressed interests can reduce how often you appear in matched results.",
      },
      statusTrack: [
        { label: "Confirmed", color: "blue", note: "Request accepted" },
        { label: "In Progress", color: "amber", note: "Work started" },
        {
          label: "Awaiting Validation",
          color: "violet",
          note: "Proof submitted",
        },
        { label: "Completed", color: "emerald", note: "Booking closed" },
        { label: "Disputed", color: "rose", note: "Client disputed" },
        { label: "Rebuttal", color: "violet", note: "You respond" },
        { label: "Resolved", color: "emerald", note: "Admin decided" },
      ],
      trackLabel: "Booking status lifecycle",
    },
  ];

  return (
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-2xl">
        As a provider, you earn by completing tasks for clients in your area.
        Set up your profile, submit your Ghana Card for verification, list your
        services, and work starts coming to you — either through automatic
        matching when a client posts a relevant task, or through open floating
        tasks you can apply for directly.
      </p>
      <Eyebrow>Two ways work finds you</Eyebrow>
      <div className="grid sm:grid-cols-2 gap-4 mb-12">
        <MethodCard
          badge="Stream 01"
          icon={
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          }
          title="Auto-Matched Tasks"
          subtitle="The system scores your services against new client tasks and surfaces you as a top match — no action needed."
          steps={[
            "Client posts a task with title, description, tags, and category",
            "Backend scores your services across 5 dimensions",
            "You appear ranked in the client's matched provider list",
            "Client sends a direct request",
            "Accept → Task converts to booking",
          ]}
          accent="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          border="border-emerald-100 dark:border-emerald-900/60"
          bg="bg-gradient-to-br from-emerald-50/80 dark:from-emerald-900/20 to-white dark:to-zinc-800"
        />
        <MethodCard
          badge="Stream 02"
          icon={
            <Radio className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          }
          title="Floating Tasks"
          subtitle="Open tasks where no provider was auto-matched. Browse and express your interest to put yourself forward."
          steps={[
            "Task enters FLOATING status — no match found",
            "Visible to all verified providers in the area",
            "Browse by category, distance, or budget",
            "Express interest with a personalized message",
            "Client reviews all interested providers and chooses one",
          ]}
          accent="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          border="border-amber-100 dark:border-amber-900/60"
          bg="bg-gradient-to-br from-amber-50/80 dark:from-amber-900/20 to-white dark:to-zinc-800"
        />
      </div>

      <Divider />

      <div className="mt-10">
        <Eyebrow>Step by step</Eyebrow>
        <div className="relative">
          <div className="absolute left-5 top-10 bottom-10 w-px bg-zinc-100 dark:bg-zinc-700 hidden md:block" />
          <div className="space-y-5">
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} first={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Trust Pillars ────────────────────────────────────────────────────────────

const TrustPillars: React.FC = () => {
  const pillars = [
    {
      icon: <Shield className="w-4 h-4" />,
      label: "Ghana Card Verified",
      desc: "Ghana Card number and photos of both sides required before any service goes live.",
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: "GhanaPost GPS Matching",
      desc: "Dual-source location scoring — registered address and live GPS position evaluated simultaneously.",
    },
    {
      icon: <ThumbsUp className="w-4 h-4" />,
      label: "Client-Controlled Validation",
      desc: "Completion is only confirmed when you validate the service. You are always in control of the outcome.",
    },
    {
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Admin Dispute Mediation",
      desc: "Disputed bookings are reviewed by our team — neither party is left without a resolution path.",
    },
    {
      icon: <Star className="w-4 h-4" />,
      label: "Reputation-Driven Ranking",
      desc: "Completed booking ratings feed into the match scoring system, surfacing high-quality providers first.",
    },
  ];

  return (
    <section className="border-t border-zinc-100 dark:border-zinc-700 pt-16 mt-16">
      <Eyebrow>Platform guarantees</Eyebrow>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pillars.map((p) => (
          <div
            key={p.label}
            className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
              {p.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                {p.label}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── FAQ Teaser ───────────────────────────────────────────────────────────────

const FAQTeaser: React.FC = () => (
  <section className="bg-zinc-950 py-16 mt-20">
    <div className="max-w-3xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          FAQ
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
          Have questions?
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
          Browse our full list of frequently asked questions — covering
          matching, bookings, and more for both clients and providers.
        </p>
      </div>
      <Link
        href="/how-it-works/faq"
        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-100 transition-colors shadow-sm shrink-0">
        View all FAQs
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </section>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const HowItWorksPage: React.FC = () => {
  const [role, setRole] = useState<Role>("client");

  return (
    <div
      className=" bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
      style={{ fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif" }}>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');`}</style>

      {/* ── Hero — always dark ────────────────────────────────────────────── */}
      <header className="relative text-white overflow-hidden">
        <Image src="/errand-logo.jpg" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-zinc-950/80" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pt-20 pb-16">
          <div className="inline-flex items-center gap-2 mb-7 px-3 py-1 rounded-full border border-zinc-800 text-xs font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Platform Guide
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-4">
            How It Works
          </h1>

          <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed mb-3">
            Errands Mate is a Ghanaian marketplace that connects people who need
            tasks done with verified, local service providers — covering
            everything from home repairs and cleaning to personal errands and
            professional services.
          </p>

          <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed mb-10">
            {role === "client"
              ? "You can hire a provider in two ways: browse the directory and book directly, or post a task and let the platform find the right match for you."
              : "Once your profile is live, work comes to you two ways: the platform matches you automatically to client tasks, or you can browse and apply for open tasks in your area."}
          </p>

          <div className="inline-flex items-center bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            {(["client", "provider"] as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  role === r
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}>
                {r === "client" ? (
                  <Users className="w-4 h-4" />
                ) : (
                  <Briefcase className="w-4 h-4" />
                )}
                {r === "client" ? "For Clients" : "For Providers"}
              </button>
            ))}
          </div>
        </div>
        <div className="relative z-10 h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-16">
        {role === "client" ? <ClientGuide /> : <ProviderGuide />}
        <TrustPillars />
      </main>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <FAQTeaser />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white dark:bg-zinc-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-zinc-900 dark:text-zinc-100">
            {role === "client"
              ? "Ready to get something done?"
              : "Ready to start earning?"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            {role === "client"
              ? "Post your first task or browse available services — your first booking takes minutes to set up."
              : "Create your provider profile, list your services, and start getting matched to clients in your area."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={role === "client" ? "/register" : "/register?role=provider"}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
              {role === "client" ? "Post a task" : "Become a provider"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              browse services
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
