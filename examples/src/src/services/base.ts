import { AuthConfig, AuthType } from "../types/auth";

export abstract class BaseAuthService {
  protected config: AuthConfig;
  protected qrcode_expired: string;
  protected fetchBase: string;
  private traceId: string | null = null;

  // API 路由映射提升为类属性，避免重复创建
  private static readonly API_ROUTES: Record<AuthType, { config: string; code2info: string }> = {
    wx: { config: '/auth/wx/config', code2info: '/auth/wx/code2info' },
    qq: { config: '/auth/qq/config', code2info: '/auth/qq/code2info' }
  };

  constructor(config: AuthConfig) {
    this.config = config;
    this.fetchBase = 'https://auth.mocknet.cn';
    this.qrcode_expired = 'https://static.mocknet.cn/static/qrcode_expired.jpg';
  }

  getTraceId(): string | null {
    return this.traceId;
  }

  // 提取通用 fetch 方法，减少重复代码
  private async fetchAPI(url: string): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: { datasource: 'authmate' }
      });

      // 统一处理 traceId（只在 getConfig 时更新）
      const traceId = response.headers.get('X-Trace-Id');
      if (traceId) {
        this.traceId = traceId;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getConfig(type: AuthType) {
    const url = `${this.fetchBase}${BaseAuthService.API_ROUTES[type].config}`;
    return this.fetchAPI(url);
  }

  async fetchUserInfo(code: string, type: AuthType) {
    const url = `${this.fetchBase}${BaseAuthService.API_ROUTES[type].code2info}?code=${code}`;
    return this.fetchAPI(url);
  }

  // 优化 WebSocket 连接
  async createConnet(state: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('wss://auth.mocknet.cn/ws');
      
      // 使用箭头函数，避免 this 绑定问题
      ws.onopen = () => {
        ws.send(JSON.stringify({ state, status: 'init' }));
      };

      ws.onmessage = (event) => {
        try {
          const { code } = JSON.parse(event.data);
          if (code) {
            ws.send(JSON.stringify({ state, status: 'close' }));
            ws.close(); // 主动关闭连接
            resolve(code);
          }
        } catch (error) {
          reject(error);
          ws.close();
        }
      };

      ws.onerror = (error) => {
        reject(new Error('WebSocket connection failed'));
        ws.close();
      };
    });
  }
}
