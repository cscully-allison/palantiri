// DEFAULT SETTING
var defaultstream = {
    name: "Reno and Sparks Police and Fire Live Audio Feed",
    stream: "https://www.broadcastify.com/listen/feed/7364/web"
}

// REQUIRE WHATS NEEDE
require("dotenv").config();
const Discord = require('discord.js');
const client = new Discord.Client();
const {
    RichEmbed
} = require('discord.js');
var request = require("request");
var cheerio = require('cheerio');
var puppeteer = require('puppeteer');

// SET CHANNELS
var scannerchannel = "a_scanner_darkly"
var textchannel = "debug"

// SET VARIABLES
var currentstream = defaultstream
var changeto

var top = 2 // # OF FEED FROM TOP OF THE PAGE

// START
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)

    // client.channels.cache.find(c => c.name == textchannel).send('Police Scanner reboot sucsessful.\n`' + new Date() + '`');
    // let channel = client.channels.cache.find(c => c.name == scannerchannel);
    // client.user.setActivity(currentstream.name, {
    //     type: "LISTENING",
    //     url: currentstream.name
    // })
    // console.log('Init.');
    // browsercheck(defaultstream.name, defaultstream.stream);
    // // checktop();
    // // setInterval(checktop, 1200000); // CHECK FREQUENCY
});


// GET TOP STREAM
function checktop() {
    console.log('Check Started.')
    request({
        uri: "https://www.broadcastify.com/listen/top",
    }, function (error, response, html) {
        var C$ = cheerio.load(html);
        topstreamname = (C$('.w100 a').eq(top+2).text()); // GET STREAM NAME
        topstreamlink = 'https://www.broadcastify.com' + (C$('.w100 a').eq(top+2).attr('href')) + '/web'; // GET STREAM LINK
        console.log(topstreamname)
        console.log("Current stream: " + currentstream.name)
        if ((topstreamname) && (topstreamlink)) {
            console.log("Got TOP stream name and link.")
            console.log("TOP stream: " + topstreamname)
            if (topstreamname !== currentstream.name) {
                console.log("New TOP stream found, updating.")
                browsercheck(topstreamname, topstreamlink)
            }
        }
    })
};

function browsercheck(topstreamname, topstreamlink) {
    console.log("Browser check started.");
    console.log("Topstreamname: ", topstreamname);
    console.log("topstreamlink: ", topstreamlink);
    (async () => {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(topstreamlink);
        console.log("URL opened.")
        var getlink = await page.evaluate(() => {
            var audioelement = document.getElementsByTagName('audio')[0].src;
            console.log("Audio element found, direct stream link: " + audioelement)
            return audioelement;
        });
        update(getlink, topstreamname);
        await browser.close();
        console.log("Browser closed.")
    })();
};

// UPDATE CURRENT STREAM
function update(streamlink, streamname) {
    console.log('Updating stream.')
    let channel = client.channels.cache.find(c => c.name == scannerchannel);
    changeto = {
        name: streamname,
        stream: streamlink
    }
    currentstream = changeto
    // defaultstream = currentstream
    channel.leave()
    channel.join()
        .then(connection => {
            console.log('Connected to ' + scannerchannel)
            console.log("Current stream: " + currentstream.stream)
            connection.play(currentstream.stream)
            client.user.setActivity(currentstream.name, {
                type: "LISTENING",
                url: streamlink
            })
        })
}


prefix = ".ps"
client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.split(' ');
    const pfx = args.shift();
    const command = args.shift().toLowerCase();

    console.log("Command and args", command, args);

    //goto specific channel
    if(command == 'm'){
        console.log("Move to " + args[0])
        let channel = client.channels.cache.find(c => c.name == scannerchannel);
        channel.leave()
        channel = client.channels.cache.find(c => c.name == args[0]);
        if(!channel){
            //throw error
            return;
        }
        console.log(channel);
        channel.leave()
        channel.join();

        scannerchannel = args[0];
    }

    //change to an arbitrary broadcastify channel
    else if(command == 'cc'){
        console.log("Change stream channel.")
        if(args.length < 1){
            message.channel.send("To change the channel please type: .ps cc <broadcastify-url>");
        }
        else if (message.member.roles.cache.find(r => r.name == "Member")) {
            console.log('Changing channel')
            let channel = client.channels.cache.find(c => c.name == scannerchannel);
            message.channel.send("Changing channel to " + args[0])
            // currentstream = "";
            // channel.leave();
            // channel.join();
            browsercheck("Unnamed Channel", args[0]+'/web');
        }
    }

    //Reset back to RPD
    else if(command == 'reset'){
        if (message.member.roles.cache.find(r => r.name == "Member")) {
            console.log('Changing channel')
            let channel = client.channels.cache.find(c => c.name == scannerchannel);
            message.channel.send("Changing channel back to default.")
            currentstream = "";
            channel.leave();
            channel.join();
            browsercheck(defaultstream.name, defaultstream.stream);
        }
    }

    //todo: add help
});

client.login(TOKEN);
