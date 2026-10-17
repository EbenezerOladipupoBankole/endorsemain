import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Building2, CheckCircle2, Clock, Cloud, Globe, Heart, Shield, ShieldCheck, Zap } from "lucide-react";

const About = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />

      <main className="pt-12 md:pt-20">
        {/* Hero Section */}
        <section className="px-4 md:px-6 pb-16 md:pb-20 text-center">
          <div className="container mx-auto px-0 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              Our Company
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tight text-foreground">
              We're changing the way <br className="hidden sm:block" />
              <span className="text-[#0A66C2]">the world agrees.</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Endorse is dedicated to making every agreement digital, secure, and accessible from anywhere on the planet.
            </p>
          </div>
        </section>

        {/* Image / Visual Break */}
        <section className="px-4 md:px-6 mb-16 md:mb-24">
          <div className="container mx-auto px-0 max-w-6xl">
            <div className="aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden relative bg-secondary">
               {/* Abstract Enterprise Visual */}
               <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-8 opacity-20 transform -rotate-12 scale-125">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-64 h-40 bg-foreground rounded-xl" />
                    ))}
                  </div>
               </div>
               <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 md:p-12 bg-gradient-to-t from-black/80 to-transparent text-white">
                 <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold">Connecting businesses and people.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Mission & Story */}
        <section className="px-4 md:px-6 py-16 md:py-20 bg-secondary/20">
          <div className="container mx-auto px-0 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
                <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                  Founded in 2024, Endorse started with a simple premise: paper contracts are a bottleneck to progress. We believe that agreements should be as fast and fluid as the rest of your work.
                </p>
                <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
                  We are at the beginning of our journey, building a platform for forward-thinking individuals and teams. Whether you're a freelancer or a growing startup, Endorse provides the secure infrastructure to help you scale.
                </p>
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-[#0A66C2] mb-1">100%</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Committed</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-[#0A66C2] mb-1">Secure</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">By Design</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-[#0A66C2] mb-1">Global</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Vision</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#0A66C2]/20 to-[#FFC83D]/20 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-card border border-border p-6 md:p-8 rounded-2xl shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Built on Trust
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Security isn't just a feature; it's our foundation. We adhere to the strictest global standards to ensure your data remains yours.
                  </p>
                  <ul className="space-y-3">
                    {["Secure Cloud Infrastructure", "Encrypted Data Transfer", "Privacy Focused", "99.9% Uptime"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="px-4 md:px-6 py-16 md:py-24">
          <div className="container mx-auto px-0 max-w-6xl">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                The principles that guide every decision we make.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-8">
              {[
                {
                  icon: Heart,
                  title: "Customer Success",
                  desc: "We only win when our customers win. We obsess over user experience and support."
                },
                {
                  icon: Zap,
                  title: "Simplicity",
                  desc: "Complexity is the enemy of execution. We strive to make the complex simple."
                },
                {
                  icon: Shield,
                  title: "Integrity",
                  desc: "We do the right thing, even when no one is watching. Trust is our currency."
                }
              ].map((val, i) => (
                <div key={i} className="bg-card p-6 md:p-8 rounded-2xl border border-border hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {val.icon && <val.icon className="w-6 h-6 text-primary" />}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Remote First / Global Team */}
        <section className="px-4 md:px-6 py-16 md:py-24 bg-[#1a1f2c] text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
           <div className="container mx-auto px-0 max-w-6xl relative z-10">
             <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
               <div className="w-full md:w-1/2">
                 <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-white">Built for the<br/>Remote World.</h2>
                 <p className="text-gray-300 text-base md:text-lg md:mb-8 leading-relaxed">
                   We are a fully distributed team spanning multiple continents. This allows us to provide 24/7 support and build a product that truly understands global collaboration.
                 </p>
               </div>
               <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   { icon: Globe, title: "Remote First", desc: "Distributed team across 12+ time zones" },
                   { icon: Clock, title: "24/7 Support", desc: "Always on, wherever you are" },
                   { icon: ShieldCheck, title: "Global Compliance", desc: "Adhering to international standards" },
                   { icon: Cloud, title: "Digital Native", desc: "Born in the cloud, built for speed" }
                 ].map((item, i) => (
                   <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm">
                     <item.icon className="w-8 h-8 text-[#FFC83D] mb-4" />
                     <h4 className="font-bold text-lg text-white">{item.title}</h4>
                     <p className="text-sm text-gray-300">{item.desc}</p>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        </section>



        {/* CTA */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="container mx-auto px-0 max-w-4xl text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 md:mb-6">Join the movement</h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
              Ready to modernize your workflow? Start using Endorse today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 rounded-full px-8 text-lg font-bold bg-[#FFC83D] text-black hover:bg-[#e6b435]">
                <Link to="/auth?mode=signup">
                  Get Started for Free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 rounded-full px-8 text-lg font-bold border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#08519c]">
                <a href="mailto:support@endorse.online?subject=Sales%20enquiry">Contact Sales</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default About;
