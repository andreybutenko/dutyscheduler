const defaultConfig = require('../etc/defaultConfig.js');
const { createFilledArray, calculateDutyAverage, sortIndicesDescending } = require('../etc/helpers.js');

/**
 * DutySet tracks the Persons assigned to that DutySet, facilitates computing the schedule,
 * and provides an interface for accessing the schedule.
 */
class DutySet {
  /**
   * Constructor for a DutySet.
   * @param {number} numDays Number of days that RAs are on duty in this set.
   * @param {number} numOnDuty Number of RAs that are on duty each night.
   * @param {Object} [config] Optional custom config.
   * @param {number} [config.scores.unavailableImpact] Impact on score if person is unavailable.
   * @param {number} [config.scores.targetDutyCountMetImpact] Impact on score if person has already
   *  met target number of duties.
   * @param {number} [config.scores.belowAverageImpact] Impact on score if person is assigned to a 
   *  below-average amount of duties at a given time.
   * @param {number} [config.scores.recentDuty.dayBeforeImpact] Impact on score if person has
   *  recently been on duty.
   * @param {number} [config.scores.recentDuty.numDaysEffect] How many days score will be impacted
   *  if a person was recently on duty.
   */
  constructor(numDays, numOnDuty, config) {
    this.numDays = numDays;
    this.numDutyTypes = numOnDuty;
    this.persons = [];
    this.config = {
      ...defaultConfig,
      ...config,
      scores: {
        ...defaultConfig.scores,
        ...(config || {}).scores,
        recentDuty: {
          ...defaultConfig.scores.recentDuty,
        ...((config || {}).scores || {}).recentDuty,
        }
      }
    };
  }

  /**
   * Get config for the duty set.
   * @returns {Object} See DutySet constructor for shape.
   */
  getConfig() {
    return this.config;
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
    const targetNumDuties = this.numDays / this.persons.length;
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
   * @return {Array<Array<string>>} Result of getSchedule()
   */
  calculateSchedule(debug) {
    for(let dutyType = 0; dutyType < this.numDutyTypes; dutyType++) {      
      for(let i = 0; i < this.numDays; i++) {
        const averageDutyAssignments = calculateDutyAverage(this.persons, this.numDutyTypes);
      
        const scores = this.persons.map(person => person.getDutyScoreOfType(i, dutyType, averageDutyAssignments));
        const highestScoreIndices = sortIndicesDescending(scores);
        this.persons[highestScoreIndices[0]].setAssignment(i, dutyType);

        if(debug === true) {
          console.log(
            `Day ${i}, #${dutyType}: ${this.persons[highestScoreIndices[0]].getName()}`,
            scores
          );
        }
      }
    }
    
    return this.getSchedule();
  }

  /**
   * Get availabilities of persons in the duty set.
   * @returns {Array<Array<string>>} Returns an array where indices are days and values are the
   *  names of persons available on that day.
   */
  getAvailabilities() {
    const res = [];
    for(let i = 0; i < this.numDays; i++) {
      const day = [];
      for(let j = 0; j < this.persons.length; j++) {
        const available = this.persons[j].getAvailabilityForDay(i);
        if(available) {
          day.push(this.persons[j].getName());
        }
      }
      res[i] = day;
    }
    return res;
  }

  /**
   * Get duty schedule. Only returns meaningful values after calling calculateSchedule()
   * @returns {Array<Array<string>>} Returns an array where indices are days and values are the
   *  names of persons assigned to that day.
   */
  getSchedule() {
    const res = [];
    for(let i = 0; i < this.numDays; i++) {
      const day = [];
      for(let j = 0; j < this.persons.length; j++) {
        const assignment = this.persons[j].getAssignmentForDay(i);
        if(assignment !== -1) {
          day[assignment] = this.persons[j].getName();
        }
      }
      res[i] = day;
    }
    return res;
  }
}

module.exports = DutySet;