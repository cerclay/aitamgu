'use client';

import { v4 as uuidv4 } from 'uuid';
import { BlogPost, BlogPostList } from '../types';
import { BLOG_POSTS_STORAGE_KEY, DEFAULT_THUMBNAIL_URL } from '../constants';
import { createClient } from '@/lib/supabase/client';

// Supabase 클라이언트 초기화
export const supabase = createClient();

// 블로그 포스트 목록 가져오기
export const getBlogPosts = async (): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('블로그 포스트 조회 오류:', error);
    return [];
  }
  
  return data as BlogPost[];
};

// 최신 블로그 포스트 n개 가져오기
export const getLatestBlogPosts = async (count: number = 6): Promise<BlogPost[]> => {
  const posts = await getBlogPosts();
  return posts.slice(0, count);
};

// 블로그 포스트 저장하기
export const saveBlogPost = async (post: Omit<BlogPost, 'id' | 'created_at'>): Promise<string | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert([{ ...post, updated_at: new Date().toISOString() }])
    .select('id')
    .single();
  
  if (error) {
    console.error('블로그 포스트 저장 오류:', error);
    return null;
  }
  
  return data.id;
};

// 블로그 포스트 수정하기
export const updateBlogPost = async (id: string, post: Partial<BlogPost>): Promise<boolean> => {
  const { error } = await supabase
    .from('blog_posts')
    .update({ ...post, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) {
    console.error(`ID ${id}의 블로그 포스트 업데이트 오류:`, error);
    return false;
  }
  
  return true;
};

// 블로그 포스트 삭제하기
export const deleteBlogPost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`ID ${id}의 블로그 포스트 삭제 오류:`, error);
    return false;
  }
  
  return true;
};

// 특정 블로그 포스트 가져오기
export const getBlogPostById = async (id: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`ID ${id}의 블로그 포스트 조회 오류:`, error);
    return null;
  }
  
  return data as BlogPost;
};

// 모든 블로그 포스트 가져오기 (비공개 포스트 포함)
const getAllBlogPosts = (): BlogPost[] => {
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