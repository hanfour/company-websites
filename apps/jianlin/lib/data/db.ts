import fs from 'fs/promises';
import path from 'path';
import { unstable_noStore as noStore } from 'next/cache';
import type { Company, CaseItem, RentalItem, User, CarouselItem, HomeContentItem, AboutItem, ContactMessage } from '@/types';
import { readJSON as readS3JSON, writeJSON as writeS3JSON, listJSON, deleteJSON } from './s3-storage';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');

// 是否使用 S3 存储（生产环境使用 S3，开发环境使用本地文件）
const USE_S3 = process.env.NODE_ENV === 'production' || process.env.FORCE_S3 === 'true';

// 讀取 JSON 文件（支持本地文件系统和 S3）
async function readJSON<T>(filename: string): Promise<T | null> {
  if (USE_S3) {
    // 生产环境：从 S3 读取
    return readS3JSON<T>(filename);
  } else {
    // 开发环境：从本地文件读取
    try {
      const filePath = path.join(DATA_DIR, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return null;
    }
  }
}

// 寫入 JSON 文件（支持本地文件系统和 S3）
async function writeJSON<T>(filename: string, data: T): Promise<boolean> {
  if (USE_S3) {
    // 生产环境：写入 S3
    return writeS3JSON(filename, data);
  } else {
    // 开发环境：写入本地文件
    try {
      const filePath = path.join(DATA_DIR, filename);
      // 確保目錄存在
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      return false;
    }
  }
}

// Company 操作
export async function getCompany(): Promise<Company | null> {
  noStore(); // 禁用快取，確保每次都從 S3 讀取最新資料
  return readJSON<Company>('company.json');
}

export async function updateCompany(data: Partial<Company>): Promise<boolean> {
  const current = await getCompany() || {};
  const updated = { ...current, ...data };
  return writeJSON('company.json', updated);
}

// Cases 操作
export async function getCases(): Promise<CaseItem[]> {
  noStore(); // 禁用快取，確保每次都從 S3 讀取最新資料
  const data = await readJSON<CaseItem[]>('case.json');
  return data || [];
}

export async function getCaseById(numberID: string): Promise<CaseItem | null> {
  const cases = await getCases();
  return cases.find(c => c.numberID === numberID) || null;
}

export async function createCase(caseData: CaseItem): Promise<boolean> {
  const cases = await getCases();
  cases.push(caseData);
  return writeJSON('case.json', cases);
}

export async function updateCase(numberID: string, caseData: Partial<CaseItem>): Promise<boolean> {
  const cases = await getCases();
  const index = cases.findIndex(c => c.numberID === numberID);
  if (index === -1) return false;

  cases[index] = { ...cases[index], ...caseData, updatedAt: new Date().toISOString() };
  return writeJSON('case.json', cases);
}

export async function deleteCase(numberID: string): Promise<boolean> {
  const cases = await getCases();
  const filtered = cases.filter(c => c.numberID !== numberID);
  return writeJSON('case.json', filtered);
}

// Rentals 操作
export async function getRentals(): Promise<RentalItem[]> {
  noStore(); // 禁用快取，確保每次都從 S3 讀取最新資料
  const data = await readJSON<RentalItem[]>('rental.json');
  return data || [];
}

export async function getRentalById(numberID: string): Promise<RentalItem | null> {
  const rentals = await getRentals();
  return rentals.find(r => r.numberID === numberID) || null;
}

export async function createRental(rentalData: RentalItem): Promise<boolean> {
  const rentals = await getRentals();
  rentals.push(rentalData);
  return writeJSON('rental.json', rentals);
}

export async function updateRental(numberID: string, rentalData: Partial<RentalItem>): Promise<boolean> {
  const rentals = await getRentals();
  const index = rentals.findIndex(r => r.numberID === numberID);
  if (index === -1) return false;

  rentals[index] = { ...rentals[index], ...rentalData, updatedAt: new Date().toISOString() };
  return writeJSON('rental.json', rentals);
}

export async function deleteRental(numberID: string): Promise<boolean> {
  const rentals = await getRentals();
  const filtered = rentals.filter(r => r.numberID !== numberID);
  return writeJSON('rental.json', filtered);
}

// Carousel 操作
export async function getCarouselItems(): Promise<CarouselItem[]> {
  const company = await getCompany();
  return company?.carousel?.home || [];
}

export async function addCarouselItem(item: CarouselItem): Promise<boolean> {
  const company = await getCompany();
  if (!company) return false;

  if (!company.carousel) {
    company.carousel = {};
  }
  if (!company.carousel.home) {
    company.carousel.home = [];
  }

  company.carousel.home.push(item);
  return writeJSON('company.json', company);
}

export async function updateCarouselItem(index: number, item: CarouselItem): Promise<boolean> {
  const company = await getCompany();
  if (!company?.carousel?.home || index < 0 || index >= company.carousel.home.length) {
    return false;
  }

  company.carousel.home[index] = item;
  return writeJSON('company.json', company);
}

export async function deleteCarouselItem(index: number): Promise<boolean> {
  const company = await getCompany();
  if (!company?.carousel?.home || index < 0 || index >= company.carousel.home.length) {
    return false;
  }

  company.carousel.home.splice(index, 1);
  return writeJSON('company.json', company);
}

export async function reorderCarouselItems(items: CarouselItem[]): Promise<boolean> {
  const company = await getCompany();
  if (!company) return false;

  if (!company.carousel) {
    company.carousel = {};
  }

  company.carousel.home = items;
  return writeJSON('company.json', company);
}

// Home Content 操作
export async function getHomeContent(): Promise<HomeContentItem[]> {
  const company = await getCompany();
  return company?.home || [];
}

export async function updateHomeContent(items: HomeContentItem[]): Promise<boolean> {
  const company = await getCompany();
  if (!company) return false;

  company.home = items;
  return writeJSON('company.json', company);
}

export async function updateHomeContentItem(type: 'item_1' | 'item_2' | 'item_3', item: HomeContentItem): Promise<boolean> {
  const company = await getCompany();
  if (!company) return false;

  if (!company.home) {
    company.home = [];
  }

  const index = company.home.findIndex(h => h.type === type);
  if (index >= 0) {
    company.home[index] = { ...item, type };
  } else {
    company.home.push({ ...item, type });
  }

  return writeJSON('company.json', company);
}

// About 操作
export async function getAboutItems(): Promise<AboutItem[]> {
  const company = await getCompany();
  return company?.about || [];
}

export async function updateAboutItem(type: 'item_1' | 'item_2' | 'item_3' | 'item_4', item: AboutItem): Promise<boolean> {
  const company = await getCompany();
  if (!company) return false;

  if (!company.about) {
    company.about = [];
  }

  const index = company.about.findIndex(a => a.type === type);
  if (index >= 0) {
    company.about[index] = { ...item, type };
  } else {
    company.about.push({ ...item, type });
  }

  return writeJSON('company.json', company);
}

// User 操作
export async function getUsers(): Promise<User[]> {
  const data = await readJSON<User[]>('user.json');
  return data || [];
}

export async function getUserByAccount(account: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.account === account) || null;
}

// 保持向后兼容 - 返回第一个用户
export async function getUser(): Promise<User | null> {
  const users = await getUsers();
  return users[0] || null;
}

export async function updateUserPassword(account: string, hashedPassword: string): Promise<boolean> {
  const users = await getUsers();
  const userIndex = users.findIndex(u => u.account === account);
  if (userIndex === -1) return false;

  users[userIndex].password = hashedPassword;
  return writeJSON('user.json', users);
}

// Contact Messages 操作
// 每个联系表单存储为独立的 JSON 文件: contacts/YYYY-MM-DD-{uuid}.json
export async function createContactMessage(data: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): Promise<ContactMessage> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const contact: ContactMessage = {
    id,
    createdAt,
    status: 'pending',
    ...data,
  };

  // 文件名: contacts/2025-01-15-abc123.json
  const date = createdAt.split('T')[0]; // YYYY-MM-DD
  const filename = `contacts/${date}-${id}.json`;

  await writeJSON(filename, contact);
  return contact;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    // 列出所有联系表单文件
    const files = await listJSON('contacts/');

    // 读取所有文件
    const messages = await Promise.all(
      files.map(async (file) => {
        const data = await readJSON<ContactMessage>(file);
        return data;
      })
    );

    // 过滤 null 值并按时间倒序排序
    return messages
      .filter((m): m is ContactMessage => m !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting contact messages:', error);
    return [];
  }
}

export async function getContactMessageById(id: string): Promise<ContactMessage | null> {
  try {
    // 查找包含该 ID 的文件
    const files = await listJSON('contacts/');
    const targetFile = files.find(f => f.includes(id));

    if (!targetFile) {
      return null;
    }

    return readJSON<ContactMessage>(targetFile);
  } catch (error) {
    console.error(`Error getting contact message ${id}:`, error);
    return null;
  }
}

export async function updateContactMessage(id: string, updates: Partial<ContactMessage>): Promise<boolean> {
  try {
    const contact = await getContactMessageById(id);
    if (!contact) return false;

    const updated = { ...contact, ...updates };

    // 保持原文件名
    const date = contact.createdAt.split('T')[0];
    const filename = `contacts/${date}-${id}.json`;

    return writeJSON(filename, updated);
  } catch (error) {
    console.error(`Error updating contact message ${id}:`, error);
    return false;
  }
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  try {
    const files = await listJSON('contacts/');
    const targetFile = files.find(f => f.includes(id));

    if (!targetFile) {
      return false;
    }

    return deleteJSON(targetFile);
  } catch (error) {
    console.error(`Error deleting contact message ${id}:`, error);
    return false;
  }
}
