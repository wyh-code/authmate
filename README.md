## 授权助手

### 使用
只需三行代码，轻松获取用户扫码信息
```js
import createAuthmate from '@ostore/authmate';

// 创建实例
const authmate = createAuthmate({ container: 'container', appid: 'appid', uid: 'uid', loop: true});
// 获取用户信息
const user = await authmate?.login(); 
```

### 如何获取 `appid`、`uid`
- 进入[官网](www.authmate.cn)，点击登录/注册
![官网](图片URL)

- 在首页获取 <b>`uid`</b>
![UID](图片URL)

- 新建应用获取 <b>`appid`</b>
![APPID](图片URL)
![APPID](图片URL)