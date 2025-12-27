import { AuthConfig, AuthResult } from '../types';
import { API_ROUTES, WX_LOGIN_SCRIPT } from '../constants';
import { BaseAuthService } from './BaseAuthService';

/**
 * 微信认证服务
 */
export class WechatAuth extends BaseAuthService {
  // ==================== 私有属性 ====================
  private WxLogin: any;
  private qrContainer: string;
  private scriptLoadPromise: Promise<void> | null = null;
  private isRefreshing = false;

  // ==================== 构造函数 ====================
  constructor(config: AuthConfig) {
    const finalConfig: AuthConfig = {
      ...config,
      auto: config.auto ?? true,
      apiRouter: config.apiRouter || API_ROUTES.wx
    };

    super(finalConfig);
    this.qrContainer = config.container;
    this.scriptLoadPromise = this.initWxLoginScript();
  }

  // ==================== 公共方法 ====================
  /**
   * 登录
   * @returns 用户信息
   */
  async login(): Promise<AuthResult> {
    if (this.isPolling()) {
      throw new Error('登录流程进行中，请勿重复调用');
    }

    try {
      this.checkDestroyed();

      // 等待脚本和二维码初始化完成
      if (this.scriptLoadPromise) {
        await this.scriptLoadPromise;
      }

      // 等待 traceId 可用
      await this.waitForTraceId();
      console.log('[WechatAuth] 开始登录流程, traceId:', this.getTraceId());

      // 启动轮询，结果通过 promiseResolve/Reject 返回
      return new Promise((resolve, reject) => {
        this.promiseResolve = resolve;
        this.promiseReject = reject;
        this.startPolling();
      });

    } catch (error: any) {
      console.error('[WechatAuth] 登录失败:', error.message);

      if (!this.getIsDestroyed()) {
        this.config.onError?.(error);
      }

      throw error;
    }
  }

  /**
   * 手动刷新二维码
   */
  async refreshQrCode(): Promise<void> {
    console.log('[WechatAuth] 手动刷新二维码');

    // 停止当前轮询
    if (this.isPolling()) {
      this.stopPolling();
    }

    // 重新初始化
    await this.initQr();

    // 重启轮询
    if (!this.getIsDestroyed()) {
      await this.startPolling();
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    console.log('[WechatAuth] 销毁实例');

    this.markDestroyed();
    this.stopPolling();
    this.clearContainer();
    this.scriptLoadPromise = null;
    this.isRefreshing = false;
    this.promiseReject(new Error('实例已销毁'));
  }

  // ==================== 保护方法 ====================
  /**
   * 初始化二维码（实现抽象方法）
   */
  protected async initQr(): Promise<void> {
    if (this.isRefreshing) {
      console.log('[WechatAuth] 二维码刷新中，跳过重复调用');
      return;
    }

    this.isRefreshing = true;

    try {
      this.checkDestroyed();

      // 获取新配置
      const config = await this.getConfig();
      if (!config || !this.WxLogin) {
        throw new Error('配置或 WxLogin 不可用');
      }

      // 创建二维码
      this.createWxLoginQrCode(config);

      // 触发刷新回调
      const currentTraceId = this.getTraceId() as string;
      if (!this.getIsDestroyed()) {
        this.config.onQrRefresh?.(currentTraceId);
      }

      console.log('[WechatAuth] 二维码初始化成功, traceId:', currentTraceId);
    } catch (error: any) {
      console.error('[WechatAuth] 初始化二维码失败:', error);
      if (!this.getIsDestroyed()) {
        this.config.onError?.(error);
      }
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // ==================== 私有方法 - 脚本加载 ====================
  /**
   * 初始化微信登录脚本
   */
  private async initWxLoginScript(): Promise<void> {
    // 如果已加载，直接使用
    if ((window as any).WxLogin) {
      this.WxLogin = (window as any).WxLogin;
      await this.initQr();
      return;
    }

    // 检查是否已有脚本标签
    const existingScript = document.querySelector(
      `script[src="${WX_LOGIN_SCRIPT}"]`
    );
    if (existingScript) {
      return this.waitForScriptLoad(existingScript);
    }

    // 创建新脚本标签
    return this.loadScript();
  }

  /**
   * 等待已存在的脚本加载完成
   */
  private waitForScriptLoad(script: Element): Promise<void> {
    return new Promise((resolve, reject) => {
      script.addEventListener('load', async () => {
        this.WxLogin = (window as any).WxLogin;
        await this.initQr();
        resolve();
      });
      script.addEventListener('error', () =>
        reject(new Error('微信登录脚本加载失败'))
      );
    });
  }

  /**
   * 加载微信登录脚本
   */
  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = WX_LOGIN_SCRIPT;
      script.async = true;

      script.onload = async () => {
        this.WxLogin = (window as any).WxLogin;
        try {
          await this.initQr();
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error('微信登录脚本加载失败'));
      };

      document.head.appendChild(script);
    });
  }

  // ==================== 私有方法 - DOM 操作 ====================
  /**
   * 获取容器元素
   */
  private getContainer(): HTMLElement {
    const container = document.getElementById(this.qrContainer);
    if (!container) {
      throw new Error(`容器元素 #${this.qrContainer} 不存在`);
    }
    return container;
  }

  /**
   * 创建微信登录二维码
   */
  private createWxLoginQrCode(config: any): void {
    const container = this.getContainer();
    container.innerHTML = '';

    new this.WxLogin({
      self_redirect: true,
      id: this.qrContainer,
      state: this.getTraceId(),
      ...config,
    });
  }

  /**
   * 清理容器
   */
  private clearContainer(): void {
    try {
      const container = this.getContainer();
      container.innerHTML = '';
    } catch (error) {
      // 容器可能已被移除，忽略错误
    }
  }
}
