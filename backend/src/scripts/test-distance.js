import {
  calculateHaversineDistance,
  isValidCoordinate,
  CITY_COORDINATES
} from '../utils/distance.js';

console.log('=== Unit Tests: Haversine Distance & Coordinate Validation ===');

// 1. Coordinate Validation Tests
console.log('\n--- 1. Testing Coordinate Validation ---');
const c1 = isValidCoordinate(19.076, 72.877);
console.log('  Valid Mumbai coords:', c1, c1 === true ? 'PASS' : 'FAIL');

const c2 = isValidCoordinate(91, 72.877);
console.log('  Latitude 91 (> 90):', c2, c2 === false ? 'PASS' : 'FAIL');

const c3 = isValidCoordinate(-91, 72.877);
console.log('  Latitude -91 (< -90):', c3, c3 === false ? 'PASS' : 'FAIL');

const c4 = isValidCoordinate(19.076, 181);
console.log('  Longitude 181 (> 180):', c4, c4 === false ? 'PASS' : 'FAIL');

const c5 = isValidCoordinate('invalid', 72);
console.log('  NaN latitude:', c5, c5 === false ? 'PASS' : 'FAIL');

// 2. Haversine Distance Calculation Tests
console.log('\n--- 2. Testing Haversine Distance Calculations ---');
const dZero = calculateHaversineDistance(19.076, 72.8777, 19.076, 72.8777);
console.log('  Distance to same point (expected 0.0):', dZero, dZero === 0 ? 'PASS' : 'FAIL');

const dMumbaiPune = calculateHaversineDistance(
  CITY_COORDINATES.mumbai.latitude,
  CITY_COORDINATES.mumbai.longitude,
  CITY_COORDINATES.pune.latitude,
  CITY_COORDINATES.pune.longitude
);
console.log('  Mumbai to Pune distance (expected ~118-120 km):', dMumbaiPune, 'km');
const passMumbaiPune = dMumbaiPune >= 115 && dMumbaiPune <= 125;
console.log('  Result:', passMumbaiPune ? 'PASS' : 'FAIL');

const dDelhiBlr = calculateHaversineDistance(
  CITY_COORDINATES.delhi.latitude,
  CITY_COORDINATES.delhi.longitude,
  CITY_COORDINATES.bengaluru.latitude,
  CITY_COORDINATES.bengaluru.longitude
);
console.log('  Delhi to Bengaluru distance (expected ~1740 km):', dDelhiBlr, 'km');
const passDelhiBlr = dDelhiBlr >= 1700 && dDelhiBlr <= 1780;
console.log('  Result:', passDelhiBlr ? 'PASS' : 'FAIL');

const dInvalid = calculateHaversineDistance(999, 10, 19, 72);
console.log('  Distance with out-of-range coordinates (expected null):', dInvalid, dInvalid === null ? 'PASS' : 'FAIL');

if (c1 && !c2 && !c3 && !c4 && !c5 && dZero === 0 && passMumbaiPune && passDelhiBlr && dInvalid === null) {
  console.log('\nAll Haversine and coordinate unit tests passed!');
  process.exit(0);
} else {
  console.error('\nUnit tests failed.');
  process.exit(1);
}
