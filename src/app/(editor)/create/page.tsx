
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFileSystem } from "@/hooks/use-file-system";

export default function CreateItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createFile, createFolder } = useFileSystem();

  useEffect(() => {
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');

    if (!name || !type) {
      router.replace('/editor');
      return;
    }

    const createAndRedirect = async () => {
      if (type === 'file') {
        const newFile = await createFile(name, parentId);
        if (newFile) {
          router.replace(`/editor/${newFile._id}`);
        } else {
          router.replace('/editor');
        }
      } else if (type === 'folder') {
        await createFolder(name, parentId);
        // For folders, we don't navigate to them, just go back to the editor.
        // The explorer will be updated and show the new folder.
        router.replace('/editor');
      }
    };

    createAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const name = searchParams.get('name');
  const type = searchParams.get('type');

  return (
    <div className="flex items-center justify-center flex-1 bg-background h-full">
      <p>Creating {type} "{name}"...</p>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary ml-4"></div>
    </div>
  );
}
