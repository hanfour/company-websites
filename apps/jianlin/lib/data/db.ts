import fs from 'fs/promises';
import path from 'path';
import type { Company, CaseItem, RentalItem, User, CarouselItem, HomeContentItem, AboutItem } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');

// 讀取 JSON 文件
async function readJSON<T>(filename: string): Promise<T | null> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

// 寫入 JSON 文件
async function writeJSON<T>(filename: string, data: T): Promise<boolean> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// Company 操作
export async function getCompany(): Promise<Company | null> {
  return readJSON<Company>('company.json');
}

export async function updateCompany(data: Partial<Company>): Promise<boolean> {
  const current = await getCompany() || {};
  const updated = { ...current, ...data };
  return writeJSON('company.json', updated);
}

// Cases 操作
export async function getCases(): Promise<CaseItem[]> {
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
