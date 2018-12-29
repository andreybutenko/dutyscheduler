const DutySet = require('./models/DutySet.js');
const Person = require('./models/Person.js');

const dutySet = new DutySet(6, 2, { scores: { recentDuty: { dayBeforeImpact: +10000 } } });
console.log(dutySet.getConfig())
dutySet.addPerson(new Person('Andrey', [false, true, true, true, false, true], dutySet));
dutySet.addPerson(new Person('Korra', [true, false, false, false, true, true], dutySet));
dutySet.addPerson(new Person('Anna', [false, true, false, true, false, false], dutySet));
console.log('SCHEDULE: ', dutySet.calculateSchedule(true));
console.log('AVAILABLE: ', dutySet.getAvailabilities());