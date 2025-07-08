"use client";

import { User, Settings } from "lucide-react";
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
import { activityItems, settingsItem } from "@/config/views";

export function ActivityBar() {
  const { activeView, setActiveView } = useActiveView();
  const { data: session } = useSession();

  return (
    <TooltipProvider>
      <div className="hidden md:flex flex-col items-center justify-between w-12 h-full bg-card border-r border-border py-2">
        <div className="flex flex-col items-center gap-2">
            {activityItems.map((item) => (
                <Tooltip key={item.view}>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`w-10 h-10 rounded-lg ${activeView === item.view ? "text-foreground bg-secondary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
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
                    <Button onClick={() => signIn('github')} variant="ghost" size="icon" className="w-10 h-10 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
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
                    className={`w-10 h-10 rounded-lg ${activeView === "settings" ? "text-foreground bg-secondary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
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
