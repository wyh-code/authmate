# @ostore/authmate

一个优雅的第三方登录认证库，支持微信扫码登录。【An elegant third-party authentication library supporting WeChat QR code login.】

## 特性【Features】
- ✨ 开箱即用【Out of the box】- 简单配置即可使用
- 🔄 智能轮询【Smart polling】- 自动管理轮询生命周期，支持动态间隔调整
- 🔐 类型安全【Type safe】- 完整的 TypeScript 类型定义
- 🎯 状态管理【State management】- 完善的状态回调机制
- 🚀 高性能【High performance】- 优化的轮询策略，避免资源浪费

## 安装【Installation】
```bash
npm install @ostore/authmate
# or
yarn add @ostore/authmate
# or
pnpm add @ostore/authmate
```

## 官网测试

[【点击前往测试】](https://auth.mocknet.cn/)

## 快速开始【Quick Start】

### 基础用法【Basic Usage】
```js
import { Authmate } from '@ostore/authmate';

// 微信登录
const wechatAuth = Authmate.wechat({ container: 'wechatContainer' /* 二维码容器id */ });
// 开始登录【Start login】
try {
  const userInfo = await wechatAuth.login();
  console.log('userInfo: ', userInfo)
} catch (error) {
  console.error('登录失败:', error);
}
```

### HTML 结构【HTML Structure】
```html
<div id="qrcode-container"></div>
```

## API 文档【API Documentation】

### Authmate.wechat(config)
创建微信登录实例【Create WeChat login instance】

**参数【Parameters】:**
```typescript
interface AuthConfig {
  container: string; // 必填【Required】: 二维码容器 DOM ID
  auto?: boolean; // 可选【Optional】: 是否自动轮询，默认 true
  fetchBase?: string; // 可选【Optional】: API 基础 URL
  headers?: { datasource: string; }; // 可选【Optional】: 自定义请求头
  apiRouter?: ApiConfig; // 可选【Optional】: 自定义 API 路由
  onStatusChange?: (status: LoginStatus) => void; // 状态变化回调
  onQrRefresh?: (traceId: string) => void; // 二维码刷新回调
  onError?: (error: Error) => void; // 错误回调
}
```

**返回【Returns】:** `WechatAuth` 实例

---

### 实例方法【Instance Methods】

#### login()
开始登录流程【Start login process】
```typescript
const userInfo = await wechatAuth.login();
```
**返回【Returns】:** `Promise<AuthResult>` - 用户信息
**异常【Throws】:** 登录超时、用户取消、网络错误【Login timeout, user cancelled, network error】

#### refreshQrCode()
手动刷新二维码【Manually refresh QR code】
```typescript
await wechatAuth.refreshQrCode();
```

#### getStatus()
获取当前认证状态【Get current authentication status】
```typescript
const status = wechatAuth.getStatus();
// { retries: 10, traceId: 'xxx-xxx-xxx' }
```
**返回【Returns】:** `AuthStatus`

#### getTraceId()
获取当前 traceId【Get current trace ID】
```typescript
const traceId = wechatAuth.getTraceId();
```
**返回【Returns】:** `string | null`

#### destroy()
销毁实例并清理资源【Destroy instance and cleanup resources】
```typescript
wechatAuth.destroy();
```

---

## 登录状态【Login Status】
```typescript
enum LoginStatus {
  PENDING = 0, // 等待扫码【Waiting for scan】
  SCANNED = 1, // 已扫码待确认【Scanned, awaiting confirmation】
  SUCCESS = 2, // 登录成功【Login successful】
  EXPIRED = 3, // 二维码过期【QR code expired】
  FAILED = 4 // 登录失败【Login failed】
}
```

## 高级用法【Advanced Usage】

### 自定义 API 路由【Custom API Routes】
建议通过服务端转发第三方认证接口，便于日志记录、权限卡控和安全管理。【Recommend forwarding third-party auth APIs through your server for logging, access control and security management.】

```typescript
const wechatAuth = Authmate.wechat({
  container: 'qrcode-container',
  fetchBase: 'https://your-api.com',
  apiRouter: {
    config: '/your/config',
    code2info: '/your/code2info',
    status: '/your/status'
  }
});
```

**Koa 服务端转发示例【Koa Server Forwarding Example】:**
```typescript
import Koa from 'koa';
import Router from '@koa/router';
import axios from 'axios';

const app = new Koa();
const router = new Router();

const THIRD_PARTY_BASE = 'https://auth.mocknet.cn';

//【重要】中间件设置响应头
ctx.set('X-Trace-Id', 'X-Trace-Id');

// 获取配置【Get config】
router.get('/your/config', async (ctx) => {
  const { data } = await axios.get(`${THIRD_PARTY_BASE}/auth/wx/config`, {
    headers: { datasource: 'authmate' }
  });
  
  // 日志记录【Logging】
  console.log('[Auth] Config fetched', { ip: ctx.ip, timestamp: Date.now() });
  
  //【重要】中间件若没有设置，需在此处使用三方认证接口响应的 X-Trace-Id
  // ctx.set('X-Trace-Id', 'X-Trace-Id');

  ctx.body = data;
});

// 查询状态【Query status】
router.get('/your/status/:traceId', async (ctx) => {
  const { traceId } = ctx.params;
  const { data } = await axios.get(`${THIRD_PARTY_BASE}/auth/wx/status/${traceId}`, {
    headers: { datasource: 'authmate' }
  });
  
  // 日志记录【Logging】
  console.log('[Auth] Status queried', { traceId, status: data.status });
  
  ctx.body = data;
});

// 换取用户信息【Exchange user info】
router.get('/your/code2info', async (ctx) => {
  const { code } = ctx.query;
  const { data } = await axios.get(`${THIRD_PARTY_BASE}/auth/wx/code2info?code=${code}`, {
    headers: { datasource: 'authmate' }
  });
  
  // 日志记录【Logging】
  console.log('[Auth] User info fetched', { openid: data.openid });
  
  ctx.body = data;
});

app.use(router.routes());
app.listen(3000);
```

### 状态监听示例【Status Monitoring Example】
```typescript
const wechatAuth = Authmate.wechat({
  container: 'qrcode-container',

  onStatusChange: (status) => {
    switch (status) {
      case LoginStatus.PENDING:
        console.log('请扫码登录【Please scan QR code】');
        break;
      case LoginStatus.SCANNED:
        console.log('已扫码，请确认【Scanned, please confirm】');
        break;
      case LoginStatus.SUCCESS:
        console.log('登录成功【Login successful】');
        break;
    }
  },

  onQrRefresh: (traceId) => {
    console.log(`二维码已刷新【QR code refreshed】: ${traceId}`);
  },

  onError: (error) => {
    console.error('错误【Error】:', error.message);
  }
});
```

## 配置说明【Configuration】

### 轮询策略【Polling Strategy】
- **最大重试次数【Max retries】**: 300 次
- **动态间隔【Dynamic interval】**:
  - 前 20 次: 1秒【First 20: 1s】
  - 20-40 次: 2秒【20-40: 2s】
  - 40-60 次: 3秒【40-60: 3s】
  - 60 次后: 4秒【After 60: 4s】
- **已扫码状态【Scanned status】**: 固定 1 秒【Fixed 1s】

### 超时设置【Timeout Settings】
- **二维码有效期【QR validity】**: 4分50秒【4min 50s】
- **状态查询超时【Query timeout】**: 25秒【25s】
- **traceId 等待超时【TraceId timeout】**: 60秒【60s】

## 最佳实践【Best Practices】

### 组件卸载时清理【Cleanup on Unmount】
```typescript
// React 示例【React example】
useEffect(() => {
  const wechatAuth = Authmate.wechat({ /* config */ });
  return () => {
    wechatAuth.destroy();
  };
}, []);
```

### 错误处理【Error Handling】
```typescript
try {
  const userInfo = await wechatAuth.login();
} catch (error) {
  if (error.message.includes('已销毁')) {
    // 实例已销毁【Instance destroyed】
  } else if (error.message.includes('超时')) {
    // 登录超时【Timeout】
  }
}
```

### 手动刷新【Manual Refresh】
```typescript
document.getElementById('refresh-btn').addEventListener('click', async () => {
  await wechatAuth.refreshQrCode();
});
```

## 注意事项【Notes】
1. 调用 `login()` 前确保容器已渲染【Ensure container is rendered before calling `login()`】
2. 同一页面避免创建多个实例【Avoid multiple instances on same page】
3. 组件销毁时务必调用 `destroy()`【Must call `destroy()` on component unmount】
4. 二维码刷新不会重置重试计数器【QR refresh won't reset retry counter】

## 类型定义【Type Definitions】
```typescript
// 用户信息【User Info】
interface AuthResult {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  [key: string]: any;
}

// API 响应【API Response】
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 认证状态【Auth Status】
interface AuthStatus {
  retries: number; // 当前重试次数【Current retry count】
  traceId: string | null; // 当前 traceId【Current trace ID】
}

// API 配置【API Config】
interface ApiConfig {
  config: string; // 获取配置
  code2info: string; // 换取用户信息
  status: string; // 查询状态
}

// 轮询状态响应【Poll Status Response】
interface PollStatusResponse {
  status: LoginStatus;
  code?: string;
  message?: string;
}
```

## License
MIT