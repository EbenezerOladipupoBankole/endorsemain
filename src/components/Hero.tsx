import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { Button } from "./ui/button";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
      {/* Background Gradient Blob */}
      <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6">
        <div
          className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-600 to-yellow-400 opacity-20"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="container mx-auto px-6 text-center">
        {/* Announcement Badge */}
        <div className="mx-auto mb-8 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-yellow-400/30 bg-yellow-400/10 px-7 py-2 backdrop-blur transition-all hover:border-yellow-400/50 hover:bg-yellow-400/20">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
          </span>
          <p className="text-sm font-semibold text-yellow-400">New Features Available</p>
        </div>

        {/* Main Heading */}
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-white sm:text-7xl">
          Validate your skills with{" "}
          <span className="text-yellow-400">confidence</span>
        </h1>
        
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          The professional way to showcase your expertise. Get verified endorsements from peers and stand out in your career with a trusted portfolio.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-x-6">
          <Button 
            size="xl" 
            className="min-w-[180px] border-2 border-yellow-400 bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(250,204,21,0.5)] transition-all hover:shadow-[0_0_30px_-5px_rgba(250,204,21,0.6)]"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="xl" 
            className="min-w-[180px] text-slate-300 hover:bg-slate-800 hover:text-yellow-400"
          >
            <Play className="mr-2 h-4 w-4 fill-current" />
            Watch Demo
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400 sm:gap-12">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-yellow-400" />
            <span>Verified Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-yellow-400" />
            <span>Instant Sharing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-yellow-400" />
            <span>Secure Data</span>
          </div>
        </div>
      </div>
    </section>
  );
};