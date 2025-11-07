'use strict';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class BaseAuthService {
    constructor(config) {
        this.traceId = null;
        this.config = config;
        this.fetchBase = 'https://auth.mocknet.cn';
        this.qrcode_expired = 'https://static.mocknet.cn/static/qrcode_expired.jpg';
    }
    getTraceId() {
        return this.traceId;
    }
    // 提取通用 fetch 方法，减少重复代码
    fetchAPI(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url, {
                    headers: { datasource: 'authmate' }
                });
                // 统一处理 traceId（只在 getConfig 时更新）
                const traceId = response.headers.get('X-Trace-Id');
                if (traceId) {
                    this.traceId = traceId;
                }
                const result = yield response.json();
                return result.data;
            }
            catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        });
    }
    getConfig(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.fetchBase}${BaseAuthService.API_ROUTES[type].config}`;
            return this.fetchAPI(url);
        });
    }
    fetchUserInfo(code, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.fetchBase}${BaseAuthService.API_ROUTES[type].code2info}?code=${code}`;
            return this.fetchAPI(url);
        });
    }
    // 优化 WebSocket 连接
    createConnet(state) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const ws = new WebSocket('wss://auth.mocknet.cn/ws');
                // 使用箭头函数，避免 this 绑定问题
                ws.onopen = () => {
                    ws.send(JSON.stringify({ state, status: 'init' }));
                };
                ws.onmessage = (event) => {
                    try {
                        const { code } = JSON.parse(event.data);
                        if (code) {
                            ws.send(JSON.stringify({ state, status: 'close' }));
                            ws.close(); // 主动关闭连接
                            resolve(code);
                        }
                    }
                    catch (error) {
                        reject(error);
                        ws.close();
                    }
                };
                ws.onerror = (error) => {
                    reject(new Error('WebSocket connection failed'));
                    ws.close();
                };
            });
        });
    }
}
// API 路由映射提升为类属性，避免重复创建
BaseAuthService.API_ROUTES = {
    wx: { config: '/auth/wx/config', code2info: '/auth/wx/code2info' },
    qq: { config: '/auth/qq/config', code2info: '/auth/qq/code2info' }
};

class WechatAuth extends BaseAuthService {
    constructor(config) {
        super(config);
        this.qrCodeTimer = null;
        this.qrCodeExpiredElement = null;
        // 刷新二维码（使用箭头函数自动绑定 this）
        this.refreshQrCode = () => __awaiter(this, void 0, void 0, function* () {
            this.removeQrCodeExpired();
            yield this.initQr();
        });
        this.qrContainer = config.container;
        this.initWxLoginScript();
    }
    // 优化脚本加载逻辑
    initWxLoginScript() {
        return __awaiter(this, void 0, void 0, function* () {
            if (window.WxLogin) {
                this.WxLogin = window.WxLogin;
                yield this.initQr();
                return;
            }
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = WechatAuth.WX_LOGIN_SCRIPT;
                script.async = true;
                script.onload = () => __awaiter(this, void 0, void 0, function* () {
                    this.WxLogin = window.WxLogin;
                    yield this.initQr();
                    resolve();
                });
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
    }
    // 获取容器元素（复用逻辑）
    getContainer() {
        return document.getElementById(this.qrContainer);
    }
    // 优化二维码初始化
    initQr() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.clearQrCodeTimer();
                const config = yield this.getConfig('wx');
                if (!config || !this.WxLogin) {
                    throw new Error('Config or WxLogin not available');
                }
                this.createWxLoginQrCode(config);
                // 设置过期定时器
                this.qrCodeTimer = setTimeout(() => this.showQrCodeExpired(), WechatAuth.QR_EXPIRED_TIME);
            }
            catch (error) {
                console.error('Error initializing QR code:', error);
                throw error;
            }
        });
    }
    // 简化二维码创建
    createWxLoginQrCode(config) {
        this.removeQrCodeExpired();
        const container = this.getContainer();
        if (!container)
            return;
        container.innerHTML = '';
        new this.WxLogin(Object.assign({ self_redirect: true, id: this.qrContainer, state: this.getTraceId() }, config));
    }
    // 优化过期提示显示
    showQrCodeExpired() {
        const container = this.getContainer();
        if (!container)
            return;
        container.innerHTML = '';
        this.qrCodeExpiredElement = Object.assign(document.createElement('img'), {
            src: this.qrcode_expired,
            alt: '二维码已过期',
            style: 'cursor: pointer',
            onclick: this.refreshQrCode // 直接绑定
        });
        container.appendChild(this.qrCodeExpiredElement);
    }
    clearQrCodeTimer() {
        if (this.qrCodeTimer) {
            clearTimeout(this.qrCodeTimer);
            this.qrCodeTimer = null;
        }
    }
    removeQrCodeExpired() {
        if (this.qrCodeExpiredElement) {
            this.qrCodeExpiredElement.onclick = null; // 移除事件
            this.qrCodeExpiredElement = null;
        }
    }
    destroy() {
        this.clearQrCodeTimer();
        this.removeQrCodeExpired();
    }
    // 优化 login 方法
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            // 等待 traceId 可用
            yield this.waitForTraceId();
            const traceId = this.getTraceId();
            if (!traceId) {
                throw new Error('TraceId not available');
            }
            const code = yield this.createConnet(traceId);
            return this.fetchUserInfo(code, 'wx');
        });
    }
    // 新增：等待 traceId 的辅助方法
    waitForTraceId() {
        return new Promise((resolve) => {
            const check = () => {
                if (this.getTraceId()) {
                    resolve();
                }
                else {
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    }
}
// 常量提取
WechatAuth.WX_LOGIN_SCRIPT = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js';
WechatAuth.QR_EXPIRED_TIME = 60000; // 60秒

class QQAuth extends BaseAuthService {
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            // 实现微信登录逻辑
        });
    }
    getUserInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            // 获取用户信息
        });
    }
}

class Authmate {
    static wechat(config) {
        return new WechatAuth(config);
    }
    static qq(config) {
        return new QQAuth(config);
    }
}

exports.Authmate = Authmate;
//# sourceMappingURL=index.cjs.js.map
