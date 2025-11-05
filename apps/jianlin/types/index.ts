// 公司資料
export interface HomeContentItem {
  id: string;  // 唯一識別碼
  blockType: 'content' | 'title';  // 區塊類型：內容區塊或標題區塊
  order: number;  // 排序順序
  show: boolean;  // 是否顯示

  // 內容區塊欄位
  name: string;  // 標題
  caption?: string;  // 富文本內容
  src?: string;  // 圖片路徑
  location?: string;  // 圖片完整 URL
  link?: string;  // 連結
  imagePosition?: 'left' | 'right';  // 圖片位置

  // 標題區塊欄位
  titleText?: string;  // 標題文字（用於 title 類型）
  titleStyle?: string;  // 標題樣式類別

  // 向後兼容的舊欄位
  type?: 'item_1' | 'item_2' | 'item_3';
}

export type AboutLayoutTemplate =
  | 'text-only'              // 純文字
  | 'text-with-top-image'    // 上圖下文
  | 'text-with-left-image'   // 左圖右文
  | 'text-with-right-image'  // 右圖左文
  | 'image-only';            // 純圖片

export interface AboutItem {
  id: string;                       // 唯一識別碼
  order: number;                    // 排序順序
  show: boolean;                    // 是否顯示

  // 基本內容
  title: string;                    // 標題
  caption?: string;                 // 富文本內容

  // 圖片
  src?: string;                     // 圖片路徑
  location?: string;                // 圖片完整 URL

  // 佈局模板
  layoutTemplate: AboutLayoutTemplate;

  // 向後兼容的舊欄位
  type?: 'item_1' | 'item_2' | 'item_3' | 'item_4';
}

export interface Company {
  home?: HomeContentItem[];
  carousel?: {
    home?: CarouselItem[];
    hot?: CarouselItem[];
    history?: CarouselItem[];
  };
  about?: AboutItem[];
}

export interface CarouselItem {
  name: string;
  src: string;
  location?: string;  // 可選：優先使用完整 S3 URL
  link?: string;
  altText?: string;
  caption?: string;
}

// 图片对象
export interface ImageItem {
  name: string;
  src: string;
  location?: string;  // 可選：優先使用完整 S3 URL
}

// 轮播图对象
export interface SliderItem {
  name: string;
  src: string;
  location?: string;  // 可選：優先使用完整 S3 URL
  altText?: string;
}

// 個案 (熱銷/歷年) - 完整保留原始 API 字段
export interface CaseItem {
  // 系统字段
  numberID: string;
  type: 'hot' | 'history';
  createdAt?: string;
  updatedAt?: string;

  // 原始 API 字段
  id: number;
  name: string;
  sub: string;           // 副标题 HTML
  caption: string;       // 页面底部说明 HTML
  outline: string;       // 详细描述 HTML
  address?: string;      // 地址/坐标

  // 图片数组
  slider: SliderItem[];  // 顶部轮播图
  src: ImageItem[];      // 内容区图片

  // 外部链接
  broking?: string;      // 海悦案场链接
  facebook?: string;     // Facebook 链接
  detailed?: string;     // 详细页面链接

  // 状态和时间
  status: number;        // 0=热销, 1=历年
  data_uploader: string; // 上传日期
  data_editor: string;   // 编辑日期
}

// 自訂欄位類型定義
export interface CustomField {
  id: string;                              // 唯一識別碼
  label: string;                           // 欄位標題
  fieldType: 'input' | 'textarea' | 'richtext';  // 欄位類型
  value: string;                           // 欄位內容
  order: number;                           // 排序順序
}

// 不動產租售 - 完整保留原始 API 字段
export interface RentalItem {
  // 系統字段
  numberID: string;
  createdAt?: string;
  updatedAt?: string;

  // 原始 API 字段
  id: number;
  name: string;           // 物件標題
  sub: string;            // 副標 (可能是 HTML)
  caption: string;        // 內文介紹
  address?: string;       // 地址

  // 租售特有欄位
  price?: string;         // 價格
  unit?: number;          // 單位
  floor?: string;         // 坪數
  application?: string;   // 用途
  property?: string;      // 產權登記資料

  // 圖片數組
  slider: ImageItem[];    // 頂部轮播图
  src: ImageItem[];       // 內容區圖片

  // 自訂欄位
  customFields?: CustomField[];  // 動態自訂欄位

  // 狀態和時間
  status: number;         // 0=出租, 1=出售
  show?: boolean;         // 是否顯示
  data_uploader: string;  // 上傳日期
  data_editor: string;    // 編輯日期
}

// 使用者
export interface User {
  account: string;
  password: string; // bcrypt hashed
}

// 聯絡表單
export interface ContactMessage {
  id: string;                  // 唯一識別碼 (UUID)
  createdAt: string;           // 提交時間 (ISO 8601)
  status: 'pending' | 'replied' | 'archived';  // 狀態
  name: string;                // 姓名
  email: string;               // Email
  phone?: string;              // 電話
  category?: string;           // 分類
  subject?: string;            // 主旨
  message: string;             // 訊息內容
  adminReply?: string;         // 管理員回覆
  repliedAt?: string;          // 回覆時間
  repliedBy?: string;          // 回覆人員
}

// API Response
export interface ApiResponse<T = any> {
  message: 'SUCCESS' | 'ERROR';
  data?: T;
  error?: {
    code: string;
    message?: string;
  };
}

// JWT Payload
export interface JWTPayload {
  account: string;
  type: number; // 1: admin, 4: public
  iat?: number;
  exp?: number;
  [key: string]: any; // 添加索引簽名以兼容 jose
}
