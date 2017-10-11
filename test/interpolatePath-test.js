/* eslint-disable */
const tape = require('tape');
const interpolatePath = require('../').interpolatePath;
const APPROX_MAX_T = 0.999999999999;
const MIN_T = 0;

// helper to convert a path string to an array (e.g. 'M5,5 L10,10' => ['M', 5, 5, 'L', 10, 10]
function pathToItems(path) {
  return path
    .replace(/\s/g, '')
    .split(/([A-Z,])/)
    .filter(d => d !== '' && d !== ',')
    .map(d => (isNaN(+d) ? d : +d))
}

// helper to ensure path1 and path2 are roughly equal
function approximatelyEqual(path1, path2) {
  // convert to numbers and letters
  const path1Items = pathToItems(path1);
  const path2Items = pathToItems(path2);
  const epsilon = 0.001;

  if (path1Items.length !== path2Items.length) {
    return false;
  }

  for (let i = 0; i< path1Items.length; i++) {
    if (typeof path1Items[i] === 'string' && path1Items[i] !== path2Items[i]) {
      return false;
    }

    // otherwise it's a number, check if approximately equal
    if (Math.abs(path1Items[i] - path2Items[i]) > epsilon) {
      return false;
    }
  }

  return true;
}


tape('interpolatePath() interpolates line to line: len(A) = len(b)', function (t) {
  const a = 'M0,0L10,10L100,100';
  const b = 'M10,10L20,20L200,200';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), a);
  t.equal(interpolator(1), b);
  t.equal(interpolator(0.5), 'M5,5L15,15L150,150');

  t.end();
});

tape('interpolatePath() interpolates line to line: len(A) > len(b)', function (t) {
  const a = 'M0,0L10,10L100,100';
  const b = 'M10,10L20,20';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), a);

  // should not be extended anymore and should match exactly
  t.equal(interpolator(1), b);
  t.equal(approximatelyEqual(interpolator(APPROX_MAX_T), 'M10,10L15,15L20,20'), true);

  // should be half way between the last point of B and the last point of A
  // here we get 12.5 since we split the 10,10-20,20 segment and end at L15,15
  t.equal(interpolator(0.5), 'M5,5L12.5,12.5L60,60');

  t.end();
});


tape('interpolatePath() interpolates line to line: len(A) < len(b)', function (t) {
  const a = 'M0,0L10,10';
  const b = 'M10,10L20,20L200,200';

  const interpolator = interpolatePath(a, b);

  // should be extended to match the length of b
  t.equal(interpolator(0), 'M0,0L5,5L10,10');
  t.equal(approximatelyEqual(interpolator(APPROX_MAX_T), 'M10,10L20,20L200,200'), true);

  // should be half way between the last point of B and the last point of A
  t.equal(interpolator(0.5), 'M5,5L12.5,12.5L105,105');

  t.end();
});


tape('interpolatePath() interpolates line to line: len(A)=1', function (t) {
  const a = 'M0,0Z';
  const b = 'M10,10L20,20L200,200';

  const interpolator = interpolatePath(a, b);

  // should be extended to match the length of b
  t.equal(interpolator(0), 'M0,0L0,0L0,0');
  t.equal(interpolator(1), b);

  // should be half way between the last point of B and the last point of A
  t.equal(interpolator(0.5), 'M5,5L10,10L100,100');

  t.end();
});


tape('interpolatePath() interpolates line to line: len(B)=1', function (t) {
  const a = 'M0,0L10,10L100,100';
  const b = 'M10,10Z';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), a);

  // should not be extended anymore and should match exactly
  t.equal(interpolator(1), b);

  // should be half way between the last point of B and the last point of A
  t.equal(interpolator(0.5), 'M5,5L10,10L55,55');

  t.end();
});

tape('interpolatePath() interpolates line to line: A is null', function (t) {
  const a = null;
  const b = 'M10,10L20,20L200,200';

  const interpolator = interpolatePath(a, b);

  // should be extended to match the length of b
  t.equal(interpolator(0), 'M10,10L10,10L10,10');
  t.equal(interpolator(1), b);

  // should be half way between the last point of B and the last point of A
  t.equal(interpolator(0.5), 'M10,10L15,15L105,105');

  t.end();
});


tape('interpolatePath() interpolates line to line: B is null', function (t) {
  const a = 'M0,0L10,10L100,100';
  const b = null;

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), a);
  t.equal(interpolator(1), '');

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M0,0L5,5L50,50');

  t.end();
});


tape('interpolatePath() interpolates line to line: A is null and B is null', function (t) {
  const a = null;
  const b = null;

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), '');
  t.equal(interpolator(1), '');

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), '');

  t.end();
});

tape('interpolatePath() interpolates where both A and B end in Z', function (t) {
  const a = 'M0,0Z';
  const b = 'M10,10L20,20Z';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), 'M0,0L0,0Z');
  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M5,5L10,10Z');

  t.end();
});

tape('interpolatePath() interpolates where A=null, B ends in Z', function (t) {
  const a = null;
  const b = 'M10,10L20,20Z';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), 'M10,10L10,10Z');
  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M10,10L15,15Z');

  t.end();
});


tape('interpolatePath() interpolates with other valid `d` characters', function (t) {
  const a = 'M0,0m0,0L0,0l0,0H0V0Q0,0,0,0q0,0,0,0C0,0,0,0,0,0c0,0,0,0,0,0T0,0t0,0'+
    'S0,0,0,0s0,0,0,0A0,0,0,0,0,0,0';
  const b = 'M4,4m4,4L4,4l4,4H4V4Q4,4,4,4q4,4,4,4C4,4,4,4,4,4c4,4,4,4,4,4T4,4t4,4'+
    'S4,4,4,4s4,4,4,4A4,4,1,1,1,4,4';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), a);
  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M2,2m2,2L2,2l2,2H2V2Q2,2,2,2q2,2,2,2C2,2,2,2,2,2c2,2,2,2,2,2'+
    'T2,2t2,2S2,2,2,2s2,2,2,2A2,2,0.5,0.5,0.5,2,2');

  t.end();
});

tape('interpolatePath() converts points in A to match types in B', function (t) {
  const a = 'M2,2 L3,3          C4,4,4,4,4,4 C5,5,5,5,5,5  L6,6  L7,7';
  const b = 'M4,4 C5,5,5,5,5,5  L6,6         S7,7,7,7      H8    V9';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), 'M2,2C3,3,3,3,3,3L4,4S5,5,5,5H6V7');
  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M3,3C4,4,4,4,4,4L5,5S6,6,6,6H7V8');

  t.end();
});


tape('interpolatePath() interpolates curves of different length', function (t) {
  const a = 'M0,0C1,1,2,2,4,4C3,3,4,4,6,6';
  const b = 'M2,2C5,5,6,6,4,4C6,6,7,7,5,5C8,8,9,9,6,6C10,10,11,11,7,7';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0),
    'M0,0C0.5,0.5,1,1,1.625,1.625C2.25,2.25,3,3,4,4C3.5,3.5,3.5,3.5,3.875,3.875C4.25,4.25,5,5,6,6');

  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M1,1C2.75,2.75,3.5,3.5,2.8125,2.8125C4.125,4.125,5,5,' +
    '4.5,4.5C5.75,5.75,6.25,6.25,4.9375,4.9375C7.125,7.125,8,8,6.5,6.5');

  t.end();
});


tape('interpolatePath() handles the case where path commands are followed by a space', function (t) {
  // IE bug fix.
  const a = 'M 0 0 L 10 10 L 100 100';
  const b = 'M10,10L20,20';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), 'M0,0L10,10L100,100');

  // should not be extended anymore and should match exactly
  t.equal(interpolator(1), b);
  t.equal(approximatelyEqual(interpolator(APPROX_MAX_T), 'M10,10L15,15L20,20'), true);

  // should be half way between the last point of B and the last point of A
  // here we get 12.5 since we split the 10,10-20,20 segment and end at L15,15
  t.equal(interpolator(0.5), 'M5,5L12.5,12.5L60,60');

  t.end();
});


tape('interpolatePath() includes M when extending if it is the only item', function (t) {
  const a = 'M0,0';
  const b = 'M10,10L20,20L30,30';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), 'M0,0L0,0L0,0');

  // should not be extended anymore and should match exactly
  t.equal(interpolator(1), b);

  // should be half way between the last point of B and the last point of A
  t.equal(interpolator(0.5), 'M5,5L10,10L15,15');

  t.end();
});


tape('interpolatePath() handles negative numbers properly', function (t) {
  const a = 'M0,0L0,0';
  const b = 'M-10,-10L20,20';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), 'M0,0L0,0');
  t.equal(interpolator(1), b);

  // should be half way between the last point of B and the last point of A
  t.equal(interpolator(0.5), 'M-5,-5L10,10');

  t.end();
});


tape('interpolatePath() handles leading spaces', function (t) {
  const a = '       M0,0L10,10L100,100';
  const b = `

        \tM10,10L20,20L200,200`;

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), 'M0,0L10,10L100,100');
  t.equal(interpolator(1), b);
  t.equal(interpolator(0.5), 'M5,5L15,15L150,150');

  t.end();
});