"use client";
import React from "react";
import Image from "next/image";
import { Github, Linkedin, Twitter, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  initials: string;
  accent: string;
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

const team: TeamMember[] = [
  {
    name: "Kofi Eshun",
    role: "Founder & CEO",
    bio: "Started Errands Mate after years of watching skilled tradespeople and service providers go undiscovered. Drives product vision and operations from Accra.",
    initials: "KE",
    accent: "bg-amber-500",
  },
  {
    name: "Abena Mensah",
    role: "Head of Product",
    bio: "Obsessed with reducing the steps between a problem and a solution. Designed the task-matching flow and the client payment validation system.",
    initials: "AM",
    accent: "bg-blue-500",
  },
  {
    name: "Kwame Boateng",
    role: "Lead Engineer",
    bio: "Architect of the six-dimension scoring engine and the GhanaPost GPS integration. Previously built fintech infrastructure serving West Africa.",
    initials: "KB",
    accent: "bg-violet-500",
  },
  {
    name: "Ama Owusu",
    role: "Trust & Safety",
    bio: "Oversees the provider ID-verification process and admin dispute mediation. Ensures every person on the platform is who they say they are.",
    initials: "AO",
    accent: "bg-emerald-500",
  },
  {
    name: "Yaw Darko",
    role: "Growth & Partnerships",
    bio: "Connects Errands Mate with local businesses, service associations, and community leaders across Greater Accra and beyond.",
    initials: "YD",
    accent: "bg-rose-500",
  },
  {
    name: "Efua Asante",
    role: "Customer Success",
    bio: "First point of contact for clients and providers who need help. Turns every support interaction into a product insight.",
    initials: "EA",
    accent: "bg-zinc-600",
  },
];

const Avatar: React.FC<{ member: TeamMember }> = ({ member }) => (
  <div
    className={`w-12 h-12 rounded-2xl ${member.accent} flex items-center justify-center text-white text-sm font-bold tracking-wide shrink-0`}>
    {member.initials}
  </div>
);

const TeamPage: React.FC = () => {
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
            The Team
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-5">
            The people
            <br />
            behind the platform.
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed">
            A small, focused team in Accra building the infrastructure for local services in Ghana.
          </p>
        </div>
        <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </header>

      {/* Team grid */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-20">
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-10">
          Our team
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member) => (
            <div
              key={member.name}
              className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start gap-3 mb-4">
                <Avatar member={member} />
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {member.name}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                    {member.role}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {member.bio}
              </p>
              {member.social && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                  {member.social.github && (
                    <a
                      href={member.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                      <Github className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.social.linkedin && (
                    <a
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.social.twitter && (
                    <a
                      href={member.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Join the team */}
      <section className="py-20 px-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-zinc-900 dark:text-zinc-100">
            We&apos;re always looking for great people.
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            If you care about building useful things for real people in Ghana, we'd love to hear from you.
          </p>
          <Link
            href="/about-us/our-contacts"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
            Get in touch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TeamPage;
