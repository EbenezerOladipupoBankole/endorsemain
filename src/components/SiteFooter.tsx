import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Linkedin, Instagram } from "lucide-react";
import ndpcLogo from "@/assets/images/ndpc.png";
import { NewsletterForm } from "@/components/NewsletterForm";

const COLUMNS: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "Pricing", to: "/#pricing" },
      { label: "File Conversion", to: "/conversion" },
      { label: "API Documentation", to: "/api-docs" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Sales & Operations", to: "/solutions/sales-operations" },
      { label: "HR & Recruiting", to: "/solutions/hr-recruiting" },
      { label: "Legal & Compliance", to: "/solutions/legal-compliance" },
    ],
  },
  {
    title: "Company",
    links: [
      // { label: "About", to: "/about" },
      { label: "Blog", to: "/blog" },
      { label: "Help Center", to: "/help-center" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Python SDK", to: "https://github.com/endorse/python-sdk", external: true },
      { label: "GitHub", to: "https://github.com/endorse", external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 pb-8 pt-12 md:px-6 md:pt-16 dark:border-slate-800 dark:bg-slate-950">
      <div className="container mx-auto max-w-6xl px-0">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link to="/" aria-label="Endorse home">
              <Logo className="h-12" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              The professional way to sign and endorse documents securely online.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://www.linkedin.com/company/e-ndorse/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Endorse on LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0A66C2]"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/e.ndorse"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Endorse on Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0A66C2]"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <img src={ndpcLogo} alt="Registered with the Nigeria Data Protection Commission" width={120} height={48} loading="lazy" className="mt-4 h-10 w-auto object-contain" />
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{col.title}</h4>
              <ul className="mt-4 space-y-1">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.to} target="_blank" rel="noopener noreferrer" className="block py-1.5 text-sm text-slate-600 transition-colors hover:text-[#0A66C2] dark:text-slate-400">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="block py-1.5 text-sm text-slate-600 transition-colors hover:text-[#0A66C2] dark:text-slate-400">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 md:flex-row md:items-center md:justify-between md:p-6 dark:bg-slate-900">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Get product updates in your inbox</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">New features, guides and news from the Endorse team.</p>
          </div>
          <NewsletterForm source="footer" className="w-full md:max-w-md" />
        </div>

        <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row dark:border-slate-800">
          <p>© {new Date().getFullYear()} Endorse. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacy" className="inline-flex min-h-[44px] items-center whitespace-nowrap hover:text-[#0A66C2]">Privacy Policy</Link>
            <Link to="/terms" className="inline-flex min-h-[44px] items-center whitespace-nowrap hover:text-[#0A66C2]">Terms of Service</Link>
            <Link to="/cookie-policy" className="inline-flex min-h-[44px] items-center whitespace-nowrap hover:text-[#0A66C2]">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
