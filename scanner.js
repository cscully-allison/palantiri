// DEFAULT SETTING
var defaultstream = {
    name: null,
    stream: null
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
    console.log(`Logged in as ${client.user.tag}`);
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

function browsercheck(topstreamname, topstreamlink, channel) {
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
        update(getlink, topstreamname, channel);
        await browser.close();
        console.log("Browser closed.")
    })();
};

// UPDATE CURRENT STREAM
function update(streamlink, streamname, channel) {
    console.log('Updating stream.')
    changeto = {
        name: streamname,
        stream: streamlink
    }
    currentstream = changeto
    // defaultstream = currentstream
    console.log(changeto)
    channel.leave()
    
    //timeout before reconnection
    setTimeout(()=>{
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
        }, 2000)
}


prefix = ".ps"
client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.split(' ');
    const pfx = args.shift();
    const command = args.shift().toLowerCase();

    console.log(message.guild.channels.cache.find(c => c.name == args[0]));

    if(command == 'c' || command == "configure"){
      //add later  
    }
    //goto specific channel
    if(command == 'j' || command == 'join'){
        var channel = message.guild.channels.cache.find(c => c.name == args[0]);
        if(!channel){
            //throw error
            message.channel.send("Voice channel \"" + args[0] + "\" cannot be found on this discord server. Please check your spelling and try again.")
            return;
        }
        if(defaultstream.stream != null){
            message.channel.send("Joining \"" + args[0] + "\" and connecting to " + currentstream.stream);
            browsercheck(defaultstream.name, defaultstream.stream, channel);
        } else if (args[1]){
            message.channel.send("Joining \"" + args[0] + "\" and connecting to " + args[1]);
            browsercheck(defaultstream.name, args[1]+'/web', channel);
        } else {
            message.channel.send("Joining \"" + args[0] + "\". To connect to a broadcast, type: .ps cb <followed by the url of a broadcastify stream>.");
            channel.join();
        }
        scannerchannel = args[0];
    }
    //change to an arbitrary broadcastify channel
    else if(command == 'cb' || command == 'change'){
        console.log("Change stream channel.")
        if(args.length < 1){
            message.channel.send("To change the channel please type: .ps cc <broadcastify-url>");
        }
        else if (message.member.roles.cache.find(r => r.name == "Member")) {
            console.log('Changing channel')
            let channel = message.guild.channels.cache.find(c => c.name == scannerchannel);
            message.channel.send("Changing stream feed to " + args[0])
            browsercheck("Unnamed Channel", args[0]+'/web', channel);
        }
    }

    //Reset back to RPD
    else if(command == 'reset'){
        if (message.member.roles.cache.find(r => r.name == "Member")) {
            console.log('Changing channel')
            let channel = message.guild.channels.cache.find(c => c.name == scannerchannel);
            message.channel.send("Changing channel back to default.")
            currentstream = "";
            channel.leave();
            channel.join();
            browsercheck(defaultstream.name, defaultstream.stream);
        }
    }

    else{
        message.channel.send("You have entered an invalid command. Please type \".ps help\" to get a full list of commands.")
    }

    //todo: add help
});

client.login(process.env.BOT_TOKEN);
