const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { Database } = require("st.db");
const db = new Database("./Json-db/logChannels.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-logs")
    .setDescription("تحديد روم اللوق")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("اختار روم اللوق")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    db.set(`log_${interaction.guild.id}`, channel.id);
    await interaction.reply(`✅ تم تحديد روم اللوق: ${channel}`);
  }
};
