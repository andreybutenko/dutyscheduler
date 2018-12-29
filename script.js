const config = {
  scores: {
    unavailableImpact: -50,     // score will be impacted if unavailable
    targetDutyCountMetImpact: -100,  // score will be impacted if already met target duty count
    belowAverageImpact: +50,    // score will be impacted if below-average duty assignments
    recentDuty: {
      dayBeforeImpact: -20,     // score will be impacted if on duty the night before
      numDaysImpact: 2          // score will be impacted if on duty within this many days
    }
  }
}

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

class Person {
  constructor(name, availability, dutySet) {
    this.name = name;
    this.availability = availability;
    this.dutySet = dutySet;
    this.assignments = createFilledArray(-1, dutySet.getNumDays());
  }

  /**
   * Get the person's name.
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Get the number of duties a person is assigned to for each type.
   * @returns {Array<number>} Array of numbers, where index is duty type and value is number of assignments.
   */
  getNumDuties() {
    const res = createFilledArray(0, this.dutySet.getNumDutyTypes());
    for(let i = 0; i < this.assignments.length; i++) {
      if(this.assignments[i] != -1) {
        res[this.assignments[i]]++;
      }
    }
    return res;
  }

  /**
   * Get the number of duties a person is assigned to for a particular type.
   * @returns {number}
   */
  getNumDutiesOfType(typeIndex) {
    return this.getNumDuties()[typeIndex];
  }

  /**
   * Get the individual's duty assignments.
   * @returns {Array<number>} Array of assignments where index is the day and value is -1 if not
   *  assigned and a typeIndex otherwise.
   */
  getAssignments() {
    return this.assignments;
  }

  /**
   * Get number of days since the person's last duty assignment.
   * @param {number} dayIndex Day index from which to count.
   * @returns {number} Number of days since the person's last duty assignment. Returns 999 if never assigned.
   */
  getNumDaysSincePreviousDuty(dayIndex) {
    for(let i = dayIndex - 1; i >= 0; i--) {
      if(this.assignments[i] != -1) {
        return dayIndex - i;
      }
    }

    return 999;
  }

  getDutyScores(dayIndex) {
    return calculateArray(typeIndex => this.getDutyScoreOfType(dayIndex, typeIndex), this.numDutyTypes);
  }

  /**
   * Gets a score of how suitable a person is to be assigned to duty for a particular day.
   * Considers their availability, days since their last duty, days remaining in the duty set,
   * target number of duty assignments, and average duty assignments of others.
   * @param {number} dayIndex Index of the current day.
   * @param {number} typeIndex Duty type to consider.
   * @param {Array<number>} averageDutyAssignments Average number of duty assignments for each type
   *  for others in the duty set.
   * @returns {number}
   */
  getDutyScoreOfType(dayIndex, typeIndex, averageDutyAssignments) {
    let score = 100;

    // Reduce score if already met target number of duty shifts
    if(this.getNumDutiesOfType(typeIndex) >= this.dutySet.getTargetNumDutiesOfType(typeIndex)) {
      score += config.scores.targetDutyCountMetImpact;
    }

    // Reduce score if recently on duty
    const recentDutyImpactPerDay = config.scores.recentDuty.dayBeforeImpact / config.scores.recentDuty.numDaysImpact;
    score += Math.max(config.scores.recentDuty.numDaysImpact + 1 - this.getNumDaysSincePreviousDuty(dayIndex), 0) * recentDutyImpactPerDay;

    // Reduce score if unavailable
    if(this.availability[dayIndex] === false) {
      score += config.scores.unavailableImpact;
    }

    // Increase score if you have below-average amount of duty assignments
    if(averageDutyAssignments[typeIndex] > this.getNumDutiesOfType(typeIndex)) {
      score += (averageDutyAssignments[typeIndex] - this.getNumDutiesOfType(typeIndex)) * config.scores.belowAverageImpact;
    }

    return score;
  }

  /**
   * Resets a person's duty assignments.
   */
  resetAssignments() {
    this.assignments = createFilledArray(-1, availability.length);
  }

  /**
   * Assign person to duty type on a particular day.
   * @param {number} dayIndex Index of the current day.
   * @param {number} type Duty type to assign.
   */
  setAssignment(dayIndex, type) {
    this.assignments[dayIndex] = type;
  }
}

function testLog(person) {
  for(let i = 0; i < person.getAssignments().length; i++) {
    console.log(i, person.getDutyScores(i));
  }
}

class DutySet {
  /**
   * Constructor for a DutySet.
   * @param {number} numDays Number of days that RAs are on duty in this set.
   * @param {number} numOnDuty Number of RAs that are on duty each night.
   */
  constructor(numDays, numOnDuty) {
    this.numDays = numDays;
    this.numDutyTypes = numOnDuty;
    this.persons = [];
  }

  /**
   * Get number of duty days in the set.
   * @returns {number}
   */
  getNumDays() {
    return this.numDays;
  }

  /**
   * Get number of duty types. In other words, the number of persons on duty each night.
   * @returns {number}
   */
  getNumDutyTypes() {
    return this.numDutyTypes;
  }
  
  /**
   * Calculate target number of duties for each individual for each duty type.
   * @returns {Array<number>}
   */
  getTargetNumDuties() {
    const targetNumDuties = this.numDutyTypes * this.numDays / this.persons.length;
    return createFilledArray(targetNumDuties, this.numDutyTypes);
  }

  /**
   * Calculate target number of duties for each individual for a particular duty type.
   * @returns {number}
   */
  getTargetNumDutiesOfType(typeIndex) {
    return this.getTargetNumDuties()[typeIndex];
  }

  /**
   * Add a person to the duty set.
   * @param {Person} person 
   */
  addPerson(person) {
    this.persons.push(person);
  }

  /**
   * Calculate a schedule by comparing persons's duty scores.
   * @param {boolean} [debug] Whether to log debug details. False by default.
   */
  calculateSchedule(debug) {
    for(let i = 0; i < this.numDays; i++) {
      const averageDutyAssignments = calculateDutyAverage(this.persons, this.numDutyTypes);
    
      const scores = this.persons.map(person => person.getDutyScoreOfType(i, 0, averageDutyAssignments));
      const highestScoreIndex = scores.indexOf(Math.max(...scores));
      this.persons[highestScoreIndex].setAssignment(i, 0);

      if(debug === true) {
        console.log(`Day ${i}: ${highestScoreIndex}/${this.persons[highestScoreIndex].getName()}`, averageDutyAssignments, scores);
      }
    }
  }
}

const dutySet = new DutySet(6, 1);
dutySet.addPerson(new Person('Andrey', [false, true, true, true, false, true], dutySet));
dutySet.addPerson(new Person('Korra', [true, false, false, false, true, true], dutySet));
dutySet.addPerson(new Person('Anna', [false, false, false, false, false, false], dutySet));
dutySet.calculateSchedule(true);

/*
  // Loop/recycle values in availability arrays to match numDays length.
  raAvailability[i % raAvailability.length]
*/