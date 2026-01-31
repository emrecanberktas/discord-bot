const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const fs = require("fs");
const userSounds = JSON.parse(fs.readFileSync("./sound.json", "utf8"));

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

client.login(
  "MTQ2NzE0Mjc1MTcyNzY1MzA3NA.GgZ7Tx.Qbg81eTSPorKa3tn7lZaTsJEdJrQQinllnR1n4"
);
