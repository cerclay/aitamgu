'use client';

import { v4 as uuidv4 } from 'uuid';
import { BlogPost, BlogPostList } from '../types';
import { BLOG_POSTS_STORAGE_KEY, DEFAULT_THUMBNAIL_URL } from '../constants';

// 블로그 포스트 목록 가져오기
export const getBlogPosts = (): BlogPostList => {
  if (typeof window === 'undefined') {
    return { posts: [], total: 0 };
  }
  
  const postsJSON = localStorage.getItem(BLOG_POSTS_STORAGE_KEY);
  if (!postsJSON) {
    return { posts: [], total: 0 };
  }
  
  try {
    const posts = JSON.parse(postsJSON) as BlogPost[];
    return {
      posts: posts.filter(post => post.published).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: posts.length
    };
  } catch (error) {
    console.error('블로그 포스트 불러오기 오류:', error);
    return { posts: [], total: 0 };
  }
};

// 최신 블로그 포스트 n개 가져오기
export const getLatestBlogPosts = (count: number = 6): BlogPost[] => {
  const { posts } = getBlogPosts();
  return posts.slice(0, count);
};

// 블로그 포스트 저장하기
export const saveBlogPost = (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): BlogPost => {
  const posts = getAllBlogPosts();
  
  const newPost: BlogPost = {
    ...post,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thumbnailUrl: post.thumbnailUrl || DEFAULT_THUMBNAIL_URL
  };
  
  const updatedPosts = [...posts, newPost];
  localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));
  
  return newPost;
};

// 블로그 포스트 수정하기
export const updateBlogPost = (post: BlogPost): BlogPost | null => {
  const posts = getAllBlogPosts();
  const index = posts.findIndex(p => p.id === post.id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedPost = {
    ...post,
    updatedAt: new Date().toISOString()
  };
  
  posts[index] = updatedPost;
  localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(posts));
  
  return updatedPost;
};

// 블로그 포스트 삭제하기
export const deleteBlogPost = (id: string): boolean => {
  const posts = getAllBlogPosts();
  const filteredPosts = posts.filter(post => post.id !== id);
  
  if (filteredPosts.length === posts.length) {
    return false;
  }
  
  localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(filteredPosts));
  return true;
};

// 특정 블로그 포스트 가져오기
export const getBlogPostById = (id: string): BlogPost | null => {
  const posts = getAllBlogPosts();
  return posts.find(post => post.id === id) || null;
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