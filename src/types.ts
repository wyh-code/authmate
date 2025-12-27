
// ==================== 配置接口 ====================
/**
 * 认证配置
 */
export interface AuthConfig {
  /** 二维码容器 DOM ID */
  container: string;
  /** 是否自动轮询 */
  auto?: boolean;
  /** 服务端请求基础 URL */
  fetchBase?: string;
  /** 自定义请求头 */
  headers?: {
    datasource: string;
  };
  /** API 路由配置 */
  apiRouter?: ApiConfig;
  /** 登录状态变化回调 */
  onStatusChange?: (status: LoginStatus) => void;
  /** 二维码刷新回调 */
  onQrRefresh?: (traceId: string) => void;
  /** 错误回调 */
  onError?: (error: { message: string }) => void;
}

/**
 * API 配置
 */
export interface ApiConfig {
  /** 获取配置接口 */
  config: string;
  /** code 换取用户信息接口 */
  code2info: string;
  /** 查询登录状态接口 */
  status: string;
}

// ==================== 响应接口 ====================
/**
 * 认证结果
 */
export interface AuthResult {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  [key: string]: any;
}

/**
 * 认证状态
 */
export interface AuthStatus {
  /** 当前重试次数 */
  retries: number;
  /** 当前 traceId */
  traceId: string | null;
}

/**
 * API 统一响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

/**
 * 轮询状态响应
 */
export interface PollStatusResponse {
  status: LoginStatus;
  code?: string;
  message?: string;
}

// ==================== 枚举定义 ====================
/**
 * 认证类型
 */
export enum AuthType {
  WX = 'wx'
}

/**
 * 登录状态
 */
export enum LoginStatus {
  /** 等待扫码 */
  PENDING = 0,
  /** 已扫码待确认 */
  SCANNED = 1,
  /** 登录成功 */
  SUCCESS = 2,
  /** 二维码过期 */
  EXPIRED = 3,
  /** 登录失败 */
  FAILED = 4
}

// ==================== 类型别名 ====================
/**
 * API 路由映射
 */
export type ApiRoutes = {
  [K in AuthType]: ApiConfig;
};
