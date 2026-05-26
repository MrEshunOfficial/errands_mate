"use client";
import React, { useState } from "react";
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
  Wallet,
  ScanLine,
  RefreshCw,
  ArrowRight,
  ChevronDown,
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
            <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
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
        <div className="w-9 h-9 rounded-lg bg-zinc-50 dark:bg-zinc-700/60 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 flex-shrink-0">
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
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
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
          <span className="w-4 h-4 rounded-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-[9px] font-bold text-zinc-500 dark:text-zinc-400 flex-shrink-0 mt-0.5">
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
      title: "System matching & floating tasks",
      subtitle: "How providers are scored and surfaced (Task flow)",
      icon: <Zap className="w-4 h-4" />,
      details: [
        "After posting a task, the backend scores nearby providers across 6 weighted dimensions: service title relevance, description relevance, tag alignment, category match, location proximity, and pricing alignment",
        "Location is evaluated against both your registered GhanaPost address and your live GPS position simultaneously — the nearest radius wins",
        "Providers above the minimum score threshold: task becomes MATCHED and you see a ranked list",
        "If no providers meet the threshold: task becomes FLOATING — visible to all verified providers in your area",
        "Any provider can express interest in a floating task and attach a personalised message",
        "You are notified of each interested provider and can request whichever one you prefer",
      ],
      callout: {
        type: "warn",
        text: "A floating task is never abandoned — it remains open and discoverable until you select a provider or the task expires.",
      },
      statusTrack: [
        { label: "Pending", color: "zinc", note: "Scoring running" },
        { label: "Matched", color: "blue", note: "Providers ranked" },
        { label: "Floating", color: "amber", note: "Open to all" },
        { label: "Requested", color: "violet", note: "You chose one" },
        { label: "Accepted", color: "emerald", note: "Provider agreed" },
        { label: "Converted", color: "emerald", note: "Booking created" },
      ],
      trackLabel: "Task status lifecycle",
    },
    {
      number: "04",
      title: "Request a provider & confirm",
      subtitle: "Select your provider and lock in the booking",
      icon: <Send className="w-4 h-4" />,
      details: [
        "Review matched providers (sorted by score) or interested providers (for floating tasks)",
        "Send a service request specifying your preferred date, time slot, service location, and any special instructions",
        "If the provider requires a deposit, it is held securely until you validate the completed service",
        "Once the provider accepts, your task converts into a confirmed booking",
      ],
    },
    {
      number: "05",
      title: "Track the service & validate payment",
      subtitle: "You decide when payment is released",
      icon: <ThumbsUp className="w-4 h-4" />,
      details: [
        "Booking is CONFIRMED once the provider accepts — communicate directly to coordinate logistics",
        "The provider marks the booking IN_PROGRESS when work begins",
        "When the provider marks work complete, the booking enters AWAITING_VALIDATION",
        "You validate completion to release payment — or raise a dispute with a written reason",
        "Disputed bookings are escalated to our admin team for mediation",
        "After validating, leave a star rating and written review to help the community",
      ],
      callout: {
        type: "info",
        text: "Payment is never disbursed automatically — your explicit validation is the only trigger. You are always in control.",
      },
      statusTrack: [
        { label: "Confirmed", color: "blue", note: "Booking locked" },
        { label: "In Progress", color: "amber", note: "Work begun" },
        {
          label: "Awaiting Validation",
          color: "violet",
          note: "Provider done",
        },
        { label: "Validated", color: "emerald", note: "Payment out" },
        { label: "Disputed", color: "rose", note: "Admin review" },
      ],
      trackLabel: "Booking status lifecycle",
    },
  ];

  return (
    <div>
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
            "Describe the task: title, category, tags, budget",
            "Set schedule priority and preferred date",
            "System scores nearby providers across 6 dimensions",
            "No match? Task becomes floating — open to all nearby providers",
            "Review providers and request your preferred choice",
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
        "Upload a valid identity document — National ID, Passport, Voters' ID, Driver's Licence, or NHIS card",
        "Configure working hours per day of the week",
        "Set your deposit policy: whether you require an upfront deposit and the percentage amount",
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
        text: "Richer service descriptions and well-chosen tags improve your position in the matching score across all 6 scoring dimensions.",
      },
    },
    {
      number: "03",
      title: "Get matched or discover floating tasks",
      subtitle: "Two streams of work come to you",
      icon: <Bell className="w-4 h-4" />,
      details: [
        "Auto-matched tasks: the backend scores your services against every new client task across 6 dimensions — title relevance, description relevance, tag alignment, category match, location proximity, and pricing alignment",
        "Your score determines your rank in the client's matched provider list",
        "Floating tasks: browse all tasks where no provider met the minimum match score, filtered by category and distance from your location",
        "Both streams update in real time as new tasks are posted",
      ],
    },
    {
      number: "04",
      title: "Express interest in floating tasks",
      subtitle: "Put yourself forward with a personalised message",
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
      subtitle: "Complete the work and receive secure payment",
      icon: <TrendingUp className="w-4 h-4" />,
      details: [
        "When a client sends a request, review the full task details, then accept or decline",
        "Accepting converts the task into a confirmed booking — coordinate logistics directly with the client",
        "Mark the booking In Progress when work begins, and complete when you are done",
        "The booking enters Awaiting Validation — the client either validates (releasing payment) or raises a dispute",
        "Disputed bookings are escalated to admin for mediation",
        "Each completed and validated booking contributes ratings that improve your future match scores",
        "Receive payment via mobile money, card, or bank transfer",
      ],
      callout: {
        type: "warn",
        text: "Consistently declining requests or expressed interests can reduce how often you appear in matched results.",
      },
      statusTrack: [
        { label: "Confirmed", color: "blue", note: "Task accepted" },
        { label: "In Progress", color: "amber", note: "Work started" },
        {
          label: "Awaiting Validation",
          color: "violet",
          note: "Work complete",
        },
        { label: "Validated", color: "emerald", note: "Payment out" },
        { label: "Disputed", color: "rose", note: "Admin review" },
      ],
      trackLabel: "Booking status lifecycle",
    },
  ];

  return (
    <div>
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
            "Client posts a task with title, tags, category & budget",
            "Backend scores your services across 6 dimensions",
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
            "Express interest with a personalised message",
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
      label: "ID-Verified Providers",
      desc: "National ID, Passport, Voters' ID, Driver's Licence, or NHIS required before a service goes live.",
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: "GhanaPost GPS Matching",
      desc: "Dual-source location scoring — registered address and live GPS position evaluated simultaneously.",
    },
    {
      icon: <Wallet className="w-4 h-4" />,
      label: "Client-Controlled Payments",
      desc: "Payment is only disbursed when you validate the completed service. No automatic release.",
    },
    {
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Admin Dispute Mediation",
      desc: "Disputed bookings are reviewed by our team — neither party is left without a resolution path.",
    },
    {
      icon: <RefreshCw className="w-4 h-4" />,
      label: "Role Flexibility",
      desc: "Switch between client and provider at any time. Provider profiles and history are always preserved.",
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
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 flex-shrink-0">
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

// ─── FAQ ──────────────────────────────────────────────────────────────────────
// Intentionally stays dark in both modes — it's a distinct contrast section.

const FAQSection: React.FC<{ role: Role }> = ({ role }) => {
  const [open, setOpen] = useState<number | null>(null);

  const clientFAQs = [
    {
      q: "What happens if no providers are matched to my task?",
      a: "Your task automatically transitions to FLOATING status and becomes visible to every verified provider in your area. Providers can send a personalised message expressing their interest. You receive a notification for each one and can request whichever you prefer. A floating task stays open until you select a provider or the task expires.",
    },
    {
      q: "How does the system decide which providers to match?",
      a: "The backend scores providers across six weighted dimensions: how well their service title, description, tags, and category align with your task; how close they are to your location (using both your registered GhanaPost address and your live GPS); and how well their pricing aligns with your stated budget. Providers above the minimum score threshold appear in your matched list, ranked by score.",
    },
    {
      q: "What is the difference between browsing services and posting a task?",
      a: "Browsing lets you explore verified providers by service category, compare their pricing tiers and reviews, and send a direct service request — you choose the provider. Posting a task is better when you are open to suggestions: the system scores nearby providers and surfaces the best matches. If none qualify, the task floats to the whole area.",
    },
    {
      q: "When is my payment actually charged?",
      a: "Payment is only released when you explicitly validate the completed service. The booking enters Awaiting Validation once the provider marks their work done — nothing is disbursed until you confirm, or until an admin resolves a dispute in their favour. Any deposit is held in the same way.",
    },
    {
      q: "What if I am not satisfied with the service?",
      a: "When validating the booking you can choose to dispute it and provide a written reason. A disputed booking is escalated to our admin team, who review the case and mediate before any payment is released or withheld.",
    },
    {
      q: "Can I switch between being a client and a provider?",
      a: "Yes. Role transitions are supported at any time. When you switch away from provider, your services are deactivated and your provider profile is preserved — it can be reactivated if you switch back. Your booking history is retained regardless of role.",
    },
  ];

  const providerFAQs = [
    {
      q: "How do I improve my match score?",
      a: "Your score is computed from six dimensions against each new task: service title relevance, description relevance, tag alignment, category match, location proximity, and pricing alignment. Writing detailed service descriptions, using precise tags, keeping your GhanaPost GPS location current, and pricing competitively all contribute to higher scores.",
    },
    {
      q: "What is the difference between auto-matched tasks and floating tasks?",
      a: "Auto-matched tasks are ones where the system determined your score was above the minimum threshold — you appear in the client's ranked list and they can request you directly, no action needed from you. Floating tasks are those where no provider met the threshold; they are open to any verified provider in the area to express interest.",
    },
    {
      q: "Can I apply for a task that was matched to other providers?",
      a: "Only floating tasks are open for any provider to express interest. If a task was matched to a set of providers, only those providers appear in the client's ranked list. However, tasks that remain unanswered can eventually transition to floating status.",
    },
    {
      q: "What happens after I express interest in a floating task?",
      a: "Your interest and message are recorded on the task and the client is notified immediately. The client reviews all interested providers and sends a request to their chosen one. You are notified if selected, at which point the task moves to REQUESTED status.",
    },
    {
      q: "How are deposits handled?",
      a: "If your provider profile is configured to require an upfront deposit, clients are informed of the percentage when making a request. The deposit is held securely and is only released to you after the client validates the completed service — the same trigger as the full payment.",
    },
    {
      q: "Does declining requests affect my standing?",
      a: "The platform tracks your response behaviour. Consistently declining requests after expressing interest — or after being auto-matched — can reduce how often you appear in matched results. Only express interest or engage with tasks you are genuinely available to complete.",
    },
  ];

  const faqs = role === "client" ? clientFAQs : providerFAQs;

  return (
    <section className="bg-zinc-950 py-20 mt-20">
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <div className="mb-12">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="divide-y divide-zinc-800">
          {faqs.map((faq, i) => (
            <div key={i} className="py-5">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 text-left group">
                <span className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors leading-relaxed">
                  {faq.q}
                </span>
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                    open === i
                      ? "border-amber-500 bg-amber-500 text-white rotate-180"
                      : "border-zinc-700 text-zinc-500"
                  }`}>
                  <ChevronDown className="w-3 h-3" />
                </span>
              </button>
              {open === i && (
                <p className="mt-4 text-sm text-zinc-400 leading-relaxed pr-9">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

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
      <header className="bg-zinc-950 text-white">
        <div className="max-w-5xl mx-auto px-6 md:px-8 pt-20 pb-16">
          <div className="inline-flex items-center gap-2 mb-7 px-3 py-1 rounded-full border border-zinc-800 text-xs font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Platform Guide
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-5">
            How It Works
          </h1>

          <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed mb-10">
            {role === "client"
              ? "Two paths to hire a verified provider — browse and request directly, or post a task and let the matching system surface the right person."
              : "Two streams of work come to you — get auto-matched to client tasks, or discover floating tasks in your area and express your interest."}
          </p>

          <div className="inline-flex items-center bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            {(["client", "provider"] as Role[]).map((r) => (
              <button
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
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 md:px-8 py-16">
        {role === "client" ? <ClientGuide /> : <ProviderGuide />}
        <TrustPillars />
      </main>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <FAQSection role={role} />

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
            <a
              href={role === "client" ? "/register" : "/register?role=provider"}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
              {role === "client" ? "Post a task" : "Become a provider"}
              <ArrowRight className="w-4 h-4" />
            </a>
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
