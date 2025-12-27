import { WechatAuth } from './services/WechatAuth';
import { AuthConfig } from './types';

/**
 * Authmate 认证库
 */
export class Authmate {
  /**
   * 创建微信登录实例
   * @param config 认证配置
   */
  static wechat(config: AuthConfig): WechatAuth {
    return new WechatAuth(config);
  }
}

// ==================== 导出 ====================
export * from './types';
export { WechatAuth } from './services/WechatAuth';
export { BaseAuthService } from './services/BaseAuthService';