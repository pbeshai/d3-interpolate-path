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
  const a = 'M0,0 m0,0 L0,0 l0,0 H0 V0 Q0,0 0,0 q0,0 0,0 C0,0 0,0 0,0 c0,0 0,0 0,0 T0,0 t0,0 ' +
   'S0,0 0,0 s0,0 0,0 A 0,0 0 0,0 0,0';
  const b = 'M4,4 m4,4 L4,4 l4,4 H4 V4 Q4,4 4,4 q4,4 4,4 C4,4 4,4 4,4 c4,4 4,4 4,4 T4,4 t4,4 ' +
   'S4,4 4,4 s4,4 4,4 A 4,4 4 4,4 4,4';

  const interpolator = interpolatePath(a, b);

  t.equal(interpolator(0), a);
  t.equal(interpolator(1), b);

  // should be halfway towards the first point of a
  t.equal(interpolator(0.5), 'M2,2 m2,2 L2,2 l2,2 H2 V2 Q2,2 2,2 q2,2 2,2 C2,2 2,2 2,2 c2,2 2,2 2,2 ' +
    'T2,2 t2,2 S2,2 2,2 s2,2 2,2 A 2,2 2 2,2 2,2');

  t.end();
});


