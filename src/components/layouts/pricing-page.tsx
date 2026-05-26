"use client";
import React from "react";
import Image from "next/image";
import {
  CheckCircle,
  Lock,
  Zap,
  Star,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";

const freeTierFeatures = [
  "Post unlimited tasks",
  "Browse all service categories",
  "Direct provider requests",
  "Task matching & floating tasks",
  "Client-controlled payment release",
  "Dispute mediation by admin team",
  "Star ratings and written reviews",
  "GhanaPost GPS location matching",
  "Mobile money, card & bank payouts",
  "Provider ID verification",
];

const premiumTeaserFeatures = [
  {
    title: "Priority matching",
    desc: "Your tasks surface at the top of provider feeds for faster responses.",
  },
  {
    title: "Verified badge",
    desc: "A visible trust signal on your profile that increases client confidence.",
  },
  {
    title: "Analytics dashboard",
    desc: "Track earnings, booking trends, and match score breakdowns over time.",
  },
  {
    title: "Featured provider listing",
    desc: "Appear at the top of category search results and browse pages.",
  },
  {
    title: "Multiple service areas",
    desc: "Expand your reach beyond a single GhanaPost GPS zone.",
  },
  {
    title: "Early access to new features",
    desc: "Be first to try new tools before they roll out to the platform.",
  },
];

const PricingPage: React.FC = () => {
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
            Pricing
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-4">
            Free to use.
            <br />
            Always.
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Errands Mate is completely free for clients and providers today. Premium features are on the roadmap — we&apos;ll let you know before anything changes.
          </p>
        </div>
        <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </header>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-20">
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-10">
          Current plans
        </p>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Free tier */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-zinc-900 dark:border-zinc-100 p-8 relative">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active now
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Free
            </h2>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ₵0
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                / month
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Full platform access at no cost. No credit card required.
            </p>

            <ul className="space-y-3 mb-8">
              {freeTierFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Premium coming soon */}
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-8 relative overflow-hidden">
            {/* Coming soon overlay badge */}
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 mb-6">
              <Clock className="w-3 h-3" />
              Coming soon
            </div>

            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Premium
            </h2>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-5xl font-bold tracking-tight text-zinc-300 dark:text-zinc-600">
                —
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Pricing will be announced before launch. Early adopters will receive a special introductory rate.
            </p>

            <ul className="space-y-4 mb-8">
              {premiumTeaserFeatures.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {f.title}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed mt-0.5">
                      {f.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-sm font-semibold rounded-xl cursor-not-allowed">
              <Lock className="w-4 h-4" />
              Payment system in development
            </button>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-t border-zinc-100 dark:border-zinc-800 py-20 bg-zinc-50 dark:bg-zinc-800/30">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-8">
            Our pricing principles
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Zap className="w-4 h-4" />,
                title: "No surprise fees",
                body: "We will never introduce platform fees without clear notice well in advance. Providers keep every cedi they earn.",
              },
              {
                icon: <Star className="w-4 h-4" />,
                title: "Early adopter protection",
                body: "Clients and providers who join during the free period will receive priority consideration and a preferential rate when Premium launches.",
              },
              {
                icon: <CheckCircle className="w-4 h-4" />,
                title: "Free tier stays free",
                body: "Core functionality — posting tasks, getting matched, booking, and payment release — will always be available at no charge.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-3 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  {p.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {p.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-zinc-900 dark:text-zinc-100">
            Start for free today.
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            No payment required. No commitment. Just sign up and get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
              Create free account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              How it works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
