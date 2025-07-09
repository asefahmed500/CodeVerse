import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Cloud, CodeXml, GitFork } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full pt-20 pb-24 md:pt-28 md:pb-32 lg:pt-32 lg:pb-40 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-background via-background/80 to-secondary/20 -z-10" />

          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-500">
                  <Badge variant="outline" className="py-1 px-3 bg-card/50 backdrop-blur-sm">
                    Now in Public Beta
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none">
                    Your Personal IDE,
                    <br />
                    <span className="text-primary">Reimagined for the Cloud</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    CodeVerse provides a seamless, cloud-native development experience.
                    Write, test, and debug your code from anywhere, on any device.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row animate-in fade-in slide-in-from-bottom-12 duration-500 delay-200">
                  <Link href="/signup">
                    <Button size="lg" className="w-full min-[400px]:w-auto group">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/signin">
                     <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                        Sign In
                     </Button>
                  </Link>
                </div>
              </div>
              <div className="relative group animate-in fade-in zoom-in-90 duration-500 delay-300">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-cyan-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <Image
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"
                  data-ai-hint="code editor"
                  width="600"
                  height="400"
                  alt="Screenshot of the CodeVerse editor interface"
                  className="relative mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need. Nothing You Don't.
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  A powerful, lightweight editor that's ready for any project, big or small.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-12 lg:gap-16 mt-12">
              
              <div className="grid gap-2 text-center p-6 rounded-lg bg-card/50 transition-all duration-300 hover:bg-card hover:shadow-lg hover:scale-105 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-200">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <CodeXml className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-xl font-bold">Multi-Language Support</h3>
                <p className="text-muted-foreground">
                  Execute JavaScript, Python, Java, C++, and more, right in the cloud.
                </p>
              </div>

              <div className="grid gap-2 text-center p-6 rounded-lg bg-card/50 transition-all duration-300 hover:bg-card hover:shadow-lg hover:scale-105 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-300">
                 <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Cloud className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-xl font-bold">Persistent Workspace</h3>
                <p className="text-muted-foreground">
                  Your files are saved to your account, ready for you whenever you log in.
                </p>
              </div>

              <div className="grid gap-2 text-center p-6 rounded-lg bg-card/50 transition-all duration-300 hover:bg-card hover:shadow-lg hover:scale-105 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-400">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <GitFork className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-xl font-bold">GitHub Integration</h3>
                <p className="text-muted-foreground">
                  Clone public repositories to start coding instantly.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CodeVerse. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
