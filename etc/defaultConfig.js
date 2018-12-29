// Default config for DutySet.
module.exports = {
  scores: {
    unavailableImpact: -50,         // Impact on score if person is unavailable.
    targetDutyCountMetImpact: -100, // Impact on score if person has already met target number of duties.
    belowAverageImpact: +50,        // Impact on score if person is assigned to a below-average amount of duties at a given time.
    recentDuty: {
      dayBeforeImpact: -20,         // Impact on score if person has recently been on duty.
      numDaysEffect: 2              // How many days score will be impacted if a person was recently on duty.
    }
  }
}