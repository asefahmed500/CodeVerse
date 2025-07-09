
import { notFound, redirect } from "next/navigation";
import { getFileById } from "@/lib/file-actions";
import { Editor } from "@/components/editor/editor";
import type { FileType } from "@/types";

export default async function EditorFilePage({
  params,
}: {
  params: { fileId: string };
}) {
  const file = await getFileById(params.fileId);

  if (!file) {
    notFound();
  }

  // If the ID somehow points to a folder, redirect to the base editor.
  if (file.isFolder) {
    redirect("/editor");
  }

  return <Editor initialFile={file as FileType} />;
}
