'use client';

import { v4 as uuidv4 } from 'uuid';
import { BlogPost, BlogPostList } from '../types';
import { BLOG_POSTS_STORAGE_KEY, DEFAULT_THUMBNAIL_URL } from '../constants';
import { createClient } from '@/lib/supabase/client';

// Supabase와 TypeScript 타입간 필드 이름 매핑
type DbBlogPost = Omit<BlogPost, 'createdAt' | 'updatedAt'> & {
  created_at: string;
  updated_at: string;
};

// 데이터베이스 타입을 BlogPost 타입으로 변환
const mapDbPostToBlogPost = (post: DbBlogPost): BlogPost => ({
  id: post.id,
  title: post.title,
  content: post.content,
  createdAt: post.created_at,
  updatedAt: post.updated_at,
  summary: post.summary,
  thumbnailUrl: post.thumbnailUrl,
  published: post.published
});

// BlogPost 타입을 데이터베이스 타입으로 변환
const mapBlogPostToDbPost = (post: Partial<BlogPost>): Partial<DbBlogPost> => {
  const result: any = { ...post };
  
  if ('createdAt' in post) {
    result.created_at = post.createdAt;
    delete result.createdAt;
  }
  
  if ('updatedAt' in post) {
    result.updated_at = post.updatedAt;
    delete result.updatedAt;
  }
  
  return result as Partial<DbBlogPost>;
};

// Supabase 클라이언트는 클라이언트 측에서만 초기화
let supabase: ReturnType<typeof createClient> | null = null;

// 클라이언트 측에서만 Supabase 클라이언트 초기화
const getSupabaseClient = () => {
  if (typeof window !== 'undefined' && !supabase) {
    supabase = createClient();
  }
  return supabase;
};

// 로컬 스토리지에서 블로그 포스트 가져오기
const getPostsFromLocalStorage = (): BlogPost[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const postsJSON = localStorage.getItem(BLOG_POSTS_STORAGE_KEY);
  if (!postsJSON) {
    return [];
  }
  
  try {
    return JSON.parse(postsJSON) as BlogPost[];
  } catch (error) {
    console.error('블로그 포스트 불러오기 오류:', error);
    return [];
  }
};

// 로컬 스토리지에 블로그 포스트 저장
const savePostsToLocalStorage = (posts: BlogPost[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error('블로그 포스트 저장 오류:', error);
  }
};

// 블로그 포스트 목록 가져오기
export const getBlogPosts = async (): Promise<BlogPost[]> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return getPostsFromLocalStorage();
  }
  
  try {
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('블로그 포스트 조회 오류:', error);
      return getPostsFromLocalStorage();
    }
    
    return (data as DbBlogPost[]).map(mapDbPostToBlogPost);
  } catch (e) {
    console.error('Supabase 요청 오류:', e);
    return getPostsFromLocalStorage();
  }
};

// 최신 블로그 포스트 n개 가져오기
export const getLatestBlogPosts = async (count: number = 6): Promise<BlogPost[]> => {
  try {
    const posts = await getBlogPosts();
    // published가 true인 포스트만 필터링
    const publishedPosts = posts.filter(post => post.published);
    return publishedPosts.slice(0, count);
  } catch (error) {
    console.error('최신 블로그 포스트 불러오기 오류:', error);
    return [];
  }
};

// 블로그 포스트 저장하기
export const saveBlogPost = async (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  
  if (!client) {
    // 로컬 스토리지 사용
    const posts = getPostsFromLocalStorage();
    const newPost: BlogPost = {
      id: uuidv4(),
      ...post,
      createdAt: now,
      updatedAt: now,
      thumbnailUrl: post.thumbnailUrl || DEFAULT_THUMBNAIL_URL
    };
    
    savePostsToLocalStorage([newPost, ...posts]);
    return newPost.id;
  }
  
  try {
    const { data, error } = await client
      .from('blog_posts')
      .insert([{ 
        ...post, 
        created_at: now, 
        updated_at: now,
        thumbnailUrl: post.thumbnailUrl || DEFAULT_THUMBNAIL_URL
      }])
      .select('id')
      .single();
    
    if (error) {
      console.error('블로그 포스트 저장 오류:', error);
      return null;
    }
    
    return data.id;
  } catch (e) {
    console.error('Supabase 요청 오류:', e);
    return null;
  }
};

// 블로그 포스트 수정하기
export const updateBlogPost = async (id: string, post: Partial<BlogPost>): Promise<boolean> => {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  
  if (!client) {
    // 로컬 스토리지 사용
    const posts = getPostsFromLocalStorage();
    const postIndex = posts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return false;
    }
    
    posts[postIndex] = {
      ...posts[postIndex],
      ...post,
      updatedAt: now
    };
    
    savePostsToLocalStorage(posts);
    return true;
  }
  
  try {
    const dbPost = mapBlogPostToDbPost(post);
    const { error } = await client
      .from('blog_posts')
      .update({ ...dbPost, updated_at: now })
      .eq('id', id);
    
    if (error) {
      console.error(`ID ${id}의 블로그 포스트 업데이트 오류:`, error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Supabase 요청 오류:', e);
    return false;
  }
};

// 블로그 포스트 삭제하기
export const deleteBlogPost = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  
  if (!client) {
    // 로컬 스토리지 사용
    const posts = getPostsFromLocalStorage();
    const filteredPosts = posts.filter(p => p.id !== id);
    
    if (filteredPosts.length === posts.length) {
      return false;
    }
    
    savePostsToLocalStorage(filteredPosts);
    return true;
  }
  
  try {
    const { error } = await client
      .from('blog_posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`ID ${id}의 블로그 포스트 삭제 오류:`, error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Supabase 요청 오류:', e);
    return false;
  }
};

// 특정 블로그 포스트 가져오기
export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
  const client = getSupabaseClient();
  
  if (!client) {
    // 로컬 스토리지 사용
    const posts = getPostsFromLocalStorage();
    return posts.find(p => p.id === id) || null;
  }
  
  try {
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`ID ${id}의 블로그 포스트 조회 오류:`, error);
      // 로컬 스토리지에서 시도
      const localPosts = getPostsFromLocalStorage();
      return localPosts.find(p => p.id === id) || null;
    }
    
    return mapDbPostToBlogPost(data as DbBlogPost);
  } catch (e) {
    console.error('Supabase 요청 오류:', e);
    const localPosts = getPostsFromLocalStorage();
    return localPosts.find(p => p.id === id) || null;
  }
}; 