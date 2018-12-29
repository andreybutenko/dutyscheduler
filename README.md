# Duty Scheduler

A Javascript library for creating duty schedules. [View on NPM](https://www.npmjs.com/package/@andreybutenko/dutyscheduler) and install with: 

```npm i @andreybutenko/dutyscheduler```

## Example Code

```javascript
const DutySet = require('./models/DutySet.js');
const Person = require('./models/Person.js');

const dutySet = new DutySet(6, 2);
dutySet.addPerson(new Person('Andrey', [false, true, true, true, false, true], dutySet));
dutySet.addPerson(new Person('Korra', [true, false, false, false, true, true], dutySet));
dutySet.addPerson(new Person('Anna', [false, true, false, true, false, false], dutySet));

console.log('SCHEDULE: \n', dutySet.calculateSchedule());
console.log('AVAILABILITIES: \n', dutySet.getAvailabilities());
```

### Result

```
SCHEDULE:
 [ [ 'Korra', 'Andrey' ],
  [ 'Andrey', 'Anna' ],
  [ 'Anna', 'Andrey' ],
  [ 'Andrey', 'Korra' ],
  [ 'Korra', 'Anna' ],
  [ 'Anna', 'Korra' ] ]
AVAILABILITIES:
 [ [ 'Korra' ],
  [ 'Andrey', 'Anna' ],
  [ 'Andrey' ],
  [ 'Andrey', 'Anna' ],
  [ 'Korra' ],
  [ 'Andrey', 'Korra' ] ]
```