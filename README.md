# Palantiri

A soft fork of H0kkadio's broadcastify-feed-to-discord. Making significant adjustments to make the bot more generalizable and updated for Discord.js v12.

## Requirements

* Discord.js
* Request
* Cheerio
* Puppeteer
* Node-Opus
* Opusscript

## Installation

* Create a Discord Application: https://discordapp.com/developers/applications/ and get some fresh tokens
* Change "CHANNELID", "LOGCHANNELID", "ROLE" and "TOKEN" variables in scanner.js
* Install packages: ```npm install discord.js request cheerio puppeteer node-opus opusscript```
* Run it: ```node scanner.js```
