## 快速使用
```js
import { Authmate } from '@ostore/authmate';

// 微信登录
const wechatAuth = createAuthmate.wechat({
  appId: 'your_app_id',
  appSecret: 'your_app_secret'
});

// 执行登录
const result = await wechatAuth.login();

// QQ登录
const qqAuth = createAuthmate.qq({
  appId: 'your_qq_app_id',
  appKey: 'your_app_key'
});

```