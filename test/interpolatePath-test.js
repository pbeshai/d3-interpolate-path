/* eslint-disable */
var tape = require('tape'),
    interpolatePath = require('../').interpolatePath;

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

  // should be half way between the last point of B and the last point of A
  t.equal(interpolator(0.5), 'M5,5L15,15L60,60');

  t.end();
});


tape('interpolatePath() interpolates line to line: len(A) < len(b)', function (t) {
  const a = 'M0,0L10,10';
  const b = 'M10,10L20,20L200,200';

  const interpolator = interpolatePath(a, b);

  // should be extended to match the length of b
  t.equal(interpolator(0), 'M0,0L10,10L10,10');
  t.equal(interpolator(1), b);

  // should be half way between the last point of B and the last point of A
  t.equal(interpolator(0.5), 'M5,5L15,15L105,105');

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
  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M0,0L5,5L50,50');

  t.end();
});


tape('interpolatePath() interpolates line to line: A is null and B is null', function (t) {
  const a = null;
  const b = null;

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), null);
  t.equal(interpolator(1), null);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), null);

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
    'S4,4,4,4s4,4,4,4A4,4,4,4,4,4,4';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), a);
  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M2,2m2,2L2,2l2,2H2V2Q2,2,2,2q2,2,2,2C2,2,2,2,2,2c2,2,2,2,2,2'+
    'T2,2t2,2S2,2,2,2s2,2,2,2A2,2,2,2,2,2,2');

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
  const a = 'M0,0L0,0C0,0,0,0,0,0C0,0,0,0,0,0L0,0';
  const b = 'M4,4L4,4C4,4,4,4,4,4C4,4,4,4,4,4C4,4,4,4,4,4C4,4,4,4,4,4L4,4';


  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), 'M0,0L0,0C0,0,0,0,0,0C0,0,0,0,0,0C0,0,0,0,0,0C0,0,0,0,0,0L0,0');
  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M2,2L2,2C2,2,2,2,2,2C2,2,2,2,2,2C2,2,2,2,2,2C2,2,2,2,2,2L2,2');

  t.end();
});
