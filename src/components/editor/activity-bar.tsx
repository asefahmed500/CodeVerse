"use client";

import {
  Files,
  Search,
  Github,
  Terminal,
  Settings,
  User,
} from "lucide-react";
import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { useActiveView } from "@/hooks/use-active-view";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const activityItems = [
    { view: "explorer", icon: Files, tooltip: "Explorer (Ctrl+Shift+E)" },
    { view: "search", icon: Search, tooltip: "Search (Ctrl+Shift+F)" },
    { view: "github", icon: Github, tooltip: "Source Control (Ctrl+Shift+G)" },
] as const;


export function ActivityBar() {
  const { activeView, setActiveView } = useActiveView();
  const { data: session } = useSession();

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-between w-12 h-full bg-[#333333] border-r border-[#252526] py-2">
        <div className="flex flex-col items-center gap-2">
            {activityItems.map((item) => (
                <Tooltip key={item.view}>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-10 h-10 rounded-lg ${activeView === item.view ? "text-white bg-[#2a2d2e]" : "text-[#858585] hover:bg-[#2a2d2e] hover:text-white"}`}
                        onClick={() => setActiveView(item.view)}
                    >
                        <item.icon className="h-6 w-6" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.tooltip}</TooltipContent>
                </Tooltip>
            ))}
        </div>

        <div className="flex flex-col items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                {session?.user ? (
                    <Button onClick={() => signOut()} variant="ghost" size="icon" className="w-10 h-10 rounded-lg">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={session.user.image!} alt={session.user.name!} />
                            <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                ) : (
                    <Button onClick={() => signIn('github')} variant="ghost" size="icon" className="w-10 h-10 rounded-lg text-[#858585] hover:bg-[#2a2d2e] hover:text-white">
                        <User className="h-6 w-6" />
                    </Button>
                )}
                </TooltipTrigger>
                <TooltipContent side="right">
                {session?.user ? `Sign out ${session.user.name}` : 'Sign in'}
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`w-10 h-10 rounded-lg ${activeView === "settings" ? "text-white bg-[#2a2d2e]" : "text-[#858585] hover:bg-[#2a2d2e] hover:text-white"}`}
                    onClick={() => setActiveView("settings")}
                >
                    <Settings className="h-6 w-6" />
                </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings (Ctrl+,)</TooltipContent>
            </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
