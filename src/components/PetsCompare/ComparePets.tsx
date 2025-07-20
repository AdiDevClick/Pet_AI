import { Button } from '@/components/Buttons/Button.tsx';
import { GenericCard } from '@/components/Cards/GenericCard.tsx';
import { GenericGrid } from '@/components/Grid/GenericGrid.tsx';
import { ImageInput } from '@/components/Inputs/ImageInput.tsx';
import { GenericDescription } from '@/components/Texts/GenericDescription.tsx';
import { GenericTitle } from '@/components/Texts/GenericTitle.tsx';
import { useState } from 'react';

const inputs = [
    {
        id: 'compare-img1',
        label: 'Image 1',
        previewId: 'preview1',
    },
    {
        id: 'compare-img2',
        label: 'Image 2',
        previewId: 'preview2',
    },
];

export function ComparePets() {
    const [statusMessage, setStatusMessage] = useState({
        message: '',
        className: '',
    });
    const [inputImages, setInputImages] = useState({
        preview1: null,
        preview2: null,
    });
    const [result, setResult] = useState(null);
    const compareImages = async () => {
        if (!inputImages.preview1 || !inputImages.preview2) {
            alert('Veuillez sélectionner les deux images à comparer');
            return;
        }

        try {
            setStatusMessage({
                message: '🔍 Comparaison en cours...',
                className: 'warning',
            });
            const response = await window.animalIdentifier.compareAnimals(
                inputImages.preview1,
                inputImages.preview2
            );

            if (!response) {
                return setStatusMessage({
                    message: '❌ Erreur lors de la comparaison',
                    className: 'error',
                });
            }
            setResult(response);
            // displayResults(result);
            // updateStats();
            setStatusMessage({
                message: '✅ Comparaison terminée!',
                className: 'success',
            });
        } catch (error) {
            console.error('Erreur de comparaison:', error);
            setStatusMessage({
                message: '❌ Erreur lors de la comparaison',
                className: 'error',
            });
        }
    };

    return (
        <section className="generic-layout compare-pets">
            <GenericTitle>🔍 Comparaison d'Images</GenericTitle>
            <GenericDescription>
                Comparez deux nouvelles images pour voir si elles montrent le
                même animal.
            </GenericDescription>

            <GenericGrid className="comparison-container">
                {inputs.map((input) => (
                    <GenericCard
                        key={input.id}
                        id={`card-${input.id}`}
                        className="image-preview-container"
                    >
                        <ImageInput
                            id={input.id}
                            label={input.label}
                            previewId={input.previewId}
                            setInputImages={setInputImages}
                        />
                    </GenericCard>
                ))}
            </GenericGrid>

            <Button
                className="comparison__btn "
                onClick={compareImages}
                disabled={!inputImages.preview1 || !inputImages.preview2}
            >
                🔮 Comparer les Images
            </Button>
            <div className="generic-layout__alert">
                {result && (
                    <>
                        <h3>Résultat de la Comparaison:</h3>
                        <p>
                            <strong>Verdict:</strong>
                            {result.sameAnimal
                                ? '✅ Même animal'
                                : '❌ Animaux différents'}
                        </p>
                        <p>
                            <strong>Score de similarité: </strong>
                            {(result.similarity * 100).toFixed(1)}%
                        </p>
                        <p>
                            <strong>Confiance: </strong>
                            {(result.confidence * 100).toFixed(1)}%
                        </p>
                        <p>
                            <strong>Seuil utilisé: </strong>
                            {(result.details.threshold * 100).toFixed()}%
                        </p>
                        <p>
                            <strong>Comparaison # : </strong>
                            {result.details.comparisonNumber}
                        </p>
                        <div
                            style={{
                                textAlign: 'center',
                                background: `${
                                    result.sameAnimal ? '#c6f6d5' : '#fed7d7'
                                }`,
                                color: `${
                                    result.sameAnimal ? '#22543d' : '#742a2a'
                                }`,
                                padding: '10px',
                                borderRadius: '5px',
                                marginTop: '10px',
                            }}
                        >
                            <strong>
                                {result.sameAnimal
                                    ? '✅ Ces images semblent montrer le même animal!'
                                    : '❌ Ces images semblent montrer des animaux différents.'}
                            </strong>
                        </div>
                    </>
                )}
                {!result && 'Aucune comparaison effectuée'}
            </div>
        </section>
    );
}
