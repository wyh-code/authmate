import { Authmate } from '@ostore/authmate';
// import { Authmate } from '../src/index';
import { useEffect } from 'react';

export default function HomePage() {

  const initWechatLogin = async () => {
    const wechatAuth = Authmate.wechat({ container: 'wechatContainer' });
    const userInfo = await wechatAuth.login();
    console.log('wechatAuth: ', wechatAuth, userInfo)
  }

  useEffect(() => {
    initWechatLogin()
  }, [])

  return (
    <div>
      <h3>微信扫码登录</h3>
      <div id="wechatContainer"></div>
    </div>
  );
}
