'use client';

import { useProblemsStore } from '@/hooks/use-problems-store';
import { useFileSystem } from '@/hooks/use-file-system';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileIcon } from './file-icon';
import { ScrollArea } from '../ui/scroll-area';

export function ProblemsView() {
  const { problems } = useProblemsStore();
  const { findFile } = useFileSystem();
  const router = useRouter();

  if (problems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No problems have been detected.
      </div>
    );
  }

  const problemsByFile = problems.reduce((acc, problem) => {
    (acc[problem.fileId] = acc[problem.fileId] || []).push(problem);
    return acc;
  }, {} as Record<string, typeof problems>);
  
  const handleProblemClick = (fileId: string) => {
    // For now, just navigate to the file. Line navigation can be added later.
    router.push(`/editor/${fileId}`);
  }

  return (
    <ScrollArea className="h-full">
      <Accordion type="multiple" defaultValue={Object.keys(problemsByFile)} className="p-2">
        {Object.entries(problemsByFile).map(([fileId, fileProblems]) => {
          const file = findFile(fileId);
          if (!file) return null;
          return (
            <AccordionItem value={fileId} key={fileId} className="border-b-0">
              <AccordionTrigger className="p-1 text-left hover:bg-accent rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <FileIcon filename={file.name} className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold h-5 w-5 rounded-full bg-destructive text-destructive-foreground">
                    {fileProblems.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="pl-6 space-y-1">
                  {fileProblems.map((problem, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground p-1 rounded-md hover:bg-accent cursor-pointer flex items-start"
                       onClick={() => handleProblemClick(file._id)}
                    >
                      <span className="text-destructive mr-2">●</span>
                      <span className="flex-1">{problem.message}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </ScrollArea>
  );
}
