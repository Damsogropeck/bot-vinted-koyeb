const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('../../config/config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('recherche')
        .setDescription('Lancer une recherche personnalisée sur Vinted')
        .addStringOption(option =>
            option.setName('categorie').setDescription('ID de la catégorie Vinted').setRequired(true))
        .addChannelOption(option =>
            option.setName('canal').setDescription('Canal de notification').setRequired(true))
        .addStringOption(option =>
            option.setName('taille').setDescription('ID de la taille Vinted').setRequired(false))
        .addStringOption(option =>
            option.setName('marque').setDescription('ID de la marque Vinted').setRequired(false))
        .addIntegerOption(option =>
            option.setName('prix_max').setDescription('Prix max €').setRequired(false)),

    new SlashCommandBuilder()
        .setName('arreter')
        .setDescription('Arrêter une recherche active')
        .addStringOption(option =>
            option.setName('id').setDescription('ID de la recherche').setRequired(true)),

    new SlashCommandBuilder()
        .setName('abonnements')
        .setDescription('Voir tous les abonnements actifs')
].map(cmd => cmd.toJSON());

async function registerSlashCommands(clientId) {
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        await rest.put(Routes.applicationGuildCommands(clientId, config.guildID), { body: commands });
        console.log("✅ Commandes Slash enregistrées avec succès.");
    } catch (error) {
        console.error("❌ Erreur lors de l'enregistrement des commandes slash:", error);
    }
}

module.exports = { registerSlashCommands };
