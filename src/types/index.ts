export interface FileType {
  _id: string
  name: string
  content: string
  isFolder: boolean
  parentId: string | null
  language: string
  isOpen: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  children?: (FileType & { children?: FileType[] })[]
}

export interface TerminalSessionType {
  _id: string
  title: string
  commands: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
}

export interface SearchResult {
  file: FileType;
  matches: SearchMatch[];
}

export interface Problem {
  fileId: string;
  message: string;
  lineNumber?: number;
}
