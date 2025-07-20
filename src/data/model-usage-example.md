# Utilisation des Modèles JSON

## Sauvegarde d'un modèle

Pour sauvegarder un modèle entraîné :

```javascript
// Après avoir entraîné votre modèle
await window.animalIdentifier.saveModel('mon-modele-v1');
```

Le fichier JSON sera téléchargé automatiquement dans votre dossier de téléchargements.

## Chargement d'un modèle

### Option 1 : Via sélecteur de fichier
```javascript
// Ouvre une boîte de dialogue pour sélectionner le fichier JSON
const success = await window.animalIdentifier.loadModel();
if (success) {
    console.log('Modèle chargé avec succès !');
}
```

### Option 2 : Depuis le dossier data
```javascript
// Charger un modèle depuis le dossier data
const success = await window.animalIdentifier.loadModelFromFile('mon-modele-v1.json');
if (success) {
    console.log('Modèle chargé depuis le dossier data !');
}
```

### Option 3 : Avec des données JSON directement
```javascript
// Si vous avez déjà les données JSON
const modelData = { /* données du modèle */ };
const success = await window.animalIdentifier.loadModelFromData(modelData);
```

## Export des données d'entraînement

Pour exporter les métadonnées des paires d'entraînement :

```javascript
window.animalIdentifier.exportTrainingData('session-entrainement-1');
```

## Structure du fichier JSON

Le fichier JSON contient :
- `metadata` : informations sur le modèle (nom, date, taille d'image, etc.)
- `siameseModel` : architecture et poids du modèle siamois
- `featureExtractor` : architecture et poids de l'extracteur de features

## Avantages de cette approche

1. **Portabilité** : Les modèles peuvent être partagés facilement
2. **Versioning** : Chaque sauvegarde contient un timestamp
3. **Transparence** : Le format JSON est lisible et inspectable
4. **Flexibilité** : Les modèles peuvent être chargés depuis différentes sources
