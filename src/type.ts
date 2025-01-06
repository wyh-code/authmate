
export interface ICreateAuthmateProps {
  container: string;
  uid: string;
  appid: string;
  type?: string;
  state?: string;
  loop?: boolean;
}

export interface RequestConfig extends RequestInit {
  params?: { [key: string]: any };
  format?: boolean;
}

// 定义一个接口表示响应数据
export interface ResponseData<T> {
  code: number;
  data?: T;
  error?: string;
}