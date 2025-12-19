import { ApiRoutes } from '../types';

export const API_ROUTES: ApiRoutes = {
  wx: {
    config: '/auth/wx/config',
    code2info: '/auth/wx/code2info',
    status: '/auth/wx/status'
  }
};

export const QR_EXPIRED_TIME = 5 * 58 * 1000;

export const FETCH_BASE = 'https://auth.mocknet.cn';

export const WX_LOGIN_SCRIPT = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
