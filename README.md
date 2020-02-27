---
title: 服务器监控小助手
author: Darren
date: '2020-02-25 09:30:52 +0800'
categories: project
tags:
  - open source
  - bot
---

> Author: [Darren](https://github.com/Jesn/), A DevOps fan.

# 服务器监控小助手

<a name="tstmE"></a>
## 前言
由于服务器上挂的东西比较多，特别是爬虫的一些项目很消耗服务器性能，导致经常会出现雪崩的情况<最主要是服务器渣>，针对服务器监控通知之前是通过邮件通知的，邮件非常不及时，接触到wechaty后我就想通过微信的方式实时把监控信息发送到服务器管理人员的微信上或者给小助手发送发送指定关键字则实时接收到服务器信息。<br />
<a name="ZAA03"></a>
## 项目介绍
本项目是打算作为一个长期开源项目来慢慢维护，一期只是简单记录服务器中CPU消耗、网络信息、磁盘信息等简单的数据，并通过小助手发送给对应的人，二期将加入更多的服务器监控的信息，并且把监控数据进行数据库存储，页面展示统计数据，通过配置文件可以设置阈值，超过阈值的数据将每隔2分钟推送一次给用户，用户返回指定命令后将停止推送警告信息。<br />本项目前期采用NodeJS和Wechaty进行开发的一套简单的服务器监控工具，可定时发送服务器资源数据给用户。

<a name="VG6CH"></a>
## 项目地址
github： [https://github.com/Jesn/server-monitor-bot](https://github.com/Jesn/server-monitor-bot)

<a name="Ma2Xd"></a>
## 预览效果

- JSON格式数据

![image.png](https://cdn.nlark.com/yuque/0/2020/png/247957/1582471659515-e1fe1268-bd19-4e49-ae22-5e7ef579c010.png?x-oss-process=image/resize,w_343)

- 美化后格式

![image.png](https://cdn.nlark.com/yuque/0/2020/png/247957/1582511063614-a96c2b13-3f7f-4685-b61d-11c79c71a44c.png#align=left&display=inline&height=824&name=image.png&originHeight=824&originWidth=378&size=43025&status=done&style=none&width=378)

- 给小助手发送comput_info消息、接收服务器信息

![image.png](https://cdn.nlark.com/yuque/0/2020/png/247957/1582621870777-dec09f37-41fa-41af-80de-168aabc63be2.png#align=left&display=inline&height=407&name=image.png&originHeight=508&originWidth=553&size=37298&status=done&style=none&width=443)<br />后续可以直接做成一个模板格式的，直接对模板里面填充数据，样式会更加美观些，前期先就这样排版下

<a name="KZSai"></a>
## 代码讲解
<a name="b4DzC"></a>
### 一、wechaty初始化

```javascript
import { Wechaty, config } from 'wechaty';

# 添加name属性防止掉线
const name = "wechaty-server-monitor-bot";
const bot = Wechaty.instance({ name });

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.on('message', onMessage);
bot.on('error', onError);
bot.start().catch(console.error);

function onScan(qrcode, status) {
    qrTerm.generate(qrcode, { small: true })  // show qrcode on console
}


function onLogin(user) {
    console.log(`${user} login`)

    initDay();
}
function onMessage(msg){
    console.log(msg);
};

function onLogout(user) {
    console.log(`${user} logout`)
}

function onError(e) {
    console.error(e)
}
```

<a name="TzYOT"></a>
### 二、添加定时任务框架

- 安装 `node-schedule` 包 `npm install node-schedule --save`
- 新增一个 `scheduleJob.js` 文件，作为定时任务启动的主页面

```javascript
const schedule = require('node-schedule')
// date 参数

//其他规则见 https://www.npmjs.com/package/node-schedule
// 规则参数讲解    *代表通配符
//
// *  *  *  *  *  *
// ┬ ┬ ┬ ┬ ┬ ┬
// │ │ │ │ │  |
// │ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
// │ │ │ │ └───── month (1 - 12)
// │ │ │ └────────── day of month (1 - 31)
// │ │ └─────────────── hour (0 - 23)
// │ └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)

// 每分钟的第30秒触发： '30 * * * * *'
//
// 每小时的1分30秒触发 ：'30 1 * * * *'
//
// 每天的凌晨1点1分30秒触发 ：'30 1 1 * * *'
//
// 每月的1日1点1分30秒触发 ：'30 1 1 1 * *'
//
// 每周1的1点1分30秒触发 ：'30 1 1 * * 1'

function setSchedule(date,callback) {
  schedule.scheduleJob(date, callback)
}
module.exports = {
  setSchedule
}
```

- cron 表达式如果不会，可以通过在线Cron表达式生成器直接生成 [http://cron.qqe2.com/](http://cron.qqe2.com/)

<a name="z49mN"></a>
### 三、配置定时任务

- 在wechaty扫码登完成，登陆成功后即可触发定时任务，即可配置在Login里面

```javascript
# 添加scheduleJob.js 启动文件
const schedule = require('./scheduleJob');

# 定义一个定时任务启动入口，所有定时任务都可以放在里面
/**
 * 定时任务
 */
async function timingTaskMain() {
    // 5分钟执行一次
    schedule.setSchedule('0 0/5 * * * ?', async () => {
    //   TODO 定时任务业务处理
    });
}

# 在wechaty 登陆成功后触发定时任务
function onLogin(user) {
    console.log(`${user} login`)

    timingTaskMain();
}
```

<a name="omvhp"></a>
### 四、获取服务器资源信息
<a name="8tOa2"></a>
#### 4.1、添加 os、diskinfo包

```json
npm install os  --save
npm install diskinfo --save
```

<a name="atlHg"></a>
#### 4.2、获取服务器信息

```javascript
/**
 * 获取电脑系统信息
 */
function Computer() {
    var dealTime = (seconds) => {
        var seconds = seconds | 0;
        var day = (seconds / (3600 * 24)) | 0;
        var hours = ((seconds - day * 3600) / 3600) | 0;
        var minutes = ((seconds - day * 3600 * 24 - hours * 3600) / 60) | 0;
        var second = seconds % 60;
        (day < 10) && (day = '0' + day);
        (hours < 10) && (hours = '0' + hours);
        (minutes < 10) && (minutes = '0' + minutes);
        (second < 10) && (second = '0' + second);
        return [day, hours, minutes, second].join(':');
    };

    var dealMem = (mem) => {
        var G = 0,
            M = 0,
            KB = 0;
        (mem > (1 << 30)) && (G = (mem / (1 << 30)).toFixed(2));
        (mem > (1 << 20)) && (mem < (1 << 30)) && (M = (mem / (1 << 20)).toFixed(2));
        (mem > (1 << 10)) && (mem > (1 << 20)) && (KB = (mem / (1 << 10)).toFixed(2));
        return G > 0 ? G + 'G' : M > 0 ? M + 'M' : KB > 0 ? KB + 'KB' : mem + 'B';
    };

    var computerInfo = {};

    //cpu架构
    computerInfo.cpu_arch = os.arch();

    //操作系统内核
    computerInfo.kernel = os.type();

    //操作系统平台
    computerInfo.platform = os.platform();

    //系统开机时间
    const uptime = os.uptime();
    computerInfo.boot_up_time = dealTime(uptime);

    //主机名
    computerInfo.host_name = os.hostname();

    //主目录
    computerInfo.home_path = os.homedir();

    //内存
    // 内存总大小
    computerInfo.total_memory = dealMem(os.totalmem());
    // 空闲内存
    computerInfo.free_memory = dealMem(os.freemem());

    //cpu
    const cpus = os.cpus();
    var cpuInfo = [];
    cpus.forEach((cpu, idx, arr) => {
        var times = cpu.times;
        cpuInfo.push(
            {
                model: cpu.model,
                speed: `${cpu.speed}MHz`,
                used_rate: `${((1 - times.idle / (times.idle + times.user + times.nice + times.sys + times.irq)) * 100).toFixed(2)}%`
            });
    });
    computerInfo.cpu_info = cpuInfo;

    //网卡
    const networksObj = os.networkInterfaces();
    var network = [];
    for (let nw in networksObj) {
        let objArr = networksObj[nw];
        objArr.forEach((obj, idx, arr) => {
            network.push({
                address: obj.address,
                mac: obj.mac,
                agreement: obj.family
            });
        });
    }
    computerInfo.network = network;

    return computerInfo;
}
```

<a name="zYEVx"></a>
#### 4.3、定时获取服务器资源并发送

```javascript
 /*
 * 定时任务
 */
async function timingTaskMain() {
    // 5分钟执行一次
    schedule.setSchedule('0 0/5 * * * ?', async () => {
    //   TODO 定时任务业务处理
    const filehelper = bot.Contact.load('filehelper');
    await filehelper.say(JSON.stringify(computer));
    });
}
```

<a name="PXqXs"></a>
### 五、美化输出格式

```javascript
    // CPU 详情
    let cpuDetailMsg = '';
    for (let index = 0; index < computerInfo.cpu_info.length; index++) {
        // CPU只获取型号部分信息
        const element = computerInfo.cpu_info[index];
        let model = element.model.match(/CPU  (\S*)  @/)[1];

        cpuDetailMsg +=
        `   
        CPU${index} :
        型号: ${model}
        频率: ${element.speed}
        使用率: ${element.used_rate}
        `;
    }

    // 网络详情
    let networkDetailMsg = '';
    for (let index = 0; index < computerInfo.network.length; index++) {
        const element = computerInfo.network[index];
        if (element.name == 'lo') {
            continue;
        }
        networkDetailMsg +=
        `   
        ${element.name} :
        地址: ${element.address}
        mac: ${element.mac}
        协议: ${element.agreement}
        `;

    }

    var msg =
        `
北京时间: ${moment().format("YYYY-MM-DD HH:mm:ss")}

操作系统: ${computerInfo.kernel} 
CPU架构 : ${computerInfo.cpu_arch}
平台信息: ${computerInfo.platform}
开机时间: ${computerInfo.boot_up_time}
主机名称: ${computerInfo.host_name}
内存大小: ${computerInfo.total_memory}
空闲内存: ${computerInfo.free_memory}
CPU核数 : ${computerInfo.cpu_info.length} 核
CPU详情 : ${cpuDetailMsg}
网络详情: ${networkDetailMsg}
`;
    return msg;
}
```

<a name="pfKYW"></a>
### 六、关键字触发

```javascript
function onMessage(msg) {
    console.log(msg);
    let contact = msg.from();

    // 如果发送的内容为computer关键字，则返回对应服务器的信息
    if (msg.type() == bot.Message.Type.Text) {
        console.log(`${contact.name()}发送了:${msg.text()}`);

        if (msg.text() == "computer") {
            let computer_msg = computerMsg();
            await msg.say(computer_msg);
        }
    }
}

```

<a name="9EtUD"></a>
## 代码部署

- docker部署

```sh
# docker部署，进入到src目录下执行
docker run --name=monitor-bot  -e WECHATY_PUPPET="wechaty-puppet-padplus" -e  WECHATY_PUPPET_PADPLUS_TOKEN="你的token"  --volume="$(pwd)":/bot   zixia/wechaty:latest bot.js
```

<a name="iNWIv"></a>
## 常见问题汇总

- node版本是否大于10
- wechaty、wechaty-puppet-padpro 这些包安装失败，经常卡在环境配置上，建议使用docker配置
- 如果padplus每天存在掉线问题：

    **1.** 先检查padplus版本，若版本低于0.3.0请更新。<br />
    **2.** 检查是否指定了name属性。<br />
    **3.** 观察掉线设备号，看看是否有发生变化，可以通过退出后再次登录，反复两到三次来观察。

- 如何申请token？ --->通过填写句子互动wechaty token申请表 [https://juzibot.wjx.cn/jq/55789515.aspx](https://juzibot.wjx.cn/jq/55789515.aspx)
- docker如果出现grpc网关超时，可以尝试重启docker服务,注意不是重启容器
- 使用wechaty如何防止被封号，操作尽量拟人化

