import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SignDocument = lazy(() => import("./pages/SignDocument"));
const WhatsAppVerify = lazy(() => import("./pages/WhatsAppVerify"));
const VerifyDocument = lazy(() => import("./pages/VerifyDocument"));
const Blog = lazy(() => import("./pages/Blog"));
// About page is hidden for now; uncomment this and the /about route to bring it back.
// import About from "./pages/About";
const Payment = lazy(() => import("./Payment"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Team = lazy(() => import("./pages/Team"));
const Settings = lazy(() => import("./pages/Settings"));
const FileConversion = lazy(() => import("./pages/FileConversion"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const AdminHelpCenter = lazy(() => import("./pages/AdminHelpCenter"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const Invoices = lazy(() => import("./pages/Invoices"));
const SalesOperations = lazy(() => import("./pages/SalesOperations"));
const HrRecruiting = lazy(() => import("./pages/HrRecruiting"));
const LegalCompliance = lazy(() => import("./pages/LegalCompliance"));
const ProductESign = lazy(() => import("./pages/product/ESign"));
const ProductSendForSignature = lazy(() => import("./pages/product/SendForSignature"));
const ProductInvoices = lazy(() => import("./pages/product/Invoices"));
const ProductTemplates = lazy(() => import("./pages/product/Templates"));

const queryClient = new QueryClient();

// Shown briefly while a page other than the landing page downloads.
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#0A66C2]" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/blog" element={<Blog />} />
          {/* <Route path="/about" element={<About />} /> */}
          <Route path="/payment" element={<Payment />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/conversion" element={<FileConversion />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/solutions/sales-operations" element={<SalesOperations />} />
          <Route path="/solutions/hr-recruiting" element={<HrRecruiting />} />
          <Route path="/solutions/legal-compliance" element={<LegalCompliance />} />
          <Route path="/product/esign" element={<ProductESign />} />
          <Route path="/product/send-for-signature" element={<ProductSendForSignature />} />
          <Route path="/product/invoices" element={<ProductInvoices />} />
          <Route path="/product/templates" element={<ProductTemplates />} />
          {/* Signing pages handle their own auth: email signers log in, WhatsApp signers verify a code. */}
          <Route path="/sign/:id" element={<SignDocument />} />
          <Route path="/sign/:id/verify" element={<WhatsAppVerify />} />
          <Route path="/verify" element={<VerifyDocument />} />
          <Route path="/verify/:hash" element={<VerifyDocument />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/help" element={<AdminHelpCenter />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
