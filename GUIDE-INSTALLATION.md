# BLECH — Guide d'installation et déploiement

## Pré-requis
- Un compte GitHub (gratuit) → https://github.com
- Un compte Vercel (gratuit) → https://vercel.com
- Un compte Google (celui que tu as déjà) → pour la clé API Gemini gratuite

---

## Étape 1 : Créer un repo GitHub

1. Va sur https://github.com/new
2. Nom du repo : `blech`
3. Laisse en **Public** (ou Private, les deux marchent)
4. Clique **Create repository**
5. Tu vas voir une page avec des instructions — garde cet onglet ouvert

---

## Étape 2 : Uploader les fichiers

### Option A : Via l'interface GitHub (le plus simple)
1. Sur la page de ton repo, clique **"uploading an existing file"**
2. Glisse-dépose TOUS les fichiers et dossiers du projet :
   ```
   blech/
   ├── api/
   │   └── generate.js
   ├── src/
   │   ├── App.jsx
   │   └── main.jsx
   ├── public/
   ├── index.html
   ├── package.json
   ├── vite.config.js
   └── vercel.json
   ```
3. Clique **Commit changes**

### Option B : Via Git en ligne de commande
```bash
cd blech
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/blech.git
git push -u origin main
```

---

## Étape 3 : Déployer sur Vercel

1. Va sur https://vercel.com et connecte-toi avec GitHub
2. Clique **"Add New Project"**
3. Sélectionne ton repo **blech**
4. Vercel détecte automatiquement Vite — laisse les paramètres par défaut
5. **IMPORTANT** — Avant de cliquer Deploy, ajoute ta variable d'environnement :
   - Clique sur **"Environment Variables"**
   - Name : `GEMINI_API_KEY`
   - Value : ta clé API Gemini (commence par `AIza...`)
   - Clique **Add**
6. Clique **Deploy**
7. Attends ~1 minute — ton site est en ligne !

---

## Étape 4 : C'est live !

Vercel te donne un lien du type :
```
https://blech-xxxxx.vercel.app
```

C'est ton site, en ligne, accessible à tout le monde !

---

## Comment modifier le site après

1. Modifie les fichiers sur GitHub (ou en local avec git)
2. Pousse tes changements (`git push`)
3. Vercel redéploie automatiquement en ~30 secondes

---

## Structure du projet

| Fichier | Rôle |
|---------|------|
| `src/App.jsx` | Le frontend (ce que les gens voient) |
| `api/generate.js` | Le backend (appelle l'IA Anthropic) |
| `index.html` | Page HTML de base |
| `package.json` | Dépendances du projet |
| `vite.config.js` | Configuration du build |
| `vercel.json` | Configuration du déploiement |

---

## Obtenir ta clé API Gemini (GRATUIT)

1. Va sur https://aistudio.google.com/apikey
2. Connecte-toi avec ton compte Google
3. Clique **Create API Key**
4. Copie la clé (elle commence par `AIza...`)
5. Colle-la dans Vercel (Étape 3)

**C'est 100% gratuit.** Tu peux faire 15 requêtes par minute, largement suffisant.

---

## En cas de problème

- **Le site affiche une erreur** → Vérifie ta clé API dans Vercel (Settings > Environment Variables)
- **"API error"** → Vérifie que ta clé Gemini est bien active sur https://aistudio.google.com/apikey
- **Page blanche** → Vérifie que tous les fichiers sont bien uploadés sur GitHub
- **Les modifications ne s'affichent pas** → Attends 30s, Vercel redéploie automatiquement

---

Enjoy! 🎉
