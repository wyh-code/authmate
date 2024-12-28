import { ICreateAuthmateProps } from '../type';
declare class WxAuth {
    options: ICreateAuthmateProps;
    constructor(props: ICreateAuthmateProps);
    initWxLogin: () => void;
    getConfig: () => Promise<import("../type").ResponseData<unknown>>;
    init: () => Promise<void>;
    login: () => Promise<import("../type").ResponseData<unknown>>;
}
export default WxAuth;
