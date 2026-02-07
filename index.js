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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

let userSounds = {};
let defaultSound = "./verstappen.ogg";

const groups = {
  "tam-kadro": {
    members: [
      "253959974076678146", 
      "235819452397125633", 
      "247063627310301184", 
      "236191122848743427", 
      "237286349252591617"  
    ],
    sound: "./tam-kadro.mp3",
    priority: 1 
  },
  "borasız-kadro": {
    members: [
      "253959974076678146", 
      "235819452397125633", 
      "247063627310301184",  
      "236191122848743427", 
    ],
    sound: "./trio.mp3",
    priority: 2
  }
};

try {
  if (fs.existsSync("./sound.json")) {
    userSounds = JSON.parse(fs.readFileSync("./sound.json", "utf8"));
    console.log("✅ sound.json yüklendi");
  }
} catch (error) {
  console.error("❌ sound.json hatası:", error);
}



function checkGroups(channel) {
  const membersInChannel = channel.members.map(member => member.user.id);
  const matchedGroups = [];
  
  for (const [groupName, groupData] of Object.entries(groups)) {
    const allPresent = groupData.members.every(id => membersInChannel.includes(id));
    if (allPresent) {
      console.log(`🎊 "${groupName}" grubu tam kadro!`);
      matchedGroups.push({
        name: groupName,
        sound: groupData.sound,
        priority: groupData.priority
      });
    }
  }
  
  if (matchedGroups.length > 0) {
    matchedGroups.sort((a, b) => a.priority - b.priority);
    console.log(`✅ En yüksek öncelikli grup: "${matchedGroups[0].name}"`);
    return matchedGroups[0];
  }
  
  return null;
}

client.on("voiceStateUpdate", (oldState, newState) => {
  console.log("🔔 voiceStateUpdate eventi tetiklendi");
  
  if (!oldState.channel && newState.channel) {
    if (newState.member.user.bot) {
      console.log("⚠️ Bot kanala girdi, atlanıyor");
      return;
    }

    const userId = newState.member.user.id;
    console.log(`🎤 ${newState.member.user.tag} (${userId}) kanala katıldı!`);

    let soundFile;
    let isGroupSound = false;
    
    const matchedGroup = checkGroups(newState.channel);
    
    if (matchedGroup) {
      soundFile = matchedGroup.sound;
      isGroupSound = true;
      console.log(`🎊 GRUP SESİ ÇALINIYOR: ${matchedGroup.name}`);
    } else {
      const userData = userSounds[userId];
      soundFile = userData ? userData.sound : defaultSound;
      console.log(`👤 Bireysel ses çalınıyor`);
    }

    console.log(`🔊 Çalınacak ses: ${soundFile}`);

    if (!fs.existsSync(soundFile)) {
      console.error(`❌ Ses dosyası bulunamadı: ${soundFile}`);
      if (isGroupSound) {
        const userData = userSounds[userId];
        soundFile = userData ? userData.sound : defaultSound;
        if (fs.existsSync(soundFile)) {
          console.log(`⚠️ Grup sesi bulunamadı, bireysel ses çalınıyor: ${soundFile}`);
        } else {
          return;
        }
      } else {
        return;
      }
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