var createAuthmate = (function (CryptoJS) {
  'use strict';

  // 加密
  const encrypt = (data, secretKey) => {
      return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  };

  // 一个通用的 HTTP 客户端类
  class HttpClient {
      baseUrl;
      options;
      constructor(baseUrl, options) {
          this.baseUrl = baseUrl;
          this.options = options;
      }
      // 处理GET请求
      async get(endpoint, config = {}) {
          if (config.params) {
              // 将参数转为 URL 查询字符串
              const queryString = new URLSearchParams(config.params).toString();
              // 构建完整的请求 URL
              endpoint = `${endpoint}?${queryString}`;
          }
          return this.request(endpoint, config);
      }
      // 处理POST请求
      async post(endpoint, config = {}) {
          config.method = 'post';
          return this.request(endpoint, config);
      }
      // 通用请求函数
      async request(endpoint, config) {
          const url = `${this.baseUrl}${endpoint}`;
          const headers = {
              'Content-Type': 'application/json',
              ...this.options.headers,
              ...config.headers,
          };
          try {
              const response = await fetch(url, { ...config, headers });
              console.log('response: ', response);
              if (config.format === false) {
                  return response;
              }
              if (!response.ok) {
                  return { code: 500, error: `HTTP error! status: ${response.status}` };
              }
              return await response.json();
          }
          catch (error) {
              return { code: 500, error: error.message };
          }
      }
  }
  const base_url = 'auth.authmate.cn';
  const createFetch = (options) => {
      const headers = {
          authorization: encrypt(options, ''),
          datasource: 'npm'
      };
      return new HttpClient(`${location.protocol}//${base_url}`, { headers });
  };

  class WxAuth {
      options;
      apiClient;
      constructor(props) {
          this.options = props;
          this.apiClient = createFetch(props);
          this.initWxLogin();
          this.init();
      }
      initWxLogin = () => {
          const script = document.createElement('script');
          script.innerText = `
      !function(e,t){e.WxLogin=function(e){var r="default";!0===e.self_redirect?r="true":!1===e.self_redirect&&(r="false");var i=t.createElement("iframe"),n="https://open.weixin.qq.com/connect/qrconnect?appid="+e.appid+"&scope="+e.scope+"&redirect_uri="+e.redirect_uri+"&state="+e.state+"&login_type=jssdk&self_redirect="+r+"&styletype="+(e.styletype||"")+"&sizetype="+(e.sizetype||"")+"&bgcolor="+(e.bgcolor||"")+"&rst="+(e.rst||"");n+=e.style?"&style="+e.style:"",n+=e.href?"&href="+e.href:"",n+="en"===e.lang?"&lang=en":"",n+=1===e.stylelite?"&stylelite=1":"",n+=0===e.fast_login?"&fast_login=0":"",i.src=n,i.frameBorder="0",i.allowTransparency="true",i.scrolling="no",i.width="300px",i.height="400px";var l=t.getElementById(e.id);l.innerHTML="",l.appendChild(i)}}(window,document);
    `;
          const head = document.getElementsByTagName('head')[0];
          head.appendChild(script);
      };
      getConfig = async () => {
          return this.apiClient.post('/npm/wx/config');
      };
      init = async () => {
          const config = await this.getConfig();
          const WxLogin = window.WxLogin;
          if (config.code === 200) {
              new WxLogin({
                  self_redirect: true,
                  id: this.options.container,
                  state: this.options.state,
                  ...config.data,
              });
          }
          else {
              console.error(config);
          }
      };
      login = async () => {
          const result = await this.apiClient.post('/npm/wx/login');
          if (result.code === 408 && this.options.loop) {
              return await this.login();
          }
          return result;
      };
  }

  class Authmate {
      instance;
      constructor(props) {
          if (props.type === 'wx') {
              this.instance = new WxAuth(props);
          }
      }
      login() {
          return this.instance.login();
      }
  }
  const createAuthmate = (props) => {
      if (!props.container) {
          console.error('container 缺失！');
          return;
      }
      if (!props.uid) {
          console.error('uid缺失！请先登录【www.authmate.cn】获取uid！');
          return;
      }
      if (!props.appid) {
          console.error('appid 缺失！');
          return;
      }
      if (!document.getElementById(props.container)) {
          console.error('container 获取不到，请填写正确的 id！');
          return;
      }
      // 目前只支持微信扫码，暂时写死
      props.type = 'wx';
      props.state = typeof props.state === "string" ? props.state : `authmate:${props.uid}_${props.appid}_${+new Date}`;
      return new Authmate(props);
  };

  return createAuthmate;

})(CryptoJS);
