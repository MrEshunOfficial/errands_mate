"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  MessageSquare,
  Mail,
  Phone,
  BookOpen,
  ShieldCheck,
  CreditCard,
  UserCircle,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Star,
  MapPin,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

interface HelpCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  count: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    description: "New to Errand Mate? Start here.",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
    count: 5,
  },
  {
    id: "tasks-matching",
    label: "Tasks & Matching",
    description: "How posting tasks and provider matching works.",
    icon: Star,
    color:
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
    count: 6,
  },
  {
    id: "payments",
    label: "Payments & Billing",
    description: "Deposits, charges, and payouts explained.",
    icon: CreditCard,
    color:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    count: 5,
  },
  {
    id: "bookings",
    label: "Bookings",
    description: "Managing your confirmed service bookings.",
    icon: Briefcase,
    color:
      "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40",
    count: 4,
  },
  {
    id: "disputes",
    label: "Disputes & Safety",
    description: "Resolve issues and understand protections.",
    icon: ShieldCheck,
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40",
    count: 4,
  },
  {
    id: "account",
    label: "Account & Privacy",
    description: "Profile settings, data, and privacy controls.",
    icon: UserCircle,
    color:
      "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40",
    count: 4,
  },
];

const allFAQs: FAQItem[] = [
  // Getting started
  {
    category: "getting-started",
    q: "What is Errand Mate?",
    a: "Errand Mate is a Ghana-based service marketplace that connects clients with verified local service providers. You can post tasks, browse services, and book providers — all in one place. Providers are matched to tasks using a smart scoring system that weighs location, pricing, service category, and relevance.",
  },
  {
    category: "getting-started",
    q: "How do I sign up?",
    a: "Click Sign Up on the homepage, enter your name, email, and password, then verify your email address. After verification, you'll be prompted to complete your profile: choose your role (Client or Provider), add contact details, and upload a profile photo. Providers additionally need to upload a Ghana Card for identity verification.",
  },
  {
    category: "getting-started",
    q: "What's the difference between a Client and a Provider?",
    a: "Clients post tasks and book service providers. Providers create service listings, get matched to tasks, and earn by completing work. You can switch roles at any time — your history and profile are preserved when you switch back.",
  },
  {
    category: "getting-started",
    q: "Is Errand Mate available outside Accra?",
    a: "Errand Mate currently supports the entire Greater Accra Region and other major cities in Ghana. Provider matching is location-based using GhanaPost GPS addresses, so both you and providers must have valid GPS addresses set in your profiles.",
  },
  {
    category: "getting-started",
    q: "How do I set my location?",
    a: "Go to your profile preferences and add a GhanaPost GPS address. You can add multiple saved addresses (home, office, etc.) and set one as your default. You can also share your live GPS when browsing nearby providers for real-time distance-based results.",
  },
  // Tasks & Matching
  {
    category: "tasks-matching",
    q: "How does the matching system work?",
    a: "When you post a task, our system scores nearby verified providers across six dimensions: service title relevance, description relevance, tag alignment, category match, location proximity, and pricing alignment. Providers who score above the threshold appear in your ranked matched list.",
  },
  {
    category: "tasks-matching",
    q: "What happens if no providers are matched?",
    a: "Your task automatically transitions to FLOATING status and becomes visible to every verified provider in your area. Providers can send a personalised interest message. You receive a notification for each and can request whichever you prefer. A floating task stays open until you select a provider or the task expires.",
  },
  {
    category: "tasks-matching",
    q: "What is the difference between browsing services and posting a task?",
    a: "Browsing lets you explore providers by category, compare pricing and reviews, and send a direct service request — you choose the provider. Posting a task is better when you are open to recommendations: the system surfaces the best matches automatically.",
  },
  {
    category: "tasks-matching",
    q: "How do I improve my match score as a provider?",
    a: "Write detailed service descriptions, use precise and relevant tags, keep your GhanaPost GPS location up to date, and price competitively. All six scoring dimensions affect your placement in matched results.",
  },
  {
    category: "tasks-matching",
    q: "Can I apply for a task that was matched to other providers?",
    a: "Only floating tasks are open for any provider to express interest. Tasks matched to specific providers only show that set of providers to the client. However, unresponded matched tasks can eventually float.",
  },
  {
    category: "tasks-matching",
    q: "Does declining requests affect my standing?",
    a: "Yes. Consistently declining after expressing interest or being auto-matched can reduce how often you appear in matched results. Only engage with tasks you are genuinely available to complete.",
  },
  // Payments
  {
    category: "payments",
    q: "When is my payment charged?",
    a: "Payment is only released when you explicitly validate the completed service. The booking enters Awaiting Validation once the provider marks work done — nothing is disbursed until you confirm or until an admin resolves a dispute.",
  },
  {
    category: "payments",
    q: "How are deposits handled?",
    a: "If a provider requires a deposit, you are informed of the percentage when making a request. The deposit is held securely and released to the provider only after you validate the completed service — the same trigger as the full payment.",
  },
  {
    category: "payments",
    q: "What payment methods are supported?",
    a: "Errand Mate supports MTN MoMo, Vodafone Cash, AirtelTigo Money, debit/credit card, and direct bank transfer. Providers configure their preferred payout method in their profile settings.",
  },
  {
    category: "payments",
    q: "How do I receive payment as a provider?",
    a: "Payment is disbursed after the client validates the completed service. Configure your preferred payout method (mobile money or bank transfer) in your provider profile settings before accepting bookings.",
  },
  {
    category: "payments",
    q: "Are there any platform fees?",
    a: "Errand Mate charges a small platform fee on completed transactions. The exact fee percentage is shown before you confirm any booking. Visit our Pricing page for the full breakdown.",
  },
  // Bookings
  {
    category: "bookings",
    q: "How do I cancel a booking?",
    a: "You can cancel a confirmed booking before the provider marks work as In Progress. After that point, cancellations must go through the dispute process. Cancellation policies depend on whether a deposit was collected and how close to the scheduled date you cancel.",
  },
  {
    category: "bookings",
    q: "How do I validate a completed service?",
    a: "When the provider marks their work as done, you receive a notification. Go to My Bookings, find the booking, and tap Validate. You can confirm the service is complete or raise a dispute with a written reason if you are unsatisfied.",
  },
  {
    category: "bookings",
    q: "What is the booking lifecycle?",
    a: "A booking moves through: Requested → Confirmed → In Progress → Awaiting Validation → Completed (or Disputed). Each stage sends you a notification and updates the booking status in your dashboard.",
  },
  {
    category: "bookings",
    q: "Can I reschedule a booking?",
    a: "Rescheduling must be agreed upon between you and the provider. Contact the provider directly through the booking chat. If you cannot reach an agreement, you can cancel (subject to the cancellation policy) and re-book.",
  },
  // Disputes
  {
    category: "disputes",
    q: "What if I'm not satisfied with the service?",
    a: "When validating a booking, choose Dispute and provide a written reason. The booking is escalated to our admin team, who review the case and mediate before any payment is released or withheld.",
  },
  {
    category: "disputes",
    q: "How long does dispute resolution take?",
    a: "Our admin team aims to review and resolve disputes within 2–5 business days. Complex cases may take longer. You will receive email notifications as the case progresses.",
  },
  {
    category: "disputes",
    q: "Are providers background-checked?",
    a: "All providers must upload a valid Ghana Card (National ID, Passport, Voters' ID, Driver's Licence, or NHIS card) before their services go live. Identity verification is typically completed within one business day.",
  },
  {
    category: "disputes",
    q: "What if a provider doesn't show up?",
    a: "If a provider fails to show up for a confirmed booking, you can raise a dispute immediately. Our team will review the case and ensure you are not charged for the incomplete service.",
  },
  // Account
  {
    category: "account",
    q: "Can I switch between Client and Provider?",
    a: "Yes. Role transitions are supported at any time. Switching away from Provider deactivates your services but preserves your provider profile — reactivated if you switch back. Your booking history is always retained.",
  },
  {
    category: "account",
    q: "Is my personal information kept private?",
    a: "Your contact details, GhanaPost GPS address, and payment information are never shared beyond what is needed to complete a booking. Providers see your first name and service location only after a booking is confirmed.",
  },
  {
    category: "account",
    q: "How do I delete my account?",
    a: "Go to Settings → Account and select Delete Account. You will be asked to confirm your password. Account deletion is permanent — all data is removed within 30 days. Active bookings must be completed or cancelled before deletion.",
  },
  {
    category: "account",
    q: "How long does identity verification take?",
    a: "ID verification is typically completed within one business day. Your services remain in draft status until verification is approved. You will receive an email notification when verification is complete.",
  },
];

// ─── FAQ Accordion Item ────────────────────────────────────────────────────────

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left bg-white dark:bg-zinc-900 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
        aria-expanded={isOpen}>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
          {item.q}
        </span>
        <ChevronDown
          className={cn(
            "shrink-0 w-4 h-4 mt-0.5 text-zinc-400 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0 bg-white dark:bg-zinc-900">
          <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-4" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── HelpPage ─────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const filteredFAQs = useMemo(() => {
    let items = allFAQs;
    if (activeCategory)
      items = items.filter((f) => f.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
      );
    }
    return items;
  }, [query, activeCategory]);

  const handleToggle = (key: string) => {
    setOpenItem((prev) => (prev === key ? null : key));
  };

  const handleCategoryClick = (id: string) => {
    setActiveCategory((prev) => (prev === id ? null : id));
    setOpenItem(null);
    // Scroll to FAQ section
    document
      .getElementById("faq-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 min-h-full"
      style={{ fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');`}</style>

      {/* ── Hero ── */}
      <header className="relative text-white overflow-hidden">
        <Image src="/errand-logo.jpg" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-zinc-950/80" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pt-16 sm:pt-20 pb-14 sm:pb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-zinc-800 text-xs font-medium text-zinc-400">
            <HelpCircle className="w-3 h-3" />
            Help &amp; Support
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
            How can we help?
          </h1>
          <p className="text-base text-zinc-400 max-w-lg leading-relaxed mb-8">
            Search our knowledge base or browse topics below. For anything else,
            our support team is one message away.
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveCategory(null);
              }}
              placeholder="Search for answers…"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="relative z-10 h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
      </header>

      {/* ── Help Categories ── */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-12 sm:py-16">
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-6">
          Browse by topic
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {helpCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={cn(
                  "group flex flex-col items-start gap-3 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200",
                  isActive
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm",
                )}>
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                    isActive ? "bg-white/15 dark:bg-black/10" : cat.color,
                  )}>
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-white dark:text-zinc-900" : "",
                    )}
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold leading-snug",
                      isActive
                        ? "text-white dark:text-zinc-900"
                        : "text-zinc-900 dark:text-zinc-100",
                    )}>
                    {cat.label}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5 leading-snug hidden sm:block",
                      isActive
                        ? "text-zinc-300 dark:text-zinc-600"
                        : "text-zinc-500 dark:text-zinc-500",
                    )}>
                    {cat.description}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-white/15 dark:bg-black/10 text-white dark:text-zinc-800"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
                  )}>
                  {cat.count} articles
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section
        id="faq-section"
        className="max-w-5xl mx-auto px-6 md:px-8 pb-16 sm:pb-20">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
              {activeCategory
                ? helpCategories.find((c) => c.id === activeCategory)?.label
                : query
                  ? "Search results"
                  : "Frequently asked"}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {query
                ? `${filteredFAQs.length} result${filteredFAQs.length !== 1 ? "s" : ""} for "${query}"`
                : activeCategory
                  ? helpCategories.find((c) => c.id === activeCategory)?.label +
                    " questions"
                  : "Common questions"}
            </h2>
          </div>
          {(activeCategory || query) && (
            <button
              onClick={() => {
                setActiveCategory(null);
                setQuery("");
                setOpenItem(null);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors underline underline-offset-2">
              Show all
            </button>
          )}
        </div>

        {filteredFAQs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              No results found
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Try a different search term or{" "}
              <button
                onClick={() => {
                  setQuery("");
                  setActiveCategory(null);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline">
                browse all topics
              </button>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFAQs.map((item) => {
              const key = item.category + item.q;
              return (
                <FAQAccordionItem
                  key={key}
                  item={item}
                  isOpen={openItem === key}
                  onToggle={() => handleToggle(key)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6 md:px-8">
        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
      </div>

      {/* ── Contact Support ── */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-16 sm:py-20">
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
          Still need help?
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Reach our support team
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10 max-w-md">
          We typically respond within a few hours during business hours.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Email */}
          <a
            href="mailto:support@errandmate.com"
            className="group flex flex-col gap-4 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Email support
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Send us a message and we&apos;ll respond within 24 hours.
              </p>
            </div>
            <span className="mt-auto flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
              support@errandmate.com
              <ArrowRight className="w-3 h-3" />
            </span>
          </a>

          {/* WhatsApp / Phone */}
          <a
            href="https://wa.me/0547740577"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-4 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                WhatsApp
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Chat with us directly for faster real-time support.
              </p>
            </div>
            <span className="mt-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
              Open WhatsApp
              <ExternalLink className="w-3 h-3" />
            </span>
          </a>

          {/* Contact form */}
          <Link
            href="/about-us/our-contacts"
            className="group flex flex-col gap-4 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
              <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Contact form
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Fill out our contact form and we&apos;ll route your query to the
                right team.
              </p>
            </div>
            <span className="mt-auto flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 group-hover:gap-2 transition-all">
              Go to contact page
              <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </section>

      {/* ── Footer strip — helpful links + meta info ── */}
      <section className="bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">

          {/* Helpful links — top of the strip so they're always in view */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
              Helpful links
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "How it works", href: "/how-it-works" },
                { label: "FAQ", href: "/how-it-works/faq" },
                { label: "Pricing", href: "/how-it-works/pricing" },
                { label: "Browse services", href: "/services" },
                { label: "Find providers", href: "/providers" },
                { label: "Contact us", href: "/about-us/our-contacts" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-150">
                  {link.label}
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-700 mb-8" />

          {/* Meta info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Support hours
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Mon – Fri, 8 am – 6 pm WAT
                  <br />
                  Sat, 9 am – 2 pm WAT
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Average response time
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Under 4 hours during business hours.
                  <br />
                  Disputes resolved within 2–5 days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Errand Mate HQ
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Accra, Greater Accra Region
                  <br />
                  Ghana, West Africa
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
