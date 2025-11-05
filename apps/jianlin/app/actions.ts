'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getUser,
  getUserByAccount,
  updateUserPassword,
  getCompany,
  updateCompany,
  getCases,
  getCaseById,
  createCase as dbCreateCase,
  updateCase as dbUpdateCase,
  deleteCase as dbDeleteCase,
  getRentals,
  getRentalById,
  createRental as dbCreateRental,
  updateRental as dbUpdateRental,
  deleteRental as dbDeleteRental,
} from '@/lib/data/db';
import {
  verifyPassword,
  hashPassword,
  createToken,
  getCurrentUser,
  isAdmin,
  setAuthCookie,
  clearAuthCookie,
} from '@/lib/auth/auth';
import type { CaseItem, RentalItem } from '@/types';

// ========== 認證相關 ==========

export async function login(formData: FormData) {
  const account = formData.get('account') as string;
  const password = formData.get('password') as string;

  if (!account || !password) {
    return { error: 'MISSING_FIELDS' };
  }

  const user = await getUserByAccount(account);
  if (!user) {
    return { error: 'USER_NOT_FOUND' };
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return { error: 'INVALID_PASSWORD' };
  }

  const token = await createToken({ account, type: 1 });
  await setAuthCookie(token);

  redirect('/admin/home');
}

export async function logout() {
  await clearAuthCookie();
  redirect('/login');
}

export async function updatePassword(formData: FormData) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return { error: 'UNAUTHORIZED' };
  }

  const newPassword = formData.get('newPassword') as string;
  if (!newPassword || newPassword.length < 6) {
    return { error: 'INVALID_PASSWORD' };
  }

  // 获取当前用户账号
  const currentUser = await getCurrentUser();
  if (!currentUser?.account) {
    return { error: 'USER_NOT_FOUND' };
  }

  const hashedPassword = await hashPassword(newPassword);
  const success = await updateUserPassword(currentUser.account, hashedPassword);

  if (!success) {
    return { error: 'UPDATE_FAILED' };
  }

  return { success: true };
}

// ========== Company 資料 ==========

export async function getCompanyData() {
  return await getCompany();
}

export async function updateCompanyData(data: any) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return { error: 'UNAUTHORIZED' };
  }

  const success = await updateCompany(data);
  if (!success) {
    return { error: 'UPDATE_FAILED' };
  }

  revalidatePath('/');
  revalidatePath('/about_us');
  return { success: true };
}

// ========== Cases 資料 ==========

export async function getCasesData(type?: 'hot' | 'history') {
  const cases = await getCases();
  if (type) {
    return cases.filter(c => c.type === type);
  }
  return cases;
}

export async function getCaseData(numberID: string) {
  return await getCaseById(numberID);
}

export async function createCaseData(formData: FormData) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return { error: 'UNAUTHORIZED' };
  }

  const type = formData.get('type') as 'hot' | 'history';
  const title = formData.get('title') as string;
  const subtitle = formData.get('subtitle') as string;
  const content = formData.get('content') as string;
  const images = JSON.parse(formData.get('images') as string || '[]');

  // 生成 numberID
  const allCases = await getCases();
  const maxId = allCases
    .filter(c => c.type === type)
    .reduce((max, c) => Math.max(max, c.id || 0), 0);
  const newId = maxId + 1;
  const numberID = type === 'hot' ? `hot${String(newId).padStart(3, '0')}` : `history${String(newId).padStart(3, '0')}`;

  // 转换简化字段到完整结构
  const caseData: CaseItem = {
    // 系统字段
    numberID,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // 原始 API 字段
    id: newId,
    name: title,
    sub: `<p>${subtitle}</p>`,
    caption: content,
    outline: content,
    address: '',

    // 图片数组 - 将简单路径转换为完整对象
    slider: images.map((img: string) => ({
      name: title,
      src: img,
      location: img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_CDN_LINK}/${img}`,
      altText: title
    })),
    src: images.map((img: string) => ({
      name: title,
      src: img,
      location: img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_CDN_LINK}/${img}`
    })),

    // 外部链接
    broking: '',
    facebook: '',
    detailed: '',

    // 状态和时间
    status: type === 'hot' ? 0 : 1,
    data_uploader: new Date().toISOString().split('T')[0],
    data_editor: new Date().toISOString().split('T')[0]
  };

  const success = await dbCreateCase(caseData);
  if (!success) {
    return { error: 'CREATE_FAILED' };
  }

  revalidatePath('/hot_list');
  revalidatePath('/history_list');
  return { success: true, numberID };
}

export async function updateCaseData(numberID: string, formData: FormData) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return { error: 'UNAUTHORIZED' };
  }

  const title = formData.get('title') as string;
  const subtitle = formData.get('subtitle') as string;
  const content = formData.get('content') as string;
  const images = JSON.parse(formData.get('images') as string || '[]');

  // 获取现有数据以保留其他字段
  const existingCase = await getCaseById(numberID);
  if (!existingCase) {
    return { error: 'CASE_NOT_FOUND' };
  }

  // 只更新表单提交的字段，保留其他字段
  const caseData: Partial<CaseItem> = {
    name: title,
    sub: `<p>${subtitle}</p>`,
    caption: content,
    outline: content,

    // 图片数组 - 将简单路径转换为完整对象
    slider: images.map((img: string) => ({
      name: title,
      src: img,
      location: img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_CDN_LINK}/${img}`,
      altText: title
    })),
    src: images.map((img: string) => ({
      name: title,
      src: img,
      location: img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_CDN_LINK}/${img}`
    })),

    data_editor: new Date().toISOString().split('T')[0]
  };

  const success = await dbUpdateCase(numberID, caseData);
  if (!success) {
    return { error: 'UPDATE_FAILED' };
  }

  revalidatePath('/hot_list');
  revalidatePath('/history_list');
  revalidatePath(`/hot/${numberID}`);
  revalidatePath(`/history/${numberID}`);
  return { success: true };
}

export async function deleteCaseData(numberID: string) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return { error: 'UNAUTHORIZED' };
  }

  const success = await dbDeleteCase(numberID);
  if (!success) {
    return { error: 'DELETE_FAILED' };
  }

  revalidatePath('/hot_list');
  revalidatePath('/history_list');
  return { success: true };
}

// ========== Rentals 資料 ==========

export async function getRentalsData() {
  return await getRentals();
}

export async function getRentalData(numberID: string) {
  return await getRentalById(numberID);
}

export async function createRentalData(formData: FormData) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return { error: 'UNAUTHORIZED' };
  }

  const numberID = Date.now().toString();

  const name = formData.get('name') as string;
  const sub = formData.get('sub') as string;
  const caption = formData.get('caption') as string;
  const slider = JSON.parse(formData.get('slider') as string || '[]');
  const src = JSON.parse(formData.get('src') as string || '[]');
  const status = parseInt(formData.get('status') as string || '0');

  const now = new Date().toISOString();
  const rentalData: RentalItem = {
    numberID,
    id: parseInt(numberID),
    name,
    sub,
    caption,
    slider,
    src,
    status,
    show: true,
    data_uploader: now,
    data_editor: now,
    createdAt: now,
  };

  const success = await dbCreateRental(rentalData);
  if (!success) {
    return { error: 'CREATE_FAILED' };
  }

  revalidatePath('/real_estate_list');
  return { success: true, numberID };
}

export async function updateRentalData(numberID: string, formData: FormData) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return { error: 'UNAUTHORIZED' };
  }

  const now = new Date().toISOString();
  const rentalData: Partial<RentalItem> = {
    name: formData.get('name') as string,
    sub: formData.get('sub') as string,
    caption: formData.get('caption') as string,
    slider: JSON.parse(formData.get('slider') as string || '[]'),
    src: JSON.parse(formData.get('src') as string || '[]'),
    status: parseInt(formData.get('status') as string || '0'),
    address: formData.get('address') as string,
    price: formData.get('price') as string,
    floor: formData.get('floor') as string,
    application: formData.get('application') as string,
    property: formData.get('property') as string,
    data_editor: now,
    updatedAt: now,
  };

  const success = await dbUpdateRental(numberID, rentalData);
  if (!success) {
    return { error: 'UPDATE_FAILED' };
  }

  revalidatePath('/real_estate_list');
  revalidatePath(`/real_estate/${numberID}`);
  return { success: true };
}

export async function deleteRentalData(numberID: string) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return { error: 'UNAUTHORIZED' };
  }

  const success = await dbDeleteRental(numberID);
  if (!success) {
    return { error: 'DELETE_FAILED' };
  }

  revalidatePath('/real_estate_list');
  return { success: true };
}
