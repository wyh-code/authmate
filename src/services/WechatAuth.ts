import { AuthConfig } from '../types';
import { API_ROUTES, WX_LOGIN_SCRIPT, QR_EXPIRED_TIME } from '../constants'
import { BaseAuthService } from './BaseAuthService';

export class WechatAuth extends BaseAuthService {
  private WxLogin: any;
  private qrContainer: string;
  private qrCodeTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null; // 新增：取消控制器

  // 常量定义
  private static readonly WX_LOGIN_SCRIPT = WX_LOGIN_SCRIPT;
  private static readonly QR_EXPIRED_TIME = QR_EXPIRED_TIME; // 微信二维码5分钟过期

  constructor(config: AuthConfig) {
    // 先补全默认值
    const finalConfig: AuthConfig = {
      ...config,
      auto: config.auto ?? true,
      apiRouter: config.apiRouter || API_ROUTES['wx']
    };
    super(finalConfig);
    this.qrContainer = config.container;
    this.initWxLoginScript();
  }

  /**
   * 初始化微信登录脚本
   */
  private async initWxLoginScript(): Promise<void> {
    if ((window as any).WxLogin) {
      this.WxLogin = (window as any).WxLogin;
      await this.initQr();
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = WechatAuth.WX_LOGIN_SCRIPT;
      script.async = true;

      script.onload = async () => {
        this.WxLogin = (window as any).WxLogin;
        await this.initQr();
        resolve();
      };

      script.onerror = () => {
        reject(new Error('微信登录脚本加载失败'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * 获取容器元素
   */
  private getContainer(): HTMLElement | null {
    return document.getElementById(this.qrContainer);
  }

  /**
   * 初始化二维码
   */
  private async initQr(): Promise<void> {
    try {
      this.clearQrCodeTimer();
      const config = await this.getConfig();

      if (!config || !this.WxLogin) {
        throw new Error('配置或 WxLogin 不可用');
      }

      this.createWxLoginQrCode(config);

      // 设置过期定时器
      this.qrCodeTimer = setTimeout(
        () => this.initQr(),
        WechatAuth.QR_EXPIRED_TIME
      );
    } catch (error) {
      console.error('[WechatAuth] 初始化二维码失败:', error);
      throw error;
    }
  }

  /**
   * 创建微信登录二维码
   */
  private createWxLoginQrCode(config: any): void {
    const container = this.getContainer();
    if (!container) {
      console.error('[WechatAuth] 容器元素不存在');
      return;
    }

    container.innerHTML = '';
    new this.WxLogin({
      self_redirect: true,
      id: this.qrContainer,
      state: this.getTraceId(),
      ...config,
    });
  }

  /**
   * 清除二维码定时器
   */
  private clearQrCodeTimer(): void {
    if (this.qrCodeTimer) {
      clearTimeout(this.qrCodeTimer);
      this.qrCodeTimer = null;
    }
  }

  /**
   * 登录方法（核心重构：轮询替代 WebSocket）
   */
  async login(): Promise<any> {
    try {
      // 等待 traceId 可用
      await this.waitForTraceId();

      const traceId = this.getTraceId();
      if (!traceId) {
        throw new Error('TraceId 不可用');
      }

      console.log('[WechatAuth] 开始登录流程, traceId:', traceId);

      // 创建取消控制器
      this.abortController = new AbortController();

      // 轮询获取登录状态
      const code = await this.pollLoginStatus(traceId, this.abortController.signal);

      console.log('[WechatAuth] 获取到 code:', code);

      // 获取用户信息
      const userInfo = await this.fetchUserInfo(code);

      console.log('[WechatAuth] 登录成功');
      return userInfo;

    } catch (error: any) {
      console.error('[WechatAuth] 登录失败:', error.message);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * 取消登录
   */
  cancelLogin(): void {
    if (this.abortController) {
      console.log('[WechatAuth] 取消登录');
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    console.log('[WechatAuth] 销毁实例');
    this.cancelLogin();
    this.clearQrCodeTimer();

    const container = this.getContainer();
    if (container) {
      container.innerHTML = '';
    }
  }
}
