import { WechatAuth } from './services/wechat';
import { QQAuth } from './services/qq';
import { AuthConfig } from './types/auth';
export declare class Authmate {
    static wechat(config: AuthConfig): WechatAuth;
    static qq(config: AuthConfig): QQAuth;
}
export * from './types/auth';
//# sourceMappingURL=index.d.ts.map