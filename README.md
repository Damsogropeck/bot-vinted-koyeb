# Bot Vinted - Déploiement Koyeb

## 🚀 Déploiement rapide sur Koyeb

1. Poussez ce projet sur votre dépôt GitHub.
2. Allez sur https://app.koyeb.com > Create App.
3. Connectez votre dépôt GitHub.
4. Koyeb détectera automatiquement le `Dockerfile`.
5. Le service sera déployé automatiquement.

## 📁 Fichiers importants

- `Dockerfile` : prépare le projet pour l'exécution Node.js + Chromium (Puppeteer).
- `koyeb.yaml` : configuration optionnelle Koyeb pour déploiement GitHub automatisé.
- `index.js` : votre fichier principal (modifiez selon le nom réel de votre bot).

## ⚠️ Attention

- Assurez-vous que vos clés/API/variables sont bien ajoutées via les **Environment Variables Koyeb**.
