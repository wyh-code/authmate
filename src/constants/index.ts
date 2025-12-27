import { ApiRoutes } from '../types';

// ==================== API 路由配置 ====================
export const API_ROUTES: ApiRoutes = {
  wx: {
    config: '/auth/wx/config',
    code2info: '/auth/wx/code2info',
    status: '/auth/wx/status'
  }
};

// ==================== 时间配置（毫秒） ====================
/** 二维码过期时间：4分50秒（微信官方5分钟，提前10秒刷新） */
export const QR_EXPIRED_TIME = 4 * 60 * 1000 + 50 * 1000;

/** 服务端状态查询等待时长 */
export const MAX_WAIT_TIME = 25 * 1000;

/** traceId 等待超时时间 */
export const TRACE_ID_TIMEOUT = 60 * 1000;

/** 错误重试间隔 */
export const ERROR_RETRY_INTERVAL = 2000;

// ==================== 轮询配置 ====================
/** 
 * 最大轮询次数：300次
 * 注：接口采用长轮询机制（最多挂起25秒），实际最大总时长约 143 分钟
 */
// export const MAX_POLL_RETRIES = 300;
export const MAX_POLL_RETRIES = 13;

/** 轮询间隔阈值 */
export const POLL_INTERVAL_THRESHOLD = {
  FAST: 20,    // 前 20 次：1秒
  MEDIUM: 40,  // 20-40 次：2秒
  SLOW: 60     // 40-60 次：3秒，之后 4秒
};

// ==================== 第三方服务 ====================
export const FETCH_BASE = 'https://auth.mocknet.cn';
export const WX_LOGIN_SCRIPT = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
