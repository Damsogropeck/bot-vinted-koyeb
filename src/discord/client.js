// === src/discord/client.js ===
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

function sendVintedEmbed(product, channel) {
    const title = product.title || "Article Vinted";
    const url = product.url || "https://www.vinted.fr/";

    const descriptionParts = [
        `💶 **Prix :** ${product.price || "Non précisé"}`,
        `🧵 **État :** ${product.condition || "Non précisé"}`,
        `📏 **Taille :** ${product.size || "Non précisée"}`,
        `🏷 **Marque :** ${product.brand || "Non précisée"}`
    ];

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setURL(url)
        .setDescription(descriptionParts.join('\n'))
        .setColor(0x00bfa5)
        .setFooter({ text: "🛍️ Produit trouvé sur Vinted" });

    if (product.image) {
        embed.setImage(product.image);
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("🔗 Voir le produit")
            .setStyle(ButtonStyle.Link)
            .setURL(url)
    );

    channel.send({ embeds: [embed], components: [row] })
        .then(() => console.log(`✅ Embed Vinted envoyé avec succès pour l'article ${product.title}`))
        .catch(err => console.error("❌ Erreur lors de l'envoi de l'embed :", err));
}

module.exports = client;
module.exports.sendVintedEmbed = sendVintedEmbed;
