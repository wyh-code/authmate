/**
 * 认证配置接口
 */
export interface AuthConfig {
  container: string;  // 二维码容器 ID
  auto?: boolean;  // 是否自动轮询
  fetchBase?: string;  // 平台回调域名
  headers?: { // 切换请求头
    datasource: string
  };
  apiRouter?: ApiConfig; // 服务请求路径 
}

/**
 * 认证结果接口
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
}

/**
 * 认证类型
 */
export enum AuthType {
  WX = 'wx'
}

/**
 * 登录状态枚举
 */
export enum LoginStatus {
  PENDING = 0,   // 等待扫码
  SCANNED = 1,   // 已扫码待确认
  SUCCESS = 2,   // 登录成功
  EXPIRED = 3,   // 二维码过期
  FAILED = 4     // 登录失败
}

export interface ApiConfig {
  config: string;
  code2info: string;
  status: string;
}

export type ApiRoutes = {
  [K in AuthType]: ApiConfig
}