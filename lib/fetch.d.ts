import { RequestConfig, ResponseData } from './type';
declare class HttpClient {
    private baseUrl;
    constructor(baseUrl: string);
    get<T>(endpoint: string, config?: RequestConfig): Promise<ResponseData<T>>;
    post<T>(endpoint: string, config: RequestConfig): Promise<ResponseData<T>>;
    private request;
}
declare const _default: HttpClient;
export default _default;
