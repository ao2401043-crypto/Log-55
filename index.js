const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

// تحميل الكوماندات
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// إيفنت أوامر السلاش
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "❌ صار خطأ!", ephemeral: true });
  }
});

// =======================
// الأحداث (مثال: حذف رسالة)
// =======================
const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");
const { Database } = require("st.db");
const db = new Database("./Json-db/logChannels.json");

async function generateMessageImage(author, content) {
  const canvas = Canvas.createCanvas(800, 150);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#36393f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const avatar = await Canvas.loadImage(author.displayAvatarURL({ extension: "png" }));
  ctx.drawImage(avatar, 20, 20, 50, 50);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial";
  ctx.fillText(author.tag, 80, 40);

  ctx.fillStyle = "#dcddde";
  ctx.font = "16px Arial";
  ctx.fillText(content || "لا يوجد نص.", 80, 70);

  return new AttachmentBuilder(canvas.toBuffer(), { name: "message.png" });
}

client.on("messageDelete", async (message) => {
  if (message.partial || !message.author || message.author.bot) return;

  const logChannelId = db.get(`log_${message.guild.id}`);
  if (!logChannelId) return;
  const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null);
  if (!logChannel) return;

  const attachment = await generateMessageImage(message.author, message.content);

  const embed = new EmbedBuilder()
    .setTitle("🗑️ MESSAGE DELETED")
    .setDescription(`
👤 **العضو:** ${message.author}
🕒 **تاريخ الإرسال:** <t:${Math.floor(message.createdTimestamp / 1000)}:F>
🗑️ **تاريخ الحذف:** <t:${Math.floor(Date.now() / 1000)}:F>
📝 **المحتوى:** ${message.content || "رسالة بدون نص"}
    `)
    .setColor(0xFF0000)
    .setImage("attachment://message.png")
    .setTimestamp();

  await logChannel.send({ embeds: [embed], files: [attachment] });
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
