import { ICreateAuthmateProps } from '../type';
declare class WxAuth {
    options: ICreateAuthmateProps;
    constructor(props: ICreateAuthmateProps);
    initWxLogin: () => void;
    getConfig: () => Promise<any>;
    init: () => Promise<void>;
    fetchUserInfo: (code: any) => Promise<any>;
    login: () => Promise<unknown>;
}
export default WxAuth;
