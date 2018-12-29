/**
 * Create an array of a length filled with a value.
 * @param {*} value Value to put in resulting array.
 * @param {number} length Length of resulting array.
 * @returns {Array}
 */
function createFilledArray(value, length) {
  const arr = [];
  for(let i = 0; i < length; i++) {
    arr[i] = value;
  }
  return arr;
}

/**
 * Create an array of a length filled with a computed value.
 * @param {function} valueFunction Function that returns a value to be put in resulting array.
 *  Current index is passed as an argument.
 * @param {number} length Length of resulting array.
 * @returns {Array}
 */
function calculateArray(valueFunction, length) {
  const arr = [];
  for(let i = 0; i < length; i++) {
    arr[i] = valueFunction(i);
  }
  return arr;
}

/**
 * Calculate average amount of duties in an array of persons.
 * @param {Array<Person>} persons Array of persons.
 * @param {number} numDutyTypes Number of types of duty.
 * @returns {Array<number>} Array of average amount of duties with length numDutyTypes.
 */
function calculateDutyAverage(persons, numDutyTypes) {
  return persons
    .map(person => person.getNumDuties())
    .reduce((accumulator, person) => {
      for(let i = 0; i < accumulator.length; i++) {
        accumulator[i] += person[i];
      }
      return accumulator;
    }, createFilledArray(0, numDutyTypes))
    .map(num => num / persons.length);
}

/**
 * Sort array in descending order and get array of indices corresponding with positions of original elements.
 * @param {Array<number>} arr Array of values to sort.
 * @returns {Array<number>} Array of indices.
 */
function sortIndicesDescending(arr) {
  const res = createFilledArray(-1, arr.length);
  let highestIndex, highestValue;
  for(let i = 0; i < res.length; i++) {
    highestIndex = -1;
    highestValue = Math.min(...arr) - 1;
    for(let j = 0; j < arr.length; j++) {
      if(!res.includes(j)) {
        if(arr[j] > highestValue) {
          highestValue = arr[j];
          highestIndex = j;
        }
      }
    }
    res[i] = highestIndex;
  }
  return res;
}

module.exports = {
  createFilledArray,
  calculateArray,
  calculateDutyAverage,
  sortIndicesDescending
};