import { ICreateAuthmateProps } from '../type';
declare class WxAuth {
    options: ICreateAuthmateProps;
    apiClient: any;
    constructor(props: ICreateAuthmateProps);
    initWxLogin: () => void;
    getConfig: () => Promise<any>;
    init: () => Promise<void>;
    login: any;
}
export default WxAuth;
