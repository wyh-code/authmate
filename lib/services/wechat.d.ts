import { AuthConfig } from '../types/auth';
import { BaseAuthService } from './base';
export declare class WechatAuth extends BaseAuthService {
    private WxLogin;
    private qrContainer;
    private qrCodeTimer;
    private qrCodeExpiredElement;
    private static readonly WX_LOGIN_SCRIPT;
    private static readonly QR_EXPIRED_TIME;
    constructor(config: AuthConfig);
    private initWxLoginScript;
    private getContainer;
    private initQr;
    private createWxLoginQrCode;
    private showQrCodeExpired;
    private refreshQrCode;
    private clearQrCodeTimer;
    private removeQrCodeExpired;
    destroy(): void;
    login(): Promise<any>;
    private waitForTraceId;
}
//# sourceMappingURL=wechat.d.ts.map