const config = {
  scores: {
    unavailableImpact: -50,     // score will be impacted if unavailable
    targetDutyNotMetImpactPerDay: 5,  // score will be impacted if not yet met duty count
    targetDutyCountMetImpact: -100,  // score will be impacted if already met target duty count
    belowAverageImpact: +50,    // score will be impacted if below-average duty assignments
    recentDuty: {
      dayBeforeImpact: -20,     // score will be impacted if on duty the night before
      numDaysImpact: 2          // score will be impacted if on duty within this many days
    }
  }
}

function createFilledArray(value, length) {
  const arr = [];
  for(let i = 0; i < length; i++) {
    arr[i] = value;
  }
  return arr;
}

function calculateArray(valueFunction, length) {
  const arr = [];
  for(let i = 0; i < length; i++) {
    arr[i] = valueFunction(i);
  }
  return arr;
}

/**
 * Calculate average amount of duties in a set of persons.
 * @param {Array<Person>} persons 
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
  constructor(name, numOnDuty, numDutyTypes, availability, targetNumDuties) {
    this.name = name;
    this.numOnDuty = numOnDuty; // TODO value should be fetched
    this.numDutyTypes = numDutyTypes; // TODO value should be fetched
    this.availability = availability;
    this.assignments = createFilledArray(-1, availability.length);
    this.targetNumDuties = targetNumDuties; // TODO value should be calculated
  }

  getName() {
    return this.name;
  }

  getNumDuties() {
    const res = createFilledArray(0, this.numDutyTypes);
    for(let i = 0; i < this.assignments.length; i++) {
      //console.log('HLLO')
      //console.log(`${this.name}: ${this.assignments[i]}@${i}`)
      if(this.assignments[i] != -1) {
        res[this.assignments[i]]++;
      }

    }
    return res;
  }

  getNumDutiesOfType(typeIndex) {
    return this.getNumDuties()[typeIndex];
  }

  getTargetNumDuties() {
    return this.targetNumDuties;
  }

  getTargetNumDutiesOfType(typeIndex) {
    return this.targetNumDuties[typeIndex];
  }

  getAssignments() {
    return this.assignments;
  }

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

  getDutyScoreOfType(dayIndex, typeIndex, averageDutyAssignments) {
    let score = 100;

    // Reduce score if already met target number of duty shifts
    if(this.getNumDutiesOfType(typeIndex) >= this.getTargetNumDutiesOfType(typeIndex)) {
      score += config.scores.targetDutyCountMetImpact;
    }
    else {
      score += (this.getTargetNumDutiesOfType(typeIndex) - this.getNumDutiesOfType(typeIndex)) * config.scores.targetDutyNotMetImpactPerDay * (6 - dayIndex);
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

  setAssignment(dayIndex, type) {
    this.assignments[dayIndex] = type;
  }
}

function testLog(person) {
  for(let i = 0; i < person.getAssignments().length; i++) {
    console.log(i, person.getDutyScores(i));
  }
}

const exp = 2;
const andrey = new Person('Andrey', 6, 2, [false, true, true, true, false, true], [exp, exp]);
const korra = new Person('Korra', 6, 2, [true, false, false, false, true, true], [exp, exp]);
const anna = new Person('Anna', 6, 2, [false, false, false, false, false, false], [exp, exp])

const persons = [andrey, korra, anna];

for(let i = 0; i < 6; i++) {
  const averageDutyAssignments = calculateDutyAverage(persons);

  const scores = persons.map(person => person.getDutyScoreOfType(i, 0, averageDutyAssignments));
  const highestScoreIndex = scores.indexOf(Math.max(...scores));
  console.log(`Day ${i}: ${highestScoreIndex}/${persons[highestScoreIndex].getName()}`, averageDutyAssignments, scores);
  persons[highestScoreIndex].setAssignment(i, 0);
}






class DutySet {
  /**
   * Constructor for a DutySet.
   * @param {number} numDays Number of days that RAs are on duty in this set.
   * @param {number} numOnDuty Number of RAs that are on duty each night.
   * @param {Object.<string, Array<boolean>} availabilities Object of RA availabilities. Keys are
   *  RA names and values are arrays indicating for which days the RA is available. These arrays
   *  are looped/recycled to match the length of numDays.
   */
  constructor(numDays, numOnDuty, availabilities) {
    this.numDays = numDays;
    this.numOnDuty = numOnDuty;
    this.raNames = Object.keys(availabilities);
    this.dailyAvailability = this.calculateDailyAvailabilities(Object.values(availabilities));
    this.assignments = this.calculateAssignments(this.dailyAvailability, this.raNames.length);
  }

  calculateDailyAvailabilities(availabilities) {
    const dailyAvailability = [];

    for(let i = 0; i < this.numDays; i++) {
      const day = [];

      for(let j = 0; j < availabilities.length; j++) {
        const raAvailability = availabilities[j];
        // Loop/recycle values in availability arrays to match numDays length.
        if(raAvailability[i % raAvailability.length] === true) {
          day.push(j);
        }
      } 

      dailyAvailability[i] = day;
    }

    return(dailyAvailability);
  }

  calculateDutyScore(raId, prevAssignment, dayAvailability) {
    let score = 0;
    if(prevDay.includes(raId)) {
      score -= 100;
    }

// how many times they have been primary, secondary, etc
  }

  calculateAssignments(dailyAvailability, numRA) {
    // Reset assignments array to an empty state with null values.
    const assignments = calculateArray(this.numDays,
      () => createFilledArray(this.numOnDuty, null)
    );

    for(let i = 0; i < assignments.length; i++) {
      const prevAssignment = i > 0 ? assignments[i - 1] : [];
      const dayAvailability = dailyAvailability[i];
      const day = assignments[i];

      calculateArray(numRA,
        (raId) => {
          return 
        }
      )
    }

    return(assignments);
  }
}

const avail = {
  Andrey: [true, false, true, false, false],
  Korra: [true, true, false, false, true],
  John: [true, true, false, false, true]
}

const weekdays = new DutySet(10, 2, avail);
//console.log(weekdays)