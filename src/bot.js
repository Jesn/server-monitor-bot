import { Wechaty, config } from './src/node_modules/wechaty';
const qrTerm = require('qrcode-terminal');

const os = require('os');
var moment = require('moment-timezone');
// 默认设置为东八区
moment.tz.setDefault("Asia/Shanghai");

const schedule = require('./schedule/scheduleJob');

// 添加name属性防止掉线
const name = "wechaty-server-monitor-bot";
const bot = Wechaty.instance({ name });

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.on('message', onMessage);
bot.on('error', onError);
bot.start().catch(console.error)


function onScan(qrcode, status) {
    qrTerm.generate(qrcode, { small: true });
}

function onLogin(user) {
    console.log(`${user} login`)
    // 初始化定时任务
    timingTaskMain();
}

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

function onLogout(user) {
    console.log(`${user} logout`);
}

function onError(e) {
    console.error(e);
}

/**
 * 定时任务
 */
async function timingTaskMain() {
    // 每天的第30分钟执行
    schedule.setSchedule('* 30 * * * *', async () => {
        // 定时任务业务处理
        const filehelper = bot.Contact.load('filehelper');
        let computer_ifno = computerMsg();
        await filehelper.say(JSON.stringify(computer_ifno));
    });
}


/**
 * 获取电脑系统信息
 */
function computerMsg() {
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
                name: nw,
                address: obj.address,
                mac: obj.mac,
                agreement: obj.family
            });
        });
    }
    computerInfo.network = network;

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


