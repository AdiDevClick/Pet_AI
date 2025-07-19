# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 🤖 Pet AI - Classificateur d'Images Interactif

Un système avancé de classification d'images utilisant TensorFlow.js avec entraînement interactif, similaire aux captchas de Google.

## 🎯 Fonctionnalités

- **🧠 Intelligence Artificielle**: Réseau de neurones convolutionnel (CNN) pour la classification d'images
- **📚 Entraînement Interactif**: Entraînement en temps réel basé sur les interactions utilisateur
- **🎮 Interface Captcha-like**: Interface similaire aux captchas Google pour l'entraînement
- **📊 Suivi en Temps Réel**: Statistiques de précision et performance en direct
- **💾 Sauvegarde/Chargement**: Persistance du modèle entraîné
- **🔮 Prédictions IA**: Test du modèle sur de nouvelles images

## 🚀 Technologies Utilisées

- **Frontend**: React + TypeScript + Vite
- **IA/ML**: TensorFlow.js
- **Styling**: CSS3 avec animations
- **Bundler**: Vite

## 📦 Installation et Démarrage

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone [votre-repo]
cd Pet_AI

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### Démonstration rapide
Ouvrez le fichier `demo.html` dans votre navigateur pour tester directement le système sans React.

## 🎮 Utilisation

### 1. Interface React (Recommandée)
- Lancez `npm run dev`
- Ouvrez http://localhost:5173
- Cliquez sur "Ouvrir le Classificateur d'Images IA"

### 2. Démonstration HTML
- Ouvrez `demo.html` dans votre navigateur
- Testez immédiatement le système

## 🧠 Architecture du Modèle

### Modèle CNN (Convolutional Neural Network)
```
Entrée: Images 224x224x3
├── Conv2D (32 filtres, 3x3) + ReLU + MaxPool
├── Conv2D (64 filtres, 3x3) + ReLU + MaxPool  
├── Conv2D (128 filtres, 3x3) + ReLU + MaxPool
├── Flatten
├── Dense (128 neurones) + ReLU + Dropout(0.5)
├── Dense (64 neurones) + ReLU + Dropout(0.3)
└── Dense (2 classes) + Softmax
```

### Processus d'Entraînement
1. **Préprocessing**: Redimensionnement + Normalisation
2. **Augmentation**: Collecte de données utilisateur
3. **Entraînement**: Mise à jour en temps réel
4. **Validation**: Test de précision

## 📋 Guide d'Utilisation Détaillé

### Étape 1: Entraînement
1. Regardez chaque image affichée
2. Décidez si elle correspond à la tâche (ex: "contient un chat")
3. Cliquez sur "✓ Correct" ou "✗ Incorrect"
4. Le modèle s'entraîne automatiquement après chaque sélection

### Étape 2: Test et Validation
- Utilisez "🔮 Prédire Tout" pour tester le modèle
- Observez la précision du modèle
- Comparez avec vos propres réponses

### Étape 3: Amélioration Continue
- Ajoutez plus d'exemples pour améliorer la précision
- Sauvegardez le modèle entraîné
- Testez avec de nouvelles images

## 🎛️ Contrôles Disponibles

| Bouton | Action |
|--------|--------|
| 🔄 Nouvelles Images | Charge un nouveau set d'images |
| 🗑️ Réinitialiser | Remet à zéro le modèle et les données |
| 🔮 Prédire Tout | Teste le modèle sur toutes les images |
| 💾 Sauvegarder | Sauvegarde le modèle entraîné |
| 📂 Charger | Charge un modèle précédemment sauvegardé |

## 📊 Métriques et Statistiques

- **Échantillons**: Nombre de données d'entraînement
- **Précision**: Pourcentage de bonnes prédictions
- **Prédictions**: Nombre de tests effectués
- **Loss**: Fonction de perte pendant l'entraînement

## 🔧 Configuration Avancée

### Personnaliser les Images
Modifiez la variable `sampleImages` dans `demo.html` ou ajustez le composant React pour utiliser vos propres images.

### Ajuster le Modèle
Dans `src/TensorScripts/script.js`, vous pouvez modifier:
- Nombre de couches convolutionnelles
- Taille des filtres
- Taux de dropout
- Taux d'apprentissage

### Changer la Tâche de Classification
Modifiez la variable `currentTask` pour adapter l'interface à votre cas d'usage.

## 🎨 Personnalisation CSS

Le fichier `src/components/ImageClassifier.css` contient tous les styles. Modifiez-le pour adapter l'apparence à vos besoins.

## 🔍 Cas d'Usage

- **Éducation**: Apprentissage de l'IA et du machine learning
- **Recherche**: Collecte de données pour l'entraînement
- **Validation**: Test de modèles de classification
- **Démonstration**: Présentation des concepts d'IA

## 🐛 Dépannage

### Le modèle ne se charge pas
- Vérifiez que TensorFlow.js est bien chargé
- Regardez la console pour les erreurs

### Images qui ne s'affichent pas
- Problème de CORS: utilisez un serveur local
- Vérifiez les URL des images

### Performance lente
- Réduisez la taille des images
- Diminuez le nombre d'epochs d'entraînement

## 🚀 Développement Futur

- [ ] Support multi-classes (plus de 2 catégories)
- [ ] Intégration avec des APIs d'images
- [ ] Mode hors-ligne complet
- [ ] Export des données d'entraînement
- [ ] Interface d'administration

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

---

**Créé avec ❤️ et TensorFlow.js**

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
