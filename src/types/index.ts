export interface FileType {
  _id: string
  name: string
  content: string
  isFolder: boolean
  parentId: string | null
  userId: string
  language: string
  isOpen: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  children?: FileType[]
}

export interface TerminalSessionType {
  _id: string
  title: string
  commands: string[]
  isActive: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  owner: {
    login: string
    id: number
    avatar_url: string
  }
  html_url: string
  description: string | null
  fork: boolean
  created_at: string
  updated_at: string
  pushed_at: string
}

export interface GitHubContentItem {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string | null
  type: "file" | "dir"
}

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

export interface UserType {
  _id: string
  name: string
  email: string
  image: string
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
}
