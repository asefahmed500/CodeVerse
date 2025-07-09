import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Cloud, CodeXml, GitFork } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="py-1 px-3">
                    Now in Public Beta
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Your Personal IDE, Reimagined for the Cloud
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    CodeVerse provides a seamless, cloud-native development experience.
                    Write, test, and debug your code from anywhere, on any device.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="w-full min-[400px]:w-auto">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/signin">
                     <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                        Sign In
                     </Button>
                  </Link>
                </div>
              </div>
              <Image
                src="https://placehold.co/700x500.png"
                width="700"
                height="500"
                alt="CodeVerse IDE Screenshot"
                data-ai-hint="code editor screenshot"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-2xl shadow-primary/10"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
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
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <CodeXml className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">Multi-Language Support</h3>
                <p className="text-sm text-muted-foreground">
                  Execute JavaScript, Python, Java, C++, and more, right in the cloud.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                 <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Cloud className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">Persistent Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  Your files are saved to your account, ready for you whenever you log in.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <GitFork className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <h3 className="text-lg font-bold">GitHub Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Clone public repositories to start coding instantly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
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