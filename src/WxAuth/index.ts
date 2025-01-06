
import { ICreateAuthmateProps } from '../type';
import createFetch from '../fetch';

class WxAuth {
  options: ICreateAuthmateProps;
  apiClient: any;

  constructor(props: ICreateAuthmateProps) {
    this.options = props;
    this.apiClient = createFetch(props);
    this.initWxLogin();
    this.init();
  }

  initWxLogin = () => {
    const script = document.createElement('script');
    script.innerText = `
      !function(e,t){e.WxLogin=function(e){var r="default";!0===e.self_redirect?r="true":!1===e.self_redirect&&(r="false");var i=t.createElement("iframe"),n="https://open.weixin.qq.com/connect/qrconnect?appid="+e.appid+"&scope="+e.scope+"&redirect_uri="+e.redirect_uri+"&state="+e.state+"&login_type=jssdk&self_redirect="+r+"&styletype="+(e.styletype||"")+"&sizetype="+(e.sizetype||"")+"&bgcolor="+(e.bgcolor||"")+"&rst="+(e.rst||"");n+=e.style?"&style="+e.style:"",n+=e.href?"&href="+e.href:"",n+="en"===e.lang?"&lang=en":"",n+=1===e.stylelite?"&stylelite=1":"",n+=0===e.fast_login?"&fast_login=0":"",i.src=n,i.frameBorder="0",i.allowTransparency="true",i.scrolling="no",i.width="300px",i.height="400px";var l=t.getElementById(e.id);l.innerHTML="",l.appendChild(i)}}(window,document);
    `
    const head = document.getElementsByTagName('head')[0];
    head.appendChild(script);
  }

  getConfig = async () => {
    return this.apiClient.post('/npm/wx/config')
  }

  init = async () => {
    const config = await this.getConfig();

    const WxLogin = (window as any).WxLogin;
    if(config.code === 200) {
      new WxLogin({
        self_redirect: true,
        id: this.options.container,
        state: this.options.state,
        ...(config.data as object),
      });
    } else {
      console.error(config)
    }
  }

  login:any = async () => {
    const result = await this.apiClient.post('/npm/wx/login');

    if(result.code === 408 && this.options.loop) {
      return await this.login()
    }
    
    return result;
  }
}

export default WxAuth;