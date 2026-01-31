const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const fs = require("fs");
require("dotenv").config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot çalışıyor! 🤖');
});

app.listen(PORT, () => {
    console.log(`✅ Web server ${PORT} portunda çalışıyor`);
});

console.log("📦 Discord.js yükleniyor...");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
console.log("✅ Client oluşturuldu");

// Ses dosyalarını yükle
let userSounds = {};
let defaultSound = "./verstappen.ogg";

try {
  if (fs.existsSync("./sound.json")) {
    userSounds = JSON.parse(fs.readFileSync("./sound.json", "utf8"));
    console.log("✅ sound.json yüklendi");
  }
} catch (error) {
  console.error("❌ sound.json hatası:", error);
}

client.on("clientReady", () => {
  console.log("🎉🎉🎉 BOT HAZIR 🎉🎉🎉");
  console.log(`✅ Bot kullanıcı adı: ${client.user.tag}`);
  console.log(`📊 Sunucu sayısı: ${client.guilds.cache.size}`);
  console.log(`👥 Toplam kullanıcı: ${client.users.cache.size}`);
});

client.on("voiceStateUpdate", (oldState, newState) => {
  console.log("🔔 voiceStateUpdate eventi tetiklendi");
  
  if (!oldState.channel && newState.channel) {
    if (newState.member.user.bot) {
      console.log("⚠️ Bot kanala girdi, atlanıyor");
      return;
    }

    const userId = newState.member.user.id;
    console.log(`🎤 ${newState.member.user.tag} (${userId}) kanala katıldı!`);

    const userData = userSounds[userId];
    const soundFile = userData ? userData.sound : defaultSound;

    console.log(`🔊 Çalınacak ses: ${soundFile}`);

    if (!fs.existsSync(soundFile)) {
      console.error(`❌ Ses dosyası bulunamadı: ${soundFile}`);
      return;
    }

    try {
      console.log("🔗 Ses kanalına bağlanılıyor...");
      const connection = joinVoiceChannel({
        channelId: newState.channel.id,
        guildId: newState.guild.id,
        adapterCreator: newState.guild.voiceAdapterCreator,
      });
      console.log("✅ Kanala bağlandı");

      const player = createAudioPlayer();
      const resource = createAudioResource(soundFile);

      player.play(resource);
      connection.subscribe(player);
      console.log("▶️ Ses çalıyor...");

      player.on(AudioPlayerStatus.Idle, () => {
        console.log("✅ Ses tamamlandı, ayrılıyor");
        connection.destroy();
      });

      player.on("error", error => {
        console.error("❌ Player hatası:", error);
        connection.destroy();
      });

    } catch (error) {
      console.error("❌ Ses çalma hatası:", error);
    }
  }
});

client.on("error", error => {
  console.error("❌ Client hatası:", error);
});

client.on("warn", info => {
  console.warn("⚠️ Client uyarısı:", info);
});

process.on("unhandledRejection", error => {
  console.error("❌ Yakalanmamış hata:", error);
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN environment variable bulunamadı!");
  console.log("Mevcut env variables:", Object.keys(process.env));
  process.exit(1);
}

console.log("✅ Token bulundu");
console.log("🔑 Token uzunluğu:", token.length, "karakter");
console.log("🔐 Token başlangıcı:", token.substring(0, 15) + "...");

console.log("🔄 Discord'a login yapılıyor...");
client.login(token)
  .then(() => console.log("✅ Login işlemi başlatıldı, clientReady eventi bekleniyor..."))
  .catch(err => {
    console.error("❌❌❌ LOGIN HATASI ❌❌❌");
    console.error(err);
    process.exit(1);
  });