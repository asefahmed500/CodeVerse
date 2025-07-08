'use client';
import { File, Folder, Image, FileJson, FileCode, FileText } from 'lucide-react';
import { getLanguageConfigFromFilename } from '@/config/languages';

export const FileIcon = ({ filename, isFolder, isExpanded, className }: { filename: string, isFolder?: boolean, isExpanded?: boolean, className?: string }) => {
  if (isFolder) {
    return <Folder size={16} className={className} />;
  }

  const lang = getLanguageConfigFromFilename(filename);

  switch (lang.monacoLanguage) {
    case 'javascript':
    case 'typescript':
      return <FileCode size={16} className={className || "text-yellow-400"} />;
    case 'python':
      return <FileCode size={16} className={className || "text-green-400"} />;
    case 'java':
        return <FileCode size={16} className={className || "text-red-500"} />;
    case 'c':
    case 'cpp':
        return <FileCode size={16} className={className || "text-blue-500"} />;
    case 'json':
      return <FileJson size={16} className={className || "text-yellow-400"} />;
    case 'html':
      return <FileCode size={16} className={className || "text-orange-500"} />;
    case 'css':
      return <FileCode size={16} className={className || "text-blue-500"} />;
    case 'markdown':
        return <FileText size={16} className={className || "text-blue-300"} />;
    default:
        if (/\.(jpe?g|png|gif|svg|webp)$/i.test(filename)) {
            return <Image size={16} className={className} />;
        }
      return <File size={16} className={className} />;
  }
};
