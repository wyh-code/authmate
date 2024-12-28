import { RequestConfig, ResponseData } from './type';

// 一个通用的 HTTP 客户端类
class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // 处理GET请求
  public async get<T>(endpoint: string, config: RequestConfig={}): Promise<ResponseData<T>> {
    if(config.params) {
      // 将参数转为 URL 查询字符串
      const queryString = new URLSearchParams(config.params).toString();
      // 构建完整的请求 URL
      endpoint = `${endpoint}?${queryString}`;
    }
    return this.request<T>(endpoint, config);
  }

  // 处理POST请求
  public async post<T>(endpoint: string, config: RequestConfig): Promise<ResponseData<T>> {
    config.method = 'post';
    return this.request<T>(endpoint, config);
  }

  // 通用请求函数
  private async request<T>(endpoint: string, config: RequestConfig): Promise<ResponseData<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    try {
      const response = await fetch(url, { ...config, headers });

      if(config.format === false) {
        return response as any;
      }

      if (!response.ok) {
        return { code: 500, error: `HTTP error! status: ${response.status}` };
      }

      return await response.json()
    } catch (error) {
      return { code: 500, error: (error as Error).message };
    }
  }
}

const base_url = 'auth.authmate.cn';
export default new HttpClient(`${location.protocol}//${base_url}`);
