import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/components/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Send, Receipt, RefreshCw, Settings, LogOut, Menu as MenuIcon, X, ChevronDown, type LucideIcon } from "lucide-react";

export interface AppNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

// The signed-in navigation, shared by every app page so the menu is the same everywhere.
export const APP_NAV: AppNavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: FileText },
  { label: "Send for Signature", to: "/team", icon: Send },
  { label: "Invoices", to: "/invoices", icon: Receipt },
  { label: "File Converter", to: "/conversion", icon: RefreshCw },
];

const initialsOf = (name?: string | null, email?: string | null) =>
  (name || email || "U")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

export function AppHeader() {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const name = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email?.split("@")[0];

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? "bg-[#0A66C2]/10 text-[#0A66C2]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" aria-label="Endorse dashboard">
            <Logo className="h-9" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="App">
            {APP_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
                <span className="lg:hidden">{item.label.replace("Send for Signature", "Send")}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 outline-none hover:bg-slate-100" aria-label="Account menu">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-[#0A66C2]">
                {user?.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : initialsOf(name, user?.email)}
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen &&
        createPortal(
        <nav className="fixed inset-x-0 bottom-0 top-16 z-[60] overflow-y-auto border-t border-slate-200 bg-white p-4 md:hidden" aria-label="App">
          <div className="space-y-1">
            {APP_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold ${
                    isActive ? "bg-[#0A66C2]/10 text-[#0A66C2]" : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                <item.icon className="h-5 w-5" /> {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold ${
                  isActive ? "bg-[#0A66C2]/10 text-[#0A66C2]" : "text-slate-700 hover:bg-slate-50"
                }`
              }
            >
              <Settings className="h-5 w-5" /> Settings
            </NavLink>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-4 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 pt-5 text-base font-semibold text-red-600"
          >
            <LogOut className="h-5 w-5" /> Sign out
          </button>
        </nav>
          ,
          document.body
        )}
    </header>
  );
}
