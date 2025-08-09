export async function predictComparison(
   images: HTMLImageElement[],
   state: any,
   setter: any
): Promise<ComparisonResult> {
   if (state.imagesShown.size() === 2) {
      const entries = Array.from(state.imagesShown.values());
      const result = await compareAnimals(entries);

      setter((prev) => ({
         ...prev,
         prediction: result,
         showPrediction: true,
      }));
   }
}
