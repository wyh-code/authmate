import WxAuth from './WxAuth'

import {
  ICreateAuthmateProps
} from './type';


class Authmate {
  instance: any;

  constructor(props: ICreateAuthmateProps){
    if(props.type === 'wx') {
      this.instance = new WxAuth(props)
    }
  }

  login (){
    return this.instance.login();
  }
}

const createAuthmate = (props: ICreateAuthmateProps) => {
  if(!props.uid) {
    console.error('uid缺失！请先登录【www.authmate.cn】获取uid！')
    return;
  }
  if(!props.container) {
    console.error('container 缺失！')
    return;
  }
  if(!props.appid) {
    console.error('appid 缺失！')
    return;
  }

  if(!document.getElementById(props.container)) {
    console.error('container 获取不到，请填写正确的 id！')
    return;
  }

  props.type = props.type || 'wx';

  props.state = props.state || `authmate:${props.uid}_${props.appid}_${+new Date}`;
  return new Authmate(props);
}

export default createAuthmate;