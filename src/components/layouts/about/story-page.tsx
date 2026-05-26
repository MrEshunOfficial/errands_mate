"use client";
import React from "react";
import Image from "next/image";
import { MapPin, Zap, Shield, Heart, ArrowRight, Users } from "lucide-react";
import Link from "next/link";

const milestones = [
  {
    year: "2022",
    title: "The problem",
    body: "Our founder, Kofi Eshun, spent three weeks trying to hire a reliable plumber in Accra — calling numbers that never answered, receiving inflated quotes from strangers, and ultimately fixing a burst pipe himself. He knew millions of Ghanaians faced the same friction every day.",
  },
  {
    year: "2023",
    title: "The idea",
    body: "Kofi began mapping the gap: skilled tradespeople, cleaners, tutors, and errand runners were everywhere — but with no visible, trustworthy way to reach them. A marketplace built around GhanaPost GPS could make location-accurate matching possible for the first time.",
  },
  {
    year: "2024",
    title: "Building the foundation",
    body: "A small team came together in Accra to design a system where clients control payments, providers earn reliably, and identity verification creates the trust layer the market was missing. The platform's six-dimension matching engine was the breakthrough that made quality pairing possible at scale.",
  },
  {
    year: "2025",
    title: "Errands Mate launches",
    body: "We opened our doors to clients and providers across Greater Accra. Within the first quarter, hundreds of bookings were completed — home repairs, cleaning, tutoring, and personal errands — with every cedi released only after the client confirmed the work was done.",
  },
];

const values = [
  {
    icon: <Shield className="w-4 h-4" />,
    title: "Trust first",
    body: "Every provider is ID-verified before their first service goes live. Trust is not a feature — it is the foundation.",
  },
  {
    icon: <MapPin className="w-4 h-4" />,
    title: "Local at heart",
    body: "We built around GhanaPost GPS because location accuracy matters for real work in real neighbourhoods.",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: "Fair by design",
    body: "Clients control payment release. Providers keep every cedi they earn. No hidden cuts or surprise fees.",
  },
  {
    icon: <Heart className="w-4 h-4" />,
    title: "Community driven",
    body: "Reviews and ratings feed the matching engine — the community's collective voice determines who rises.",
  },
];

const StoryPage: React.FC = () => {
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
            Our Story
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-5">
            Built in Ghana,
            <br />
            for Ghana.
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Errands Mate started with a simple frustration: finding a trustworthy local service provider should not be this hard. We built the platform we wished existed.
          </p>
        </div>
        <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </header>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-20">
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-5">
          Our mission
        </p>
        <blockquote className="text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 leading-snug max-w-3xl border-l-4 border-amber-500 pl-6">
          To make every skilled person in Ghana discoverable, trustworthy, and reachable — and to give every client the confidence that the job will get done.
        </blockquote>
      </section>

      {/* Timeline */}
      <section className="border-t border-zinc-100 dark:border-zinc-800 py-20 bg-zinc-50 dark:bg-zinc-800/30">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-10">
            How we got here
          </p>
          <div className="relative">
            <div className="absolute left-10 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden md:block" />
            <div className="space-y-8">
              {milestones.map((m) => (
                <div key={m.year} className="flex gap-8 items-start">
                  <div className="w-20 shrink-0 pt-1 text-right">
                    <span className="text-xs font-bold text-amber-500 tracking-widest">
                      {m.year}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-900 hidden md:block" />
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        {m.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {m.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-20">
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-8">
          What we stand for
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="flex items-start gap-3 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                {v.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {v.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {v.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-5">
            <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-zinc-900 dark:text-zinc-100">
            Meet the team behind it
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            A small group of people who care deeply about getting this right.
          </p>
          <Link
            href="/about-us/team"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
            Meet the team
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default StoryPage;
