class WxAuth {
    options;
    constructor(props) {
        this.options = props;
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
        const body = {
            uid: this.options.uid,
            appid: this.options.appid,
            origin: 'authmate'
        };
        return fetch('https://auth.mocknet.cn/wx/config', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        })
            .then(res => res.json());
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
    fetchUserInfo = async (code) => {
        const url = 'https://auth.mocknet.cn/wx/code2info';
        const state = this.options.state;
        const queryString = new URLSearchParams({
            code,
            state,
            origin: 'authmate'
        }).toString();
        return fetch(`${url}?${queryString}`).then(res => res.json());
    };
    login = async () => {
        const state = this.options.state;
        console.log('state: ', state);
        return new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket('wss://auth.mocknet.cn/ws');
                // 打开连接时触发
                ws.addEventListener('open', (event) => {
                    ws.send(JSON.stringify({ state, status: 'init' }));
                });
                // 收到服务器消息时触发
                ws.addEventListener('message', (event) => {
                    // console.log('Message from server', event.data);
                    try {
                        const json = JSON.parse(event.data);
                        if (json.code) {
                            ws.send(JSON.stringify({ state, status: 'close' }));
                            this.fetchUserInfo(json.code).then(res => {
                                resolve(res);
                            });
                        }
                    }
                    catch (error) {
                        console.log('ws messger error: ', error);
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
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
    if (!props.uid) {
        console.error('uid缺失！请先登录【www.authmate.cn】获取uid！');
        return;
    }
    if (!props.container) {
        console.error('container 缺失！');
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
    props.type = props.type || 'wx';
    props.state = props.state || `authmate:${props.uid}_${props.appid}_${+new Date}`;
    return new Authmate(props);
};

export { createAuthmate as default };
