const { createFilledArray, calculateArray, calculateDutyAverage, sortIndicesDescending } = require('../etc/helpers.js');

test('createFilledArray creates arrays with proper value and length', () => {
  const res = createFilledArray(50, 5);
  expect(res).toEqual([50, 50, 50, 50, 50]);
});

test('createFilledArray creates empty arrays with negative lengths', () => {
  const res = createFilledArray(50, -1);
  expect(res).toEqual([]);
});

test('calculateArray creates arrays with proper values and length', () => {
  const res = calculateArray(index => index * 2, 4);
  expect(res).toEqual([0, 2, 4, 6]);
});

test('calculateArray creates empty arrays with negative length', () => {
  const res = calculateArray(index => index * 2, -1);
  expect(res).toEqual([]);
});
/*
test('calculateDutyAverage returns correct averages', () => {
  class FakePerson {
    constructor(assignments) {
      this.assignments = assignments;
    }

    getNumDuties() {
      return getNumDuties;
    }
  }
});
*/
test('sortIndicesDescending works for array [10, 20, 30]', () => {
  const arr = [10, 20, 30];
  const res = sortIndicesDescending(arr);
  expect(res).toEqual([2, 1, 0]);
});

test('sortIndicesDescending works for array [-50, 30, 0]', () => {
  const arr = [-50, 30, 0];
  const res = sortIndicesDescending(arr);
  expect(res).toEqual([1, 2, 0]);
});