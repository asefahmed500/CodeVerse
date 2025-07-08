import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold">
          Welcome to <span className="text-primary">CodeVerse</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Your personal, cloud-native IDE.
        </p>
        <Link href="/signup">
          <Button size="lg" className="mt-4">
            Go to IDE
          </Button>
        </Link>
      </div>
    </div>
  );
}
