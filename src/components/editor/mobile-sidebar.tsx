"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { SidebarView } from "./sidebar-view";

export function MobileSidebar() {
  const { isOpen, setOpen } = useMobileSidebar();
  
  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-80 bg-card border-r-0">
          <SidebarView />
        </SheetContent>
      </Sheet>
    </div>
  );
}
