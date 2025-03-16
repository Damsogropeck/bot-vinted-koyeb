// === src/bot.js ===
require("dotenv").config();
require("./utils/proxy");

// Utilisation directe des variables d'environnement sans passer par config.json
const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  adminIDs: [process.env.DISCORD_ADMIN_ID],
  guildID: process.env.DISCORD_GUILD_ID
};

const db = require("./db");
const client = require("./discord/client");
const { registerSlashCommands } = require("./discord/commands");
const keepAlive = require("./utils/keepAlive");
const { search } = require("./API");
const { sendVintedEmbed } = require("./discord/client");

keepAlive();

let activeSubscriptions = {};
const MAX_PARALLEL_SUBSCRIPTIONS = 10;
let subscriptionQueue = [];

console.log("🚀 Lancement du bot Vinted...");

process.on("unhandledRejection", (reason, p) => {
  console.error("❌ PROMISE NON GÉRÉE :", reason);
});

client
  .login(config.token)
  .then(() => console.log("✅ Connexion réussie à Discord !"))
  .catch((error) => console.error("❌ Erreur de connexion à Discord :", error));

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
      console.log(`✅ ${results.length} articles détectés.`);

      if (!results || results.length === 0) return;

      const lastSeenId = activeSubscriptions[sub.id].lastFirstItemId;
      let newItems = [];

      if (!lastSeenId) {
        activeSubscriptions[sub.id].lastFirstItemId = results[0]?.id;
        console.log("🛠 Première exécution - aucun article envoyé.");
        return;
      } else {
        const indexLastSeen = results.findIndex((item) => item.id === lastSeenId);
        if (indexLastSeen > 0) {
          newItems = results.slice(0, indexLastSeen);
        } else if (indexLastSeen === -1) {
          newItems = results;
        }
      }

      if (newItems.length === 0) {
        console.log("ℹ Aucun nouvel article à envoyer.");
        return;
      }

      for (const item of newItems.reverse()) {
        const channel = client.channels.cache.get(sub.channelId);
        if (!channel) continue;

        const product = {
          title: item.title || "Article",
          brand: item.brand || null,
          price: item.price || null,
          condition: item.condition || null,
          size: item.size || null,
          image: item.image || null,
          url: item.url || null,
        };

        console.log(`📦 Envoi de l'article : ${item.id}`);
        sendVintedEmbed(product, channel);
      }

      activeSubscriptions[sub.id].lastFirstItemId = results[0]?.id;
      console.log("🛠 Nouveau lastFirstItemId : " + activeSubscriptions[sub.id].lastFirstItemId);
    } catch (error) {
      console.error(`❌ Scraping erreur ${sub.id}:`, error);
    }
  }, interval);
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "recherche") {
    const categorie = options.getString("categorie");
    const canal = options.getChannel("canal");
    const taille = options.getString("taille");
    const marque = options.getString("marque");
    const prix_max = options.getInteger("prix_max");

    const id = Date.now().toString();
    const url = `https://www.vinted.fr/vetements?catalog[]=${categorie}` +
      (taille ? `&size_id[]=${taille}` : "") +
      (marque ? `&brand_id[]=${marque}` : "") +
      (prix_max ? `&price_to=${prix_max}` : "") +
      `&order=newest_first&page=1`;

    const sub = {
      id,
      url,
      channelId: canal.id,
      refresh: 45,
    };

    const subscriptions = db.get("subscriptions");
    subscriptions.push(sub);
    db.set("subscriptions", subscriptions);
    enqueueSubscription(sub);

    try {
      await interaction.reply({ content: `🔔 Abonnement ajouté !\n${url}`, flags: 64 });
    } catch (err) {
      console.error("❌ Erreur Discord (recherche):", err);
    }
  } else if (commandName === "arreter") {
    const id = options.getString("id");
    const subscriptions = db.get("subscriptions");
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

      try {
        await interaction.reply({ content: `🛑 Abonnement \`${id}\` arrêté.`, flags: 64 });
      } catch (err) {
        console.error("❌ Discord erreur (arreter):", err);
      }
    } else {
      await interaction.reply({ content: `❌ Aucun abonnement trouvé avec l'ID \`${id}\`.`, flags: 64 });
    }
  } else if (commandName === "abonnements") {
    const subscriptions = db.get("subscriptions");
    if (subscriptions.length === 0) {
      await interaction.reply({ content: "📭 Aucun abonnement actif.", flags: 64 });
    } else {
      const msg = subscriptions.map((s) => `• ID: \`${s.id}\`\n→ ${s.url}`).join("\n\n");
      await interaction.reply({ content: `📋 Abonnements actifs :\n\n${msg}`, flags: 64 });
    }
  }
});
