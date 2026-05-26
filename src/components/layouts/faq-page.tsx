"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Users,
  Briefcase,
  ArrowRight,
  MessageCircleQuestion,
} from "lucide-react";
import Link from "next/link";

type Role = "client" | "provider";

const clientFAQs = [
  {
    q: "What happens if no providers are matched to my task?",
    a: "Your task automatically transitions to FLOATING status and becomes visible to every verified provider in your area. Providers can send a personalized message expressing their interest. You receive a notification for each one and can request whichever you prefer. A floating task stays open until you select a provider or the task expires.",
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
  {
    q: "Is my personal information kept private?",
    a: "Yes. Your contact details, GhanaPost GPS address, and payment information are never shared with providers or other users beyond what is needed to complete a booking. Providers see your first name and service location only after a booking is confirmed.",
  },
  {
    q: "How do I cancel a booking?",
    a: "You can cancel a confirmed booking before the provider marks work as In Progress. After that point, cancellations must go through the dispute process. Cancellation policies and any applicable fees depend on whether a deposit was collected and how close to the scheduled date you cancel.",
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
  {
    q: "How long does identity verification take?",
    a: "ID verification is typically completed within one business day. Accepted documents include a National ID, Passport, Voters' ID, Driver's Licence, or NHIS card. Your services remain in draft status until verification is approved.",
  },
  {
    q: "How do I receive payment?",
    a: "Payment is disbursed after the client validates the completed service. Supported channels are mobile money (MTN MoMo, Vodafone Cash, AirtelTigo Money), debit/credit card, and direct bank transfer. You configure your preferred payout method in your profile settings.",
  },
];

const FAQPage: React.FC = () => {
  const [role, setRole] = useState<Role>("client");
  const [open, setOpen] = useState<number | null>(null);

  const faqs = role === "client" ? clientFAQs : providerFAQs;

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setOpen(null);
  };

  return (
    <div
      className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
      style={{ fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');`}</style>

      {/* Hero */}
      <header className="relative text-white overflow-hidden">
        <Image src="/errand-logo.jpg" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-zinc-950/80" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8 pt-20 pb-16">
          <div className="inline-flex items-center gap-2 mb-7 px-3 py-1 rounded-full border border-zinc-800 text-xs font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Frequently Asked Questions
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-4">
            Common questions
          </h1>

          <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed mb-10">
            {role === "client"
              ? "Everything clients need to know about hiring, matching, and payments on Errands Mate."
              : "Everything providers need to know about getting matched, earning, and managing their profile."}
          </p>

          <div className="inline-flex items-center bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            {(["client", "provider"] as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => handleRoleChange(r)}
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
        <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </header>

      {/* FAQ accordion */}
      <section className="bg-zinc-950 py-16">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <div className="divide-y divide-zinc-800">
            {faqs.map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-start justify-between gap-4 text-left group">
                  <span className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors leading-relaxed">
                    {faq.q}
                  </span>
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
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

      {/* Still have questions */}
      <section className="py-20 px-6 bg-white dark:bg-zinc-900">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center mx-auto mb-5">
            <MessageCircleQuestion className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-zinc-900 dark:text-zinc-100">
            Still have questions?
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            Our support team is available to help with anything not covered
            above.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/about-us/our-contacts"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
              Contact support
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Platform guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;
