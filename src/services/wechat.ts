import { AuthConfig } from '../types/auth';
import { BaseAuthService } from './base';

export class WechatAuth extends BaseAuthService {
  private WxLogin: any;
  private qrContainer: string;
  private qrCodeTimer: ReturnType<typeof setTimeout> | null = null;
  private qrCodeExpiredElement: HTMLImageElement | null = null;

  // 常量提取
  private static readonly WX_LOGIN_SCRIPT = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
  private static readonly QR_EXPIRED_TIME = 60000; // 60秒

  constructor(config: AuthConfig) {
    super(config);
    this.qrContainer = config.container;
    this.initWxLoginScript();
  }

  // 优化脚本加载逻辑
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

      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 获取容器元素（复用逻辑）
  private getContainer(): HTMLElement | null {
    return document.getElementById(this.qrContainer);
  }

  // 优化二维码初始化
  private async initQr(): Promise<void> {
    try {
      this.clearQrCodeTimer();
      const config = await this.getConfig('wx');
      
      if (!config || !this.WxLogin) {
        throw new Error('Config or WxLogin not available');
      }

      this.createWxLoginQrCode(config);
      
      // 设置过期定时器
      this.qrCodeTimer = setTimeout(
        () => this.showQrCodeExpired(), 
        WechatAuth.QR_EXPIRED_TIME
      );
    } catch (error) {
      console.error('Error initializing QR code:', error);
      throw error;
    }
  }

  // 简化二维码创建
  private createWxLoginQrCode(config: any): void {
    this.removeQrCodeExpired();
    
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = '';
    new this.WxLogin({
      self_redirect: true,
      id: this.qrContainer,
      state: this.getTraceId(),
      ...config,
    });
  }

  // 优化过期提示显示
  private showQrCodeExpired(): void {
    const container = this.getContainer();
    if (!container) return;

    container.innerHTML = '';

    this.qrCodeExpiredElement = Object.assign(document.createElement('img'), {
      src: this.qrcode_expired,
      alt: '二维码已过期',
      style: 'cursor: pointer',
      onclick: this.refreshQrCode // 直接绑定
    });

    container.appendChild(this.qrCodeExpiredElement);
  }

  // 刷新二维码（使用箭头函数自动绑定 this）
  private refreshQrCode = async (): Promise<void> => {
    this.removeQrCodeExpired();
    await this.initQr();
  }

  private clearQrCodeTimer(): void {
    if (this.qrCodeTimer) {
      clearTimeout(this.qrCodeTimer);
      this.qrCodeTimer = null;
    }
  }

  private removeQrCodeExpired(): void {
    if (this.qrCodeExpiredElement) {
      this.qrCodeExpiredElement.onclick = null; // 移除事件
      this.qrCodeExpiredElement = null;
    }
  }

  destroy(): void {
    this.clearQrCodeTimer();
    this.removeQrCodeExpired();
  }

  // 优化 login 方法
  async login(): Promise<any> {
    // 等待 traceId 可用
    await this.waitForTraceId();
    
    const traceId = this.getTraceId();
    if (!traceId) {
      throw new Error('TraceId not available');
    }

    const code = await this.createConnet(traceId);
    return this.fetchUserInfo(code, 'wx');
  }

  // 新增：等待 traceId 的辅助方法
  private waitForTraceId(): Promise<void> {
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
