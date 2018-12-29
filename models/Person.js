const { calculateArray, createFilledArray } = require('../etc/helpers.js');

/**
 * Person tracks the availability and assignments for a person.
 */
class Person {
  /**
   * Creates a person with a given availability which is then considered in producing a duty set schedule.
   * @param {string} name Name of the person.
   * @param {Array<boolean>} availability Array of the person's availability. Values are looped/recycled to
   *  match the number of days in the duty set.
   * @param {DutySet} dutySet The duty set the person is under.
   */
  constructor(name, availability, dutySet) {
    this.name = name;
    this.availability = calculateArray(i => availability[i % availability.length], dutySet.getNumDays());
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
   * Get the person's duty availability for a given day.
   * @param {number} dayIndex Day for which to get duty availability;
   * @returns {boolean}
   */
  getAvailabilityForDay(dayIndex) {
    return this.availability[dayIndex];
  }

  /**
   * Get the person's duty assignment for a given day.
   * @param {number} dayIndex Day for which to get a duty assignment.
   * @returns {number} Duty type for the day. -1 if not assigned.
   */
  getAssignmentForDay(dayIndex) {
    return this.assignments[dayIndex];
  }

  /**
   * Get number of days since the person's last duty assignment.
   * @param {number} dayIndex Day index from which to count.
   * @returns {number} Number of days since the person's last duty assignment. Returns 999 if never.
   */
  getNumDaysSincePreviousDuty(dayIndex) {
    for(let i = dayIndex - 1; i >= 0; i--) {
      if(this.assignments[i] != -1) {
        return dayIndex - i;
      }
    }

    return 999;
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
      score += this.dutySet.getConfig().scores.targetDutyCountMetImpact;
    }

    // Reduce score if recently on duty
    if(this.getNumDaysSincePreviousDuty(dayIndex) <= this.dutySet.getConfig().scores.recentDuty.numDaysEffect) {
      score += this.dutySet.getConfig().scores.recentDuty.dayBeforeImpact
    }

    // Reduce score if unavailable
    if(this.availability[dayIndex] === false) {
      score += this.dutySet.getConfig().scores.unavailableImpact;
    }

    // Increase score if you have below-average amount of duty assignments
    if(averageDutyAssignments[typeIndex] > this.getNumDutiesOfType(typeIndex)) {
      score += (averageDutyAssignments[typeIndex] - this.getNumDutiesOfType(typeIndex)) *
        this.dutySet.getConfig().scores.belowAverageImpact;
    }

    // Make score unviable if already on duty that day for a different duty type.
    if(this.assignments[dayIndex] !== -1 && this.assignments[dayIndex] !== typeIndex) {
      score -= 10000;
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

module.exports = Person;