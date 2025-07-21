let currentImages = [];
let userSelections = {};

export function loadNewImages({
    setPredictionsCount,
    onLoad,
    setOnLoad,
    setCount,
    count,
    e,
}) {
    e.preventDefault();
    if (onLoad) setOnLoad(!onLoad);
    if (count > 10) setCount(1);
    setCount((prev) => prev + 1);
    setPredictionsCount(0);

    // Mélanger et sélectionner 8 images aléatoires
    // const shuffled = [...images].sort(() => 0.5 - Math.random());
    // loadImages({ images: shuffled.slice(0, 8), e });

    // Réinitialiser les prédictions
    // document.querySelectorAll('.prediction-result').forEach((el) => {
    //     el.style.display = 'none';
    // });
    // updateStats();
}

// export function loadImages({ images, e }) {
//     e.preventDefault();
//     const container = document.getElementById('images-container');
//     container.innerHTML = '';
//     currentImages = images;
//     userSelections = {};

//     images.forEach((imageData) => {
//         const imageCard = createImageCard(imageData);
//         container.appendChild(imageCard);
//     });
// }

// export function createImageCard(imageData) {
//     const card = document.createElement('div');
//     card.className = 'image-card';
//     card.id = `card-${imageData.id}`;

//     card.innerHTML = `
//                 <img src="${imageData.url}" alt="Image ${imageData.id}" crossorigin="anonymous"
//                      onload="this.style.opacity = 1" style="opacity: 0; transition: opacity 0.3s;">
//                 <div class="image-actions">
//                     <button class="btn btn-success" onclick="handleSelection('${imageData.id}', true)">
//                         ✓ Correct
//                     </button>
//                     <button class="btn btn-danger" onclick="handleSelection('${imageData.id}', false)">
//                         ✗ Incorrect
//                     </button>
//                 </div>
//                 <div class="feedback" id="feedback-${imageData.id}"></div>
//                 <div class="prediction-result" id="prediction-${imageData.id}" style="display: none;"></div>
//             `;

//     return card;
// }

export async function saveModel({ e, data }) {
    e.preventDefault();

    try {
        await window.animalIdentifier.saveModel();
        alert('💾 Modèle sauvegardé avec succès!');
        // if (data) {
        //     window.localStorage.setItem('chat-classifier', JSON.stringify(data));
        //     alert('💾 Modèle sauvegardé avec succès!');
        // }
    } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        alert('❌ Erreur lors de la sauvegarde du modèle');
    }
}

export async function loadModel({ e }) {
    e.preventDefault();
    const success = await window.animalIdentifier.loadModel();
    // const storageData = window.localStorage.getItem('chat-classifier');
    if (!success) {
        alert('⚠️ Aucun modèle sauvegardé trouvé');
        return;
    }
    // const data = JSON.parse(success);
    // if (!data) {
    //     alert('⚠️ Modèle invalide ou corrompu');
    //     return;
    // }
    alert('📂 Modèle chargé avec succès!');
    // updateStats();
}

// export function updateStats() {
//     const trainingCount = window.imageClassifier
//         ? window.imageClassifier.trainingData.length
//         : 0;
//     document.getElementById('training-count').textContent = trainingCount;
//     document.getElementById('predictions-count').textContent = predictionsCount;
// }

export async function resetSystem({ e, ...functionProps }) {
    e.preventDefault();
    // if (window.imageClassifier) {
    //     await window.imageClassifier.reset();
    // }
    // userSelections = {};
    // predictionsCount = 0;
    loadNewImages({ e, ...functionProps });
    // updateStats();
    functionProps.setResetSystem(true);
}

export async function predictAllImages({
    e,
    predictionsCount,
    setPredictionsCount,
}) {
    e.preventDefault();
    if (!window.imageClassifier || !window.imageClassifier.model) {
        alert("⚠️ Le modèle n'est pas encore prêt!");
        return;
    }

    const images = document.querySelectorAll('.image-card img');
    predictionsCount = 0;

    for (let img of images) {
        if (img.complete) {
            const prediction = await window.imageClassifier.predict(img);
            if (prediction) {
                const imageId = img
                    .closest('.image-card')
                    .id.replace('card-', '');
                const predictionElement = document.getElementById(
                    `prediction-${imageId}`
                );

                predictionElement.innerHTML = `
                            <strong>🔮 Prédiction IA:</strong><br>
                            ${
                                prediction.prediction === 'correct'
                                    ? '✅ Chat détecté'
                                    : '❌ Pas un chat'
                            }<br>
                            <small>Confiance: ${(
                                prediction.confidence * 100
                            ).toFixed(1)}%</small>
                        `;
                predictionElement.style.display = 'block';
                setPredictionsCount((prevCount) => prevCount + 1);
            }
        }
    }

    // updateStats();
}

export async function trainModel({ e, ...functionProps }) {
    e.preventDefault();
    try {
        // updateStatus('🏋️ Entraînement en cours...', 'warning');
        await window.animalIdentifier.trainModel();
        // updateStats();
        // updateStatus('✅ Entraînement terminé!', 'success');
    } catch (error) {
        console.error("Erreur d'entraînement:", error);
        // updateStatus("❌ Erreur lors de l'entraînement", 'error');
    }
}

// export async function handleSelection(imageId, isCorrect, setIsCorrect) {
// userSelections[imageId] = isCorrect;
// setIsCorrect(isCorrect);
// Mettre à jour l'apparence de la carte
// const card = document.getElementById(`card-${imageId}`);
// card.className = `image-card ${
//     isCorrect ? 'selected-correct' : 'selected-incorrect'
// }`;

// Afficher le feedback
// const imageData = currentImages.find((img) => img.id === imageId);
// const isActuallyCorrect = imageData?.isCorrect;
// const feedbackElement = document.getElementById(`feedback-${imageId}`);

// if (isActuallyCorrect !== undefined) {
//     const isRight = isCorrect === isActuallyCorrect;
//     feedbackElement.innerHTML = `
//                 ${isRight ? '✅ Bonne réponse!' : '❌ Mauvaise réponse'}
//                 <br><small>Réalité: ${
//                     isActuallyCorrect ? 'Chat' : 'Autre animal'
//                 }</small>
//             `;
//     feedbackElement.style.color = isRight ? '#4caf50' : '#f44336';
// }

// Ajouter aux données d'entraînement
// const img = card.querySelector('img');
// if (img.complete && window.imageClassifier) {
//     await window.imageClassifier.addTrainingData(img, isCorrect);
//     // updateStats();
// }
// }
