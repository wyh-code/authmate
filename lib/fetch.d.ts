import { RequestConfig, ResponseData } from './type';
declare class HttpClient {
    private baseUrl;
    private options;
    constructor(baseUrl: string, options: any);
    get<T>(endpoint: string, config?: RequestConfig): Promise<ResponseData<T>>;
    post<T>(endpoint: string, config?: RequestConfig): Promise<ResponseData<T>>;
    private request;
}
declare const createFetch: (options: any) => HttpClient;
export default createFetch;
