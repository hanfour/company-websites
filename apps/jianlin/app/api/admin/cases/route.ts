import { createCasesAPI } from '@repo/api-template/routes/cases';
import { getCases, createCase, updateCase, deleteCase, getCaseById } from '@/lib/data/db';
import { isAdmin } from '@/lib/auth/auth';

// 建林的資料來源
const dataSource = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase
};

// 使用統一 API 模板
const api = createCasesAPI(dataSource, isAdmin);

export const GET = api.GET;
export const POST = api.POST;
