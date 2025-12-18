import { WechatAuth } from './services/WechatAuth';
import { AuthConfig } from './types';

export class Authmate {
  static wechat(config: AuthConfig) {
    return new WechatAuth(config);
  }
}

export * from './types';
