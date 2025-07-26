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
}

export async function saveModel({ e, data }) {
    e.preventDefault();

    try {
        await window.animalIdentifier.saveModel();
        alert('💾 Modèle sauvegardé avec succès!');
    } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        alert('❌ Erreur lors de la sauvegarde du modèle');
    }
}

export async function saveData({ e }) {
    e.preventDefault();

    try {
        await window.animalIdentifier.saveTrainingPairs();
        alert('💾 Données sauvegardées avec succès!');
    } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        alert('❌ Erreur lors de la sauvegarde des données');
    }
}

export async function loadDefaultDataArray({ e }) {
    e.preventDefault();

    try {
        await window.animalIdentifier.loadDefaultDataArray();
        alert(
            '📂 Données de comparaison par défaut chargées avec succès!\nUn nouvel enregistrement de données sera créé.'
        );
    } catch (error) {
        alert(
            '❌ Erreur lors du chargement des données de comparaison par défaut'
        );
    }
}

export async function loadModel({ e, setIsSuccess }) {
    e.preventDefault();
    const success = await window.animalIdentifier.loadModel();
    setIsSuccess({ ...success, id: e.target.id });
}

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
export async function validateAllImages({ e }) {
    e.preventDefault();
    let count = 0;
    const comparisons = document.querySelectorAll('.card__image-choice');
    await Promise.all(
        Array.from(comparisons).map(async (comparison) => {
            const images = comparison.querySelectorAll('img');
            if (images.length === 2) {
                const image1 = images[0];
                const image2 = images[1];
                if (image1.complete && image2.complete) {
                    await window.animalIdentifier.addTrainingPair(
                        [image1, image2],
                        true
                    );
                    count++;
                    // const predictionElement = document.getElementById(
                    //     `prediction-${image1.id}`
                    // );
                    // predictionElement.innerHTML = `
                    //     <strong>🔮 Prédiction IA:</strong><br>
                    //     ✅ Images validées<br>
                    //     <small>Confiance: 100%</small>
                    // `;
                    // predictionElement.style.display = 'block';
                }
            }
        })
    );
    alert(`✅ Toutes les images(${count}) ont été validées!`);
    // for (let img of images) {
    //     if (img.complete) {
    //         const prediction = await window.imageClassifier.predict(img);
    //         if (prediction) {
    //             const imageId = img
    //                 .closest('.image-card')
    //                 .id.replace('card-', '');
    //             const predictionElement = document.getElementById(
    //                 `prediction-${imageId}`
    //             );

    //             predictionElement.innerHTML = `
    //                         <strong>🔮 Prédiction IA:</strong><br>
    //                         ${
    //                             prediction.prediction === 'correct'
    //                                 ? '✅ Chat détecté'
    //                                 : '❌ Pas un chat'
    //                         }<br>
    //                         <small>Confiance: ${(
    //                             prediction.confidence * 100
    //                         ).toFixed(1)}%</small>
    //                     `;
    //             predictionElement.style.display = 'block';
    //             setPredictionsCount((prevCount) => prevCount + 1);
    //         }
    //     }
    // }

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
