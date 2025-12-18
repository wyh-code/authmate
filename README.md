# @ostore/authmate

授权助手，轻松实现微信扫码登录

## 快速使用
```js
import { Authmate } from '@ostore/authmate';

// 微信登录
const wechatAuth = Authmate.wechat({ container: 'wechatContainer' /* 二维码容器id */ });
const userInfo = await wechatAuth.login();
console.log('userInfo: ', userInfo)
```