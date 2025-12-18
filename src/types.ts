/**
 * 认证配置接口
 */
export interface AuthConfig {
  container: string;  // 二维码容器 ID
  headers?: { // 切换请求头
    datasource: string
  };  
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
export type AuthType = 'wx';

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
