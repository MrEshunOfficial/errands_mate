"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

type Topic = "general" | "support" | "provider" | "partnerships" | "press";

const topicLabels: Record<Topic, string> = {
  general: "General enquiry",
  support: "Client or booking support",
  provider: "Provider onboarding",
  partnerships: "Partnerships",
  press: "Press & media",
};

const ContactsPage: React.FC = () => {
  const [topic, setTopic] = useState<Topic>("general");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
            Contact
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-5">
            Get in touch.
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Whether you need help with a booking, want to join as a provider, or have a partnership idea — we&apos;re here.
          </p>
        </div>
        <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </header>

      {/* Body */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-20">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          {/* Contact form */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-8">
              Send us a message
            </p>

            {submitted ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Message received
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  We&apos;ll respond to{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {form.email}
                  </span>{" "}
                  within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Topic */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Topic
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(topicLabels) as Topic[]).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTopic(t)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                          topic === t
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                        }`}>
                        {topicLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Your name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Kofi Mensah"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="kofi@example.com"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    placeholder="How can we help?"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 dark:focus:border-amber-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm">
                  Send message
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-8">
              Contact details
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                    Email
                  </p>
                  <a
                    href="mailto:hello@errandsmate.com"
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                    hello@errandsmate.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                    Phone
                  </p>
                  <a
                    href="tel:+233302000000"
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                    +233 30 200 0000
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                    Office
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Cantonments, Accra
                    <br />
                    Greater Accra Region, Ghana
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                    Support hours
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Monday – Friday, 8 am – 6 pm GMT
                    <br />
                    Saturday, 9 am – 1 pm GMT
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                    Response time
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    We aim to respond within one business day. Urgent booking issues are prioritised.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactsPage;
