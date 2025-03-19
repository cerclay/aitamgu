export interface BlogPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  thumbnailUrl?: string;
  published: boolean;
}

export interface BlogPostList {
  posts: BlogPost[];
  total: number;
} 