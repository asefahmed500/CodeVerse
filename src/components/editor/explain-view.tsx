'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFileSystem } from "@/hooks/use-file-system";
import { explainCode, type ExplainCodeOutput } from "@/ai/flows/explain-code-flow";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

export function ExplainView() {
  const { activeFile } = useFileSystem();
  const [explanation, setExplanation] = useState<ExplainCodeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExplainCode = async () => {
    if (!activeFile || activeFile.isFolder || !activeFile.content.trim()) {
      toast.info("Please select a file with content to explain.");
      return;
    }
    
    setIsLoading(true);
    setExplanation(null);
    try {
      const result = await explainCode({ code: activeFile.content });
      setExplanation(result);
    } catch (error) {
      console.error("Failed to explain code:", error);
      toast.error("An error occurred while explaining the code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="flex-shrink-0">
        <h3 className="text-sm font-medium">Code Explanation</h3>
        <p className="text-xs text-muted-foreground">
          Let AI provide a detailed explanation of the code in your active file.
        </p>
        <Button onClick={handleExplainCode} disabled={isLoading || !activeFile} className="mt-2">
          {isLoading ? "Thinking..." : "Explain Active File"}
        </Button>
      </div>
      <ScrollArea className="flex-1 bg-muted/50 rounded-md p-2 text-sm">
        {isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Sparkles className="h-5 w-5 mr-2 animate-spin" />
            Generating explanation...
          </div>
        )}
        {!isLoading && !explanation && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Click the button to generate an explanation.
          </div>
        )}
        {explanation && (
          <pre className="font-sans whitespace-pre-wrap">
            {explanation.explanation}
          </pre>
        )}
      </ScrollArea>
    </div>
  );
}
