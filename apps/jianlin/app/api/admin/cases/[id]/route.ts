import { createCaseByIdAPI } from '@repo/api-template/routes/cases';
import { getCaseById, updateCase, deleteCase } from '@/lib/data/db';
import { isAdmin } from '@/lib/auth/auth';

// 建林的資料來源
const dataSource = {
  getCases: async () => [], // 不需要在這個端點使用
  getCaseById,
  createCase: async () => false, // 不需要在這個端點使用
  updateCase,
  deleteCase
};

// 使用統一 API 模板
const api = createCaseByIdAPI(dataSource, isAdmin);

export const GET = api.GET;
export const PUT = api.PUT;
export const DELETE = api.DELETE;
