import { AuthConfig, AuthType } from "../types/auth";
export declare abstract class BaseAuthService {
    protected config: AuthConfig;
    protected qrcode_expired: string;
    protected fetchBase: string;
    private traceId;
    private static readonly API_ROUTES;
    constructor(config: AuthConfig);
    getTraceId(): string | null;
    private fetchAPI;
    getConfig(type: AuthType): Promise<any>;
    fetchUserInfo(code: string, type: AuthType): Promise<any>;
    createConnet(state: string): Promise<string>;
}
//# sourceMappingURL=base.d.ts.map