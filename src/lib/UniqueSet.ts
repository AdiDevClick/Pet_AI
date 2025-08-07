/**
 * Classe utilitaire d'un Map() qui agira comme un Set().
 *
 * Il est possible de récupérer, supprimer, ajouter ou itérer sur les éléments de l'ensemble
 * via une clé unique.
 *
 * Toutes les méthodes mutatrices (`set`, `delete`, `clear`, `forEach`)
 * retournent l'instance pour permettre le chaînage,
 * comme les classes natives `Map` et `Set`.
 *
 * Typage strict : `UniqueSet<K, V>` où `K` est le type de la clé et `V` le type de la valeur (objet).
 *
 * Exemple d'utilisation :
 *
 * ```ts
 * const typedEmptySet = new UniqueSet<number, {id: number, name: string}>();
 * const emptySet = new UniqueSet();
 * const set = new UniqueSet<number, { id: number, name: string }>(
 *   (item) => item.id,
 *   [
 *     { id: 1, name: 'A' },
 *     { id: 2, name: 'B' }
 *   ]
 * );
 *
 * set
 *   .set(3, { id: 3, name: 'C' })
 *   .delete(1)
 *   .forEach((value, key) => console.log(key, value));
 *
 * set.clear();
 * ```
 *
 * @template K Type de la clé unique
 * @template V Type de la valeur (objet)
 */
export class UniqueSet<K, V extends { [key: string]: any }> {
   #map = new Map<K, V>();

   /**
    * Crée un UniqueSet à partir d'une fonction de clé et d'un tableau d'objets.
    * @param cb Fonction qui retourne la clé unique pour chaque objet.
    * @param items Tableau d'objets à insérer dans l'ensemble.
    */
   constructor(cb?: ((item: V) => K) | null, items: V[] = []) {
      if (cb) {
         items.forEach((item) => {
            const key = cb(item);
            if (!this.#map.has(key)) this.#map.set(key, item);
         });
      }
   }

   /**
    * Supprime un élément du Map selon sa clé unique.
    * @param key Clé de l'élément à supprimer.
    * @returns L'instance UniqueSet (pour le chaînage)
    */
   delete(key: K) {
      this.#map.delete(key);
      return this;
   }

   /**
    * Vide complètement l'ensemble.
    * @returns L'instance UniqueSet (pour le chaînage)
    */
   clear() {
      this.#map.clear();
      return this;
   }

   /**
    * Retourne le nombre d'éléments dans l'ensemble.
    * @returns number
    */
   size() {
      return this.#map.size;
   }

   /**
    * Retourne un itérateur sur les paires [clé, valeur] de l'ensemble.
    */
   entries() {
      return this.#map.entries();
   }

   /**
    * Vérifie si une clé existe dans l'ensemble.
    * @param key Clé à vérifier.
    * @returns boolean
    */
   has(key: K) {
      return this.#map.has(key);
   }

   /**
    * Retourne la valeur associée à une clé.
    * @param key Clé de l'élément à récupérer.
    * @returns
    */
   get(key: K) {
      return this.#map.get(key);
   }

   /**
    * Applique une fonction à chaque élément de l'ensemble.
    * @param cb Fonction callback appelée pour chaque élément (valeur, clé).
    * @returns L'instance UniqueSet (pour le chaînage)
    */
   forEach(cb: (value: V, key: K) => void) {
      this.#map.forEach(cb);
      return this;
   }

   /**
    * Ajoute ou met à jour un élément dans l'ensemble selon sa clé unique.
    * Si la clé existe déjà, fusionne les propriétés de l'objet existant avec celles du nouvel objet.
    * @param key Clé unique de l'élément.
    * @param items Objet à insérer ou fusionner.
    * @returns L'instance UniqueSet (pour le chaînage)
    */
   set(key: K, items: V): this {
      if (this.#map.has(key)) {
         const mappedItem = this.#map.get(key);
         if (mappedItem) {
            for (const [element, value] of Object.entries(items)) {
               (mappedItem as Record<string, any>)[element] = value;
            }
            this.#map.set(key, mappedItem);
         }
      } else {
         this.#map.set(key, items);
      }
      return this;
   }

   /**
    * Retourne un itérateur sur les clés de l'ensemble.
    * @returns IterableIterator<K>
    */
   keys() {
      return this.#map.keys();
   }

   /**
    * Retourne un itérateur sur les valeurs de l'ensemble.
    * @returns Iterable Iterator
    */
   values() {
      return this.#map.values();
   }

   /**
    * Crée une copie superficielle de l'instance UniqueSet.
    * Utile pour les mises à jour d'état React (nouvelle référence).
    * @returns {UniqueSet<K, V>} Nouvelle instance avec les mêmes éléments.
    */
   clone(andSerialise: boolean = false): UniqueSet<K, V> {
      const newSet = new UniqueSet<K, V>();
      for (const [key, value] of this.#map.entries()) {
         if (andSerialise) {
            newSet.set(key, JSON.parse(JSON.stringify(value)));
         } else {
            newSet.set(key, value);
         }
      }
      return newSet;
   }
}
