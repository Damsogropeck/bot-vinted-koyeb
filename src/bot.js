// === src/bot.js ===
require("dotenv").config();
const keepAlive = require('./utils/keepAlive');
keepAlive(); // ⚠️ DOIT être appelé TOUT DE SUITE

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  adminIDs: [process.env.DISCORD_ADMIN_ID],
  guildID: process.env.DISCORD_GUILD_ID
};

const db = require("./db");
const client = require("./discord/client");
const { registerSlashCommands } = require("./discord/commands");
const { search } = require("./API");
const { sendVintedEmbed } = require("./discord/client");

let activeSubscriptions = {};
const MAX_PARALLEL_SUBSCRIPTIONS = 10;
let subscriptionQueue = [];

console.log("🚀 Lancement du bot Vinted...");

process.on("unhandledRejection", (reason, p) => {
  console.error("❌ PROMISE NON GÉRÉE :", reason);
});

client.login(config.token)
  .then(() => {
    console.log("✅ Connexion réussie à Discord !");
  })
  .catch((error) => {
    console.error("❌ Erreur de connexion à Discord :", error);
    // 🔒 Garde le container vivant même si login fail (évite arrêt immédiat Koyeb)
    setInterval(() => {}, 10000);
  });

client.on("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag} !`);
  registerSlashCommands(client.user.id);
  loadSubscriptions();
});

function loadSubscriptions() {
  const subscriptions = db.get("subscriptions") || [];
  subscriptions.forEach((sub) => enqueueSubscription(sub));
}

function enqueueSubscription(sub) {
  if (Object.keys(activeSubscriptions).length >= MAX_PARALLEL_SUBSCRIPTIONS) {
    console.log(`⏳ File d'attente : ${sub.id}`);
    subscriptionQueue.push(sub);
  } else {
    startSubscription(sub);
  }
}

function startSubscription(sub) {
  if (activeSubscriptions[sub.id]) return;

  const interval = 30000;
  console.log(`🔄 Démarrage de la surveillance pour : ${sub.url}`);

  activeSubscriptions[sub.id] = {
    interval: null,
    lastFirstItemId: null,
  };

  activeSubscriptions[sub.id].interval = setInterval(async () => {
    try {
      const results = await search(sub.url);
      if (!results || results.length === 0) return;

      const lastSeenId = activeSubscriptions[sub.id].lastFirstItemId;
      let newItems = [];

      if (!lastSeenId) {
        activeSubscriptions[sub.id].lastFirstItemId = results[0]?.id;
        return;
      } else {
        const indexLastSeen = results.findIndex((item) => item.id === lastSeenId);
        if (indexLastSeen > 0) {
          newItems = results.slice(0, indexLastSeen);
        } else if (indexLastSeen === -1) {
          newItems = results;
        }
      }

      for (const item of newItems.reverse()) {
        const channel = client.channels.cache.get(sub.channelId);
        if (!channel) continue;
        sendVintedEmbed(item, channel);
      }

      activeSubscriptions[sub.id].lastFirstItemId = results[0]?.id;
    } catch (error) {
      console.error(`❌ Scraping erreur ${sub.id}:`, error);
    }
  }, interval);
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "recherche") {
    const id = Date.now().toString();
    const url = `https://www.vinted.fr/vetements?catalog[]=${options.getString("categorie")}` +
      (options.getString("taille") ? `&size_id[]=${options.getString("taille")}` : '') +
      (options.getString("marque") ? `&brand_id[]=${options.getString("marque")}` : '') +
      (options.getInteger("prix_max") ? `&price_to=${options.getInteger("prix_max")}` : '') +
      `&order=newest_first&page=1`;

    const sub = {
      id,
      url,
      channelId: options.getChannel("canal").id,
      refresh: 45
    };

    const subscriptions = db.get("subscriptions") || [];
    subscriptions.push(sub);
    db.set("subscriptions", subscriptions);
    enqueueSubscription(sub);

    await interaction.reply({ content: `🔔 Abonnement ajouté !\n${url}`, flags: 64 });
  }

  if (commandName === "arreter") {
    const id = options.getString("id");
    const subscriptions = db.get("subscriptions") || [];
    const index = subscriptions.findIndex((s) => s.id === id);

    if (index !== -1) {
      clearInterval(activeSubscriptions[id]?.interval);
      delete activeSubscriptions[id];
      subscriptions.splice(index, 1);
      db.set("subscriptions", subscriptions);

      if (subscriptionQueue.length > 0) {
        const next = subscriptionQueue.shift();
        startSubscription(next);
      }

      await interaction.reply({ content: `🛑 Abonnement \`${id}\` arrêté.`, flags: 64 });
    } else {
      await interaction.reply({ content: `❌ Aucun abonnement trouvé avec l'ID \`${id}\`.`, flags: 64 });
    }
  }

  if (commandName === "abonnements") {
    const subscriptions = db.get("subscriptions") || [];
    if (subscriptions.length === 0) {
      await interaction.reply({ content: "📭 Aucun abonnement actif.", flags: 64 });
    } else {
      const msg = subscriptions.map((s) => `• ID: \`${s.id}\`\n→ ${s.url}`).join("\n\n");
      await interaction.reply({ content: `📋 Abonnements actifs :\n\n${msg}`, flags: 64 });
    }
  }
});
