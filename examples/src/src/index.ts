import { WechatAuth } from './services/wechat';
import { QQAuth } from './services/qq';
import { AuthConfig } from './types/auth';

export class Authmate {
  static wechat(config: AuthConfig) {
    return new WechatAuth(config);
  }

  static qq(config: AuthConfig) {
    return new QQAuth(config);
  }
}

export * from './types/auth';
