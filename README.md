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
![官网](https://github.com/wyh-code/authmate/blob/main/assets/www.authmate.cn.png?raw=true)

- 在首页获取 <b>`uid`</b>
![UID](https://github.com/wyh-code/authmate/blob/main/assets/home.png?raw=true)

- 新建应用获取 <b>`appid`</b>
![APPID](https://github.com/wyh-code/authmate/blob/main/assets/createApp.png?raw=true)
![APPID](https://github.com/wyh-code/authmate/blob/main/assets/appid.png?raw=true)