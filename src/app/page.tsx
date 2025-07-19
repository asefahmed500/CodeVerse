
"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowRight, Code, Terminal, GitBranch, Zap, Cloud, ShieldCheck, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

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

const supportedLanguages = [
    { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
    { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
    { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
    { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
    { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
    { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' },
    { name: 'Go', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg' },
    { name: 'PHP', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
    { name: 'Ruby', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg' },
    { name: 'Rust', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg' },
    { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
    { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
];


const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

const FeatureCard = ({ icon, title, description, index }: { icon: React.ReactNode, title: string, description: string, index: number }) => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      custom={index}
      className="flex flex-col items-start text-left p-6 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:bg-card transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-primary/20"
    >
        <div className="mb-4 p-3 bg-primary/10 rounded-lg">{icon}</div>
        <h3 className="text-xl font-headline mb-2 font-bold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </motion.div>
);

export default function Home() {
  const year = new Date().getFullYear();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CodeVerse logo">
                <path d="M21.232,13.247,13.247,21.232a2.46,2.46,0,0,1-3.486,0L2.768,14.238a2.46,2.46,0,0,1,0-3.486L9.762,3.758a2.46,2.46,0,0,1,3.486,0l6.993,6.993A2.46,2.46,0,0,1,21.232,13.247Z" className='fill-primary'/>
            </svg>
            <span className="font-bold text-lg">CodeVerse</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            <Link href="/signin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sign In
            </Link>
            <Link href="/signup" className={cn(buttonVariants({size: "sm"}))}>
              Get Started
            </Link>
          </nav>
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md hover:bg-accent">
                {mobileMenuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
            </button>
          </div>
        </div>
        <AnimatePresence>
        {mobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
            >
                <nav className="flex flex-col items-center space-y-2 px-4 py-4 border-t border-border/40">
                    <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>
                      Sign In
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className={cn(buttonVariants(), "w-full")}>
                      Get Started
                    </Link>
                </nav>
            </motion.div>
        )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-20 md:py-28 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute bottom-0 left-0 right-0 top-0 -z-10 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>

            <div className="container mx-auto text-center px-4 md:px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="max-w-4xl mx-auto space-y-6"
                >
                    <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                       The Future of Development.
                        <br />
                        <span className="text-primary">In Your Browser.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
                        CodeVerse is a blazingly fast, cloud-native development environment that works from anywhere, on any device. No setup required.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "group shadow-lg shadow-primary/20 hover:shadow-primary/30")}>
                           Get Started - It's Free
                           <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                    className="relative mt-12 md:mt-16 max-w-5xl mx-auto"
                >
                    <div className="relative rounded-xl shadow-2xl shadow-primary/20">
                       <Image 
        src="https://plus.unsplash.com/premium_photo-1720287601300-cf423c3d6760?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        width={1200}
        height={800}
        alt="An abstract, dark, and professional background with code-like elements"
        className="rounded-xl border-2 border-primary/20"
        priority
      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                    </div>
                </motion.div>
            </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-card/50 border-y border-border">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center space-y-4 mb-12"
                >
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl">A Full-Featured IDE in Your Browser</h2>
                    <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl">
                        From editing and debugging to source control, get all the tools you need to be productive.
                    </p>
                </motion.div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} index={index} />
                    ))}
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center space-y-4 mb-12"
            >
              <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl">
                Run Code in Any Language
              </h2>
              <p className="max-w-3xl mx-auto text-muted-foreground md:text-xl">
                CodeVerse supports a wide range of popular programming languages for both code execution and syntax highlighting.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-center">
              {supportedLanguages.map((lang, index) => (
                <motion.div
                  key={lang.name}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  custom={index}
                  className="flex flex-col items-center justify-center p-4 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card transition-colors group"
                >
                  <img src={lang.icon} alt={`${lang.name} logo`} className="h-12 w-12 mb-2 transition-transform group-hover:scale-110" />
                  <p className="text-sm font-medium text-foreground">{lang.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-card/50 border-t border-border">
            <div className="container text-center px-4 md:px-6">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-2xl mx-auto"
                >
                    <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl">Ready to Build?</h2>
                    <p className="mt-4 text-muted-foreground md:text-xl">
                        Create an account and get instant access to your personal cloud IDE. It's free to get started.
                    </p>
                    <div className="mt-6">
                        <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "group shadow-lg shadow-primary/20 hover:shadow-primary/30")}>
                            Sign Up Now
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-card/50">
        <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="CodeVerse logo">
                    <path d="M21.232,13.247,13.247,21.232a2.46,2.46,0,0,1-3.486,0L2.768,14.238a2.46,2.46,0,0,1,0-3.486L9.762,3.758a2.46,2.46,0,0,1,3.486,0l6.993,6.993A2.46,2.46,0,0,1,21.232,13.247Z" className='fill-primary'/>
                </svg>
                <span className="font-bold">CodeVerse</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              &copy; {year} CodeVerse. All rights reserved.
            </p>
            <nav className="flex gap-4 sm:gap-6">
              <Link href="#" className="text-sm hover:underline underline-offset-4 text-muted-foreground">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm hover:underline underline-offset-4 text-muted-foreground">
                Privacy Policy
              </Link>
            </nav>
        </div>
      </footer>
    </div>
  );
}
