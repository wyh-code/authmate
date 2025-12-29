import {
  AuthConfig,
  ApiResponse,
  LoginStatus,
  PollStatusResponse,
  AuthStatus
} from '../types';
import {
  FETCH_BASE,
  MAX_POLL_RETRIES,
  TRACE_ID_TIMEOUT,
  MAX_WAIT_TIME,
  QR_EXPIRED_TIME,
  ERROR_RETRY_INTERVAL,
  POLL_INTERVAL_THRESHOLD
} from '../constants';

/**
 * 认证服务基类
 * 提供通用的轮询、状态管理和 API 调用能力
 */
export abstract class BaseAuthService {
  // ==================== 配置属性 ====================
  protected config: AuthConfig;
  protected fetchBase: string;

  // ==================== 状态属性 ====================
  private traceId: string | null = null;
  private isDestroyed = false;
  private pollingPromise: Promise<any> | null = null;
  private abortController: AbortController | null = null;
  private pollLoopStartTime: number = Date.now();
  private retries: number = 0;

  // ==================== Promise 回调 ====================
  protected promiseResolve: (value: any) => void = () => { };
  protected promiseReject: (reason: any) => void = () => { };

  // ==================== 抽象方法 ====================
  /** 初始化二维码（子类必须实现） */
  protected abstract initQr(): Promise<void>;

  // ==================== 构造函数 ====================
  constructor(config: AuthConfig) {
    this.config = { auto: true, ...config };
    this.fetchBase = config.fetchBase || FETCH_BASE;
  }

  // ==================== 公共方法 - Getter ====================
  /**
   * 获取当前 traceId
   */
  getTraceId(): string | null {
    return this.traceId;
  }

  /**
   * 获取认证状态
   * @returns 当前重试次数和 traceId
   */
  getStatus(): AuthStatus {
    return {
      retries: this.retries,
      traceId: this.traceId
    };
  }

  // ==================== 保护方法 - 生命周期 ====================
  /**
   * 检查实例是否已销毁
   */
  protected checkDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error('实例已销毁');
    }
  }

  /**
   * 标记实例为已销毁
   */
  protected markDestroyed(): void {
    this.isDestroyed = true;
  }

  /**
   * 获取销毁状态
   */
  protected getIsDestroyed(): boolean {
    return this.isDestroyed;
  }

  // ==================== 保护方法 - API 调用 ====================
  /**
   * 通用 API 请求方法
   * @param url 请求地址
   * @param options 请求配置
   */
  protected async fetchAPI<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.checkDestroyed();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          datasource: 'authmate',
          ...this.config.headers
        }
      });

      if (this.isDestroyed) {
        throw new Error('实例已销毁');
      }

      // 提取并保存 traceId
      const traceId = response.headers.get('X-Trace-Id');
      if (traceId && !this.traceId) {
        this.traceId = traceId;
      }

      if(!this.traceId && !traceId) {
        throw new Error(`没有获取到 X-Trace-Id，后端转发请设置 X-Trace-Id`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'API 请求失败');
      }

      return result.data as T;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[Auth] API 请求失败:', error);
        if (!this.isDestroyed) {
          this.config.onError?.(error);
        }
      }
      throw error;
    }
  }

  /**
   * 获取认证配置
   */
  async getConfig(): Promise<any> {
    this.traceId = null;
    const url = `${this.fetchBase}${this.config.apiRouter!.config}`;
    return this.fetchAPI(url);
  }

  /**
   * 获取用户信息
   * @param code 授权码
   */
  async fetchUserInfo(code: string): Promise<any> {
    const url = `${this.fetchBase}${this.config.apiRouter!.code2info}?code=${code}`;
    return this.fetchAPI(url);
  }

  /**
   * 查询登录状态
   * @param state traceId
   * @param signal 取消信号
   */
  protected async queryLoginStatus(
    state: string,
    signal?: AbortSignal
  ): Promise<PollStatusResponse> {
    this.checkDestroyed();

    if (signal?.aborted) {
      throw new Error('请求已取消');
    }

    const url = `${this.fetchBase}${this.config.apiRouter!.status}/${state}`;
    const result = await this.fetchAPI<PollStatusResponse>(url, { signal });

    if (!this.isDestroyed) {
      this.config.onStatusChange?.(result.status);
    }

    return result;
  }

  // ==================== 保护方法 - 轮询控制 ====================
  /**
   * 启动轮询
   */
  protected async startPolling(): Promise<any> {
    this.checkDestroyed();

    // 防止重复启动
    if (this.pollingPromise) {
      console.log('[Auth] 轮询已在进行中');
      return this.pollingPromise;
    }

    this.abortController = new AbortController();
    this.pollingPromise = this.pollLoop();

    try {
      return await this.pollingPromise;
    } finally {
      this.pollingPromise = null;
      this.abortController = null;
    }
  }

  /**
   * 停止轮询
   */
  protected stopPolling(): void {
    console.log('[Auth] 停止轮询');

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 检查是否正在轮询
   */
  protected isPolling(): boolean {
    return this.pollingPromise !== null;
  }

  // ==================== 保护方法 - 工具函数 ====================
  /**
   * 等待 traceId 可用（带超时）
   */
  protected async waitForTraceId(): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const check = (): void => {
        if (Date.now() - startTime > TRACE_ID_TIMEOUT) {
          reject(new Error('获取 traceId 超时'));
          return;
        }

        if (this.isDestroyed) {
          reject(new Error('实例已销毁'));
          return;
        }

        if (this.getTraceId()) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }

  /**
   * 动态计算轮询间隔
   * @param status 登录状态
   */
  protected getPollingInterval(status: LoginStatus): number {
    // 已扫码状态加快轮询
    if (status === LoginStatus.SCANNED) {
      return 1000;
    }

    // 根据重试次数动态调整间隔
    const { FAST, MEDIUM, SLOW } = POLL_INTERVAL_THRESHOLD;
    if (this.retries < FAST) return 1000;
    if (this.retries < MEDIUM) return 2000;
    if (this.retries < SLOW) return 3000;
    return 4000;
  }

  // ==================== 私有方法 - 轮询核心逻辑 ====================
  /**
   * 轮询循环
   */
  private async pollLoop(): Promise<any> {
    this.pollLoopStartTime = Date.now();
    const traceId = this.getTraceId()!;
    console.log('[Auth] 开始轮询, traceId:', traceId, '当前重试次数:', this.retries);

    while (this.abortController && !this.isDestroyed) {
      try {
        // 检查最大重试次数
        if (this.retries >= MAX_POLL_RETRIES) {
          const error = { message: `轮询超时（重试 ${this.retries} 次），请刷新重试`, code: 'ECONNABORTED' };
          this.config.onError?.(error);
          return this.promiseReject(error);
        }

        // 检查二维码是否即将过期
        if (this.shouldRefreshQrCode()) {
          await this.handleQrCodeRefresh();
          return;
        }

        // 查询登录状态
        const result = await this.queryLoginStatus(
          traceId,
          this.abortController?.signal
        );

        // 处理状态响应
        const shouldContinue = await this.handleStatusResponse(result);
        if (!shouldContinue) {
          return;
        }
      } catch (error: any) {
        debugger
        const shouldContinue = this.handlePollError(error);
        if (!shouldContinue) {
          return;
        }
      }
    }
  }

  /**
   * 判断是否需要刷新二维码
   */
  private shouldRefreshQrCode(): boolean {
    return Date.now() + MAX_WAIT_TIME > this.pollLoopStartTime + QR_EXPIRED_TIME;
  }

  /**
   * 处理二维码刷新
   */
  private async handleQrCodeRefresh(): Promise<void> {
    console.log('[Auth] 二维码即将过期，重新初始化');

    // 提前清理状态，避免外层 finally 影响递归调用
    this.pollingPromise = null;
    this.abortController = null;
    this.traceId = null;

    await this.initQr();
    await this.startPolling();
  }

  /**
   * 处理状态响应
   * @returns 是否继续轮询
   */
  private async handleStatusResponse(result: PollStatusResponse): Promise<boolean> {
    switch (result.status) {
      case LoginStatus.SUCCESS:
        console.log('[Auth] 登录成功');
        const userInfo = await this.fetchUserInfo(result.code!);
        this.promiseResolve(userInfo);
        return false;

      case LoginStatus.FAILED:
        this.promiseReject(new Error(result.message || '登录失败'));
        return false;

      case LoginStatus.SCANNED:
      case LoginStatus.PENDING:
        this.retries++;
        const interval = this.getPollingInterval(result.status);
        await this.sleep(interval);
        return true;

      default:
        return true;
    }
  }

  /**
   * 处理轮询错误
   * @returns 是否继续轮询
   */
  private async handlePollError(error: any): Promise<boolean> {
    console.error('[Auth] 轮询出错:', error);

    // 如果是取消或销毁，直接退出
    if (error.name === 'AbortError' || error.message?.includes('实例已销毁')) {
      return false;
    }

    // 其他错误继续重试，但计入重试次数
    this.retries++;
    await this.sleep(ERROR_RETRY_INTERVAL);
    return true;
  }

  /**
   * 延时工具函数
   * @param ms 延时毫秒数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}