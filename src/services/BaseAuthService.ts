import { AuthConfig } from "../types";
import { FETCH_BASE } from "../constants";

export abstract class BaseAuthService {
  protected config: AuthConfig;
  protected fetchBase: string;
  private traceId: string | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    this.fetchBase = config.fetchBase || FETCH_BASE;
  }

  getTraceId(): string | null {
    return this.traceId;
  }

  /**
   * 通用 fetch 方法
   */
  private async fetchAPI(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          datasource: 'authmate',
          ...options.headers
        }
      });

      // 获取 traceId
      const traceId = response.headers.get('X-Trace-Id');
      if (traceId) {
        this.traceId = traceId;
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * 获取配置
   */
  async getConfig() {
    const url = `${this.fetchBase}${this.config.apiRouter!.config}`;
    return this.fetchAPI(url, { headers: this.config.headers });
  }

  /**
   * 获取用户信息
   */
  async fetchUserInfo(code: string) {
    const url = `${this.fetchBase}${this.config.apiRouter!.code2info}?code=${code}`;
    return this.fetchAPI(url);
  }

  /**
   * 轮询登录状态（替代 WebSocket）
   */
  async pollLoginStatus(state: string, signal?: AbortSignal): Promise<string> {
    let retries = 0;
    if(!this.config.auto) return '请手动调用轮询【this.pollLoginStatus】，或设置【auto=true】';

    return new Promise((resolve, reject) => {
      // 检查取消信号
      if (signal?.aborted) {
        reject(new Error('请求已取消'));
        return;
      }

      const poll = async () => {
        try {

          // 检查取消信号
          if (signal?.aborted) {
            reject(new Error('请求已取消'));
            return;
          }

          // 请求状态
          const url = `${this.fetchBase}${this.config.apiRouter!.status}/${state}`;
          const result = await this.fetchAPI(url, { signal });

          // 状态判断
          switch (result.status) {
            case 2: // SUCCESS
              console.log('[Auth] 登录成功');
              resolve(result.code);
              break;

            case 3: // EXPIRED
              // QR_EXPIRED_TIME = 5 * 58 * 1000 小于微信5分钟过期时间，case 3 可以忽略
              reject(new Error('二维码已过期，请刷新'));
              break;

            case 4: // FAILED
              reject(new Error('登录失败，请重试'));
              break;

            case 1: // SCANNED
              console.log('[Auth] 已扫码，等待确认...');
              // 继续轮询，可以缩短间隔
              setTimeout(poll, 1000);
              break;

            case 0: // PENDING
            default:
              // 继续轮询，使用动态间隔
              const nextInterval = this.getNextInterval(retries);
              setTimeout(poll, nextInterval);
          }
        } catch (error: any) {
          // 取消请求不重试
          if (error.name === 'AbortError' || signal?.aborted) {
            reject(new Error('请求已取消'));
            return;
          }

          // 网络错误重试
          console.warn(`[Auth] 轮询失败，第 ${retries} 次重试...`);
          const nextInterval = this.getNextInterval(retries);
          setTimeout(poll, nextInterval);
        }
      };

      // 启动轮询
      poll();
    });
  }

  /**
   * 动态计算轮询间隔（智能退避）
   */
  private getNextInterval(retries: number): number {
    if (retries < 10) return 1000;      // 前 10 次：1 秒
    if (retries < 30) return 2000;      // 10-30 次：2 秒
    if (retries < 60) return 3000;      // 30-60 次：3 秒
    return 5000;                        // 60 次后：5 秒
  }

  /**
   * 等待 traceId 可用
   */
  protected async waitForTraceId(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.getTraceId()) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }
}
