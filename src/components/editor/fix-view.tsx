'use client';

import { PencilRuler } from "lucide-react";

export function FixView() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <PencilRuler className="h-10 w-10 text-muted-foreground mb-4" />
            <h4 className="font-medium">Fix & Refactor</h4>
            <p className="text-sm text-muted-foreground">
                Select code in your editor and use AI to fix bugs or refactor it.
            </p>
        </div>
    )
}
