// 共用 TypeScript 類型定義

export interface CaseItem {
  numberID: string;
  name: string;
  type: 'hot' | 'history';
  location?: string;
  description?: string;
  images?: string[];
  features?: string[];
  price?: string;
  area?: string;
  rooms?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RentalItem {
  numberID: string;
  title: string;
  type: '租賃' | '出售';
  location?: string;
  price?: string;
  area?: string;
  rooms?: string;
  images?: string[];
  features?: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarouselItem {
  name: string;
  src: string;
  location: string;
  alt?: string;
}

export interface HomeContentItem {
  type: 'item_1' | 'item_2' | 'item_3';
  name: string;
  src: string;
  description?: string;
  link?: string;
}

export interface AboutItem {
  type: 'item_1' | 'item_2' | 'item_3' | 'item_4';
  title: string;
  src: string;
  description?: string;
  link?: string;
}

export interface AboutContent {
  [key: string]: any;
}

export interface HomeContent {
  [key: string]: any;
}

export interface Company {
  name: string;
  description?: string;
  carousel?: {
    home?: CarouselItem[];
  };
  home?: HomeContentItem[];
  about?: AboutItem[];
}

export interface User {
  username: string;
  password: string;
  role: 'admin' | 'user';
}
