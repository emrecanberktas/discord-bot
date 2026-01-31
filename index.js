const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const fs = require("fs");
require("dotenv").config();
const userSounds = JSON.parse(fs.readFileSync("./sound.json", "utf8"));
const defaultSound = "./verstappen.ogg";

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Basit bir health check endpoint
app.get('/', (req, res) => {
    res.send('Bot çalışıyor! 🤖');
});

app.listen(PORT, () => {
    console.log(`Web server ${PORT} portunda çalışıyor`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on("clientReady", () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);
});

client.on("voiceStateUpdate", (oldState, newState) => {
  if (!oldState.channel && newState.channel) {
    if (newState.member.user.bot) return;

    console.log(`${newState.member.user.tag} ses kanalına katıldı!`);

    const userId = newState.member.user.id;
    const userData = userSounds[userId];

    const soundFile = userData ? userData.sound : defaultSound;

    const connection = joinVoiceChannel({
      channelId: newState.channel.id,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(soundFile);

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("HATA: DISCORD_TOKEN .env dosyasında bulunamadı!");
  console.error("Lütfen .env dosyası oluşturun ve DISCORD_TOKEN değişkenini ekleyin.");
  process.exit(1);
}

client.login(token);
