export default class RandomUtils {
  /**
   * Generates a random integer between min (inclusive) and max (exclusive).
   * @param min - The minimum value (inclusive).
   * @param max - The maximum value (exclusive).
   * @returns A random integer between min and max.
   */
  static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Generates a random integer between min (inclusive) and max (inclusive).
   * @param min - The minimum value (inclusive).
   * @param max - The maximum value (inclusive).
   * @returns A random integer between min and max.
   */
  static getRandomIntInclusive(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generates a random float between min (inclusive) and max (exclusive).
   * @param min - The minimum value (inclusive).
   * @param max - The maximum value (exclusive).
   * @returns A random float between min and max.
   */
  static getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generates a random boolean value.
   * @returns A random boolean (true or false).
   */
  static getRandomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  /**
   * Selects a random element from an array.
   * @param array - The array to select from.
   * @returns A random element from the array.
   * @throws If the array is empty or not an array.
   */
  static getRandomElementFromArray<T>(array: T[]): T {
    if (!Array.isArray(array) || array.length === 0) {
      throw new Error('Array must not be empty');
    }
    const randomIndex = this.getRandomInt(0, array.length);
    return array[randomIndex];
  }
}
