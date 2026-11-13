import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto w-full max-w-xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#0A66C2]">Error 404</p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
            We couldn't find that page
          </h1>
          <p className="mx-auto mb-8 max-w-md text-base text-slate-600 md:text-lg dark:text-slate-300">
            The link may be broken, or the page may have moved. Let's get you back to signing.
          </p>
          <p className="mx-auto mb-8 max-w-full truncate rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            {location.pathname}
          </p>

          <Button
            asChild
            className="h-12 w-full rounded-full bg-[#0A66C2] px-8 text-base font-bold text-white hover:bg-[#08519c] sm:w-auto"
          >
            <Link to="/">
              Back to Home
            </Link>
          </Button>

          <div className="mt-10 grid gap-3 text-left sm:grid-cols-2">
            <Link
              to="/help-center"
              className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/5 dark:border-slate-800"
            >
              <span className="flex-1">
                <span className="block font-semibold text-slate-900 dark:text-white">Help Center</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">Guides and support</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0A66C2]" />
            </Link>
            <Link
              to="/blog"
              className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/5 dark:border-slate-800"
            >
              <span className="flex-1">
                <span className="block font-semibold text-slate-900 dark:text-white">Blog</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">News and how-tos</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0A66C2]" />
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default NotFound;
