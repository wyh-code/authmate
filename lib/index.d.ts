import { ICreateAuthmateProps } from './type';
declare class Authmate {
    instance: any;
    constructor(props: ICreateAuthmateProps);
    login(): any;
}
declare const createAuthmate: (props: ICreateAuthmateProps) => Authmate | undefined;
export default createAuthmate;
