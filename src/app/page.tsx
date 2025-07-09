"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Code, Terminal, GitBranch, Zap, Cloud, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <Code className="h-8 w-8 text-primary" />,
    title: "Full-Fledged Editor",
    description: "A complete code editor experience with syntax highlighting, powered by Monaco.",
  },
  {
    icon: <Terminal className="h-8 w-8 text-primary" />,
    title: "Integrated Terminal",
    description: "Execute commands and run code in a familiar terminal interface.",
  },
  {
    icon: <GitBranch className="h-8 w-8 text-primary" />,
    title: "Source Control",
    description: "Clone from GitHub and manage your projects with built-in version control.",
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Code Execution",
    description: "Run JavaScript, Python, C++, and more in a secure sandboxed environment.",
  },
  {
      icon: <Cloud className="h-8 w-8 text-primary" />,
      title: "Cloud Workspace",
      description: "Your files are saved to your account, accessible from anywhere.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: "Secure & Reliable",
    description: "Your work is always saved and protected with a resilient cloud backend.",
  },
];

const testimonials = [
  {
    name: "Alex Rivera",
    title: "Senior Developer, Tech Innovators",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "man portrait",
    quote: "CodeVerse has completely transformed my workflow. The ability to have a full-featured IDE in the browser, synced across all my devices, is a game-changer for productivity."
  },
  {
    name: "Samantha Chen",
    title: "Founder, Creative Coders",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "woman portrait",
    quote: "As a startup founder, I need tools that are fast, reliable, and require zero setup. CodeVerse delivers on all fronts. I was able to onboard my entire team in minutes."
  },
  {
    name: "David Lee",
    title: "Freelance Web Developer",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "man glasses",
    quote: "The integrated terminal and multi-language support are phenomenal. I can switch between a Node.js backend and a Python script without ever leaving my browser. Highly recommended!"
  },
];

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex flex-col items-start text-left p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 hover:bg-card transition-all transform hover:-translate-y-1">
        <div className="mb-4 p-3 bg-primary/10 rounded-lg">{icon}</div>
        <h3 className="text-xl font-headline mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

const TestimonialCard = ({ name, title, avatar, dataAiHint, quote }: { name: string; title: string; avatar: string; dataAiHint: string; quote: string; }) => (
    <Card className="bg-card/50 p-6 flex flex-col justify-between">
        <div>
            <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </div>
            <p className="text-muted-foreground mb-6">"{quote}"</p>
        </div>
        <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={avatar} alt={name} data-ai-hint={dataAiHint} />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
    </Card>
);


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.232,13.247,13.247,21.232a2.46,2.46,0,0,1-3.486,0L2.768,14.238a2.46,2.46,0,0,1,0-3.486L9.762,3.758a2.46,2.46,0,0,1,3.486,0l6.993,6.993A2.46,2.46,0,0,1,21.232,13.247Z" className='fill-primary'/>
            </svg>
            <span className="font-bold text-lg">CodeVerse</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Link href="/signin" className={cn(buttonVariants({ variant: "ghost" }))}>
              Sign In
            </Link>
            <Link href="/signup" className={cn(buttonVariants())}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-20 md:py-28 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute bottom-0 left-0 right-0 top-0 -z-10 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>

            <div className="container mx-auto text-center px-4 md:px-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                       The Future of Development.
                        <br />
                        <span className="text-primary">In Your Browser.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
                        CodeVerse is a blazingly fast, cloud-native development environment that works from anywhere, on any device. No setup required.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "group")}>
                           Get Started - It's Free
                           <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link href="https://github.com" target="_blank" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "flex items-center gap-2")}>
                           View on GitHub
                           <GitBranch className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
                <div className="relative mt-12 md:mt-16 max-w-5xl mx-auto">
                    <div className="relative rounded-xl shadow-2xl shadow-primary/20">
                      <Image 
                        src="https://placehold.co/1200x800.png"
                        width={1200}
                        height={800}
                        alt="CodeVerse IDE Interface"
                        data-ai-hint="ide interface dark"
                        className="rounded-xl border-2 border-primary/20"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                    </div>
                </div>
            </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-card/50 border-y border-border">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl">A Full-Featured IDE in Your Browser</h2>
                    <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl">
                        From editing and debugging to source control, get all the tools you need to be productive.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                    ))}
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl">Loved by Developers Worldwide</h2>
              <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl">
                Don't just take our word for it. Here's what our users are saying.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-card/50 border-t border-border">
            <div className="container text-center px-4 md:px-6">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Ready to Build?</h2>
                    <p className="mt-4 text-muted-foreground md:text-xl">
                        Create an account and get instant access to your personal cloud IDE. It's free to get started.
                    </p>
                    <div className="mt-6">
                        <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "group")}>
                            Sign Up Now
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t border-border/40">
        <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.232,13.247,13.247,21.232a2.46,2.46,0,0,1-3.486,0L2.768,14.238a2.46,2.46,0,0,1,0-3.486L9.762,3.758a2.46,2.46,0,0,1,3.486,0l6.993,6.993A2.46,2.46,0,0,1,21.232,13.247Z" className='fill-primary'/>
                </svg>
                <span className="font-bold">CodeVerse</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CodeVerse. All rights reserved.
            </p>
            <nav className="flex gap-4 sm:gap-6">
              <Link href="/terms" className="text-sm hover:underline underline-offset-4 text-muted-foreground">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm hover:underline underline-offset-4 text-muted-foreground">
                Privacy Policy
              </Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
