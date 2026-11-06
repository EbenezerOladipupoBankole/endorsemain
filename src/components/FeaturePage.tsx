import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import type { LucideIcon } from "lucide-react";

export const serif = { fontFamily: "Gilroy, Inter, system-ui, sans-serif" };

export interface FeatureStep {
  title: string;
  text: string;
}

export interface FeatureHighlight {
  icon: LucideIcon;
  title: string;
  text: string;
}

export interface FeatureFaq {
  q: string;
  a: string;
}

interface FeaturePageProps {
  /** Browser tab / search result title and description. */
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: ReactNode;
  intro: string;
  /** Where the feature lives in the app; logged-out visitors sign up first and land there. */
  appPath: string;
  mockup: ReactNode;
  stepsTitle: string;
  steps: FeatureStep[];
  highlightsTitle: string;
  highlights: FeatureHighlight[];
  faqs: FeatureFaq[];
  closingTitle: ReactNode;
}

/** Sets the tab title and meta description while the page is shown, restoring the defaults after. */
export const useDocumentMeta = (title: string, description: string) => {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevTitle = document.title;
    const prevDescription = meta?.content;
    document.title = title;
    if (meta) meta.content = description;
    return () => {
      document.title = prevTitle;
      if (meta && prevDescription !== undefined) meta.content = prevDescription;
    };
  }, [title, description]);
};

/** Shared layout for the Product menu pages: what it is, how it works, what you get, FAQ, Get Started. */
export function FeaturePage({
  metaTitle,
  metaDescription,
  eyebrow,
  title,
  intro,
  appPath,
  mockup,
  stepsTitle,
  steps,
  highlightsTitle,
  highlights,
  faqs,
  closingTitle,
}: FeaturePageProps) {
  const { user } = useAuth();
  useDocumentMeta(metaTitle, metaDescription);
  const ctaHref = user ? appPath : `/auth?mode=signup&redirect=${encodeURIComponent(appPath)}`;

  const cta = (
    <Button asChild className="h-12 rounded-full bg-[#FFC83D] px-8 text-base font-extrabold text-black shadow-sm hover:bg-[#e6b435]">
      <Link to={ctaHref}>Get Started</Link>
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white font-sans text-[#0F172A] dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />

      {/* Hero */}
      <section className="px-4 pb-16 pt-12 md:px-8 md:pb-20 md:pt-20">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-[#0A66C2] dark:text-[#FFC83D]">{eyebrow}</p>
            <h1 className="mt-4 text-[2.4rem] leading-[1.08] text-[#0F172A] sm:text-[3.4rem] dark:text-white" style={serif}>
              {title}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[#475569] sm:text-lg dark:text-slate-400">{intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {cta}
              <span className="text-sm text-[#64748B]">Free to start · no credit card</span>
            </div>
          </div>
          <div className="min-w-0">{mockup}</div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[#DCE6F2] bg-[#F8FAFC] px-4 py-16 md:px-8 md:py-20 dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl text-[#0F172A] sm:text-4xl dark:text-white" style={serif}>
            {stepsTitle}
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-[#DCE6F2] bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A66C2] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-4 text-xl text-[#0F172A] dark:text-white" style={serif}>
                  {step.title}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#475569] dark:text-slate-400">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Highlights */}
      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl text-[#0F172A] sm:text-4xl dark:text-white" style={serif}>
            {highlightsTitle}
          </h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <div key={h.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] dark:text-[#FFC83D]">
                  <h.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-[#0F172A] dark:text-white">{h.title}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-[#475569] dark:text-slate-400">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#DCE6F2] px-4 py-16 md:px-8 md:py-20 dark:border-slate-800">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl text-[#0F172A] sm:text-4xl dark:text-white" style={serif}>
            Questions, answered
          </h2>
          <div className="mt-8 divide-y divide-[#DCE6F2] border-y border-[#DCE6F2] dark:divide-slate-800 dark:border-slate-800">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-[#0F172A] dark:text-white [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-xl leading-none text-[#0A66C2] transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-[#475569] dark:text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-[#0A66C2] px-4 py-16 text-center md:px-8 md:py-20">
        <h2 className="mx-auto max-w-2xl text-3xl leading-tight text-white sm:text-[2.6rem]" style={serif}>
          {closingTitle}
        </h2>
        <div className="mt-8 flex justify-center">{cta}</div>
      </section>

      <SiteFooter />
    </div>
  );
}
