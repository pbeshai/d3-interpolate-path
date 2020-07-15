/* eslint-disable */
const tape = require('tape');
const interpolatePathCommands = require('../').interpolatePathCommands;
const APPROX_MAX_T = 0.999999999999;

// helper to ensure path1 and path2 are roughly equal
function approximatelyEqual(path1Commands, path2Commands) {
  const epsilon = 0.001;

  if (path1Commands.length !== path2Commands.length) {
    return false;
  }

  for (let i = 0; i < path1Commands.length; i++) {
    const path1Command = path1Commands[i];
    const path2Command = path2Commands[i];
    if (Object.keys(path1Command).length !== Object.keys(path2Command).length) {
      return false;
    }

    for (let key in path1Commands[i]) {
      if (
        typeof path1Command[key] === 'string' &&
        path1Command[key] !== path2Command[key]
      ) {
        return false;
      }

      // otherwise it's a number, check if approximately equal
      if (Math.abs(path1Command[key] - path2Command[key]) > epsilon) {
        return false;
      }
    }
  }

  return true;
}

tape(
  'interpolatePathCommands() interpolates line to line: len(A) = len(b)',
  function (t) {
    const a = [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 10 },
      { type: 'L', x: 100, y: 100 },
    ];

    const b = [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 20, y: 20 },
      { type: 'L', x: 200, y: 200 },
    ];

    const interpolator = interpolatePathCommands(a, b);

    t.same(interpolator(0), a);
    t.same(interpolator(1), b);
    t.same(interpolator(0.5), [
      { type: 'M', x: 5, y: 5 },
      { type: 'L', x: 15, y: 15 },
      { type: 'L', x: 150, y: 150 },
    ]);

    t.end();
  }
);

tape(
  'interpolatePathCommands() interpolates line to line: len(A) > len(b)',
  function (t) {
    const aCommands = [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 10 },
      { type: 'L', x: 100, y: 100 },
    ];
    const bCommands = [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 20, y: 20 },
    ];

    ('M10,10L20,20');

    const interpolator = interpolatePathCommands(aCommands, bCommands);

    t.same(interpolator(0), aCommands);

    // should not be extended anymore and should match exactly
    t.same(interpolator(1), bCommands);

    t.equal(
      approximatelyEqual(interpolator(APPROX_MAX_T), [
        { type: 'M', x: 10, y: 10 },
        { type: 'L', x: 15, y: 15 },
        { type: 'L', x: 20, y: 20 },
      ]),
      true
    );

    // should be half way between the last point of B and the last point of A
    // here we get 12.5 since we split the 10,10-20,20 segment and end at L15,15
    t.same(interpolator(0.5), [
      { type: 'M', x: 5, y: 5 },
      { type: 'L', x: 12.5, y: 12.5 },
      { type: 'L', x: 60, y: 60 },
    ]);

    t.end();
  }
);

tape(
  'interpolatePathCommands() interpolates line to line: len(A) < len(b)',
  function (t) {
    const a = [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 10 },
    ];
    const b = [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 20, y: 20 },
      { type: 'L', x: 200, y: 200 },
    ];

    const interpolator = interpolatePathCommands(a, b);

    // should be extended to match the length of b
    t.same(interpolator(0), [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 5, y: 5 },
      { type: 'L', x: 10, y: 10 },
    ]);

    t.equal(
      approximatelyEqual(interpolator(APPROX_MAX_T), [
        { type: 'M', x: 10, y: 10 },
        { type: 'L', x: 20, y: 20 },
        { type: 'L', x: 200, y: 200 },
      ]),
      true
    );

    // should be half way between the last point of B and the last point of A
    t.same(interpolator(0.5), [
      { type: 'M', x: 5, y: 5 },
      { type: 'L', x: 12.5, y: 12.5 },
      { type: 'L', x: 105, y: 105 },
    ]);

    t.end();
  }
);

tape('interpolatePathCommands() interpolates line to line: len(A)=1', function (
  t
) {
  const a = [{ type: 'M', x: 0, y: 0 }, { type: 'Z' }];
  const b = [
    { type: 'M', x: 10, y: 10 },
    { type: 'L', x: 20, y: 20 },
    { type: 'L', x: 200, y: 200 },
  ];

  const interpolator = interpolatePathCommands(a, b);

  // should be extended to match the length of b
  t.same(interpolator(0), [
    { type: 'M', x: 0, y: 0 },
    { type: 'L', x: 0, y: 0 },
    { type: 'L', x: 0, y: 0 },
  ]);
  t.equal(interpolator(1), b);

  // should be half way between the last point of B and the last point of A
  t.same(interpolator(0.5), [
    { type: 'M', x: 5, y: 5 },
    { type: 'L', x: 10, y: 10 },
    { type: 'L', x: 100, y: 100 },
  ]);

  t.end();
});

tape('interpolatePathCommands() interpolates line to line: len(B)=1', function (
  t
) {
  const a = [
    { type: 'M', x: 0, y: 0 },
    { type: 'L', x: 10, y: 10 },
    { type: 'L', x: 100, y: 100 },
  ];
  const b = [{ type: 'M', x: 10, y: 10 }, { type: 'Z' }];

  const interpolator = interpolatePathCommands(a, b);

  t.same(interpolator(0), a);

  // should not be extended anymore and should match exactly
  t.equal(interpolator(1), b);

  // should be half way between the last point of B and the last point of A
  t.same(interpolator(0.5), [
    { type: 'M', x: 5, y: 5 },
    { type: 'L', x: 10, y: 10 },
    { type: 'L', x: 55, y: 55 },
  ]);

  t.end();
});

tape(
  'interpolatePathCommands() interpolates line to line: A is null',
  function (t) {
    const a = null;
    const b = [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 20, y: 20 },
      { type: 'L', x: 200, y: 200 },
    ];

    //'M10,10L20,20L200,200';

    const interpolator = interpolatePathCommands(a, b);

    // should be extended to match the length of b
    t.same(interpolator(0), [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 10, y: 10 },
      { type: 'L', x: 10, y: 10 },
    ]);
    t.equal(interpolator(1), b);

    // should be half way between the last point of B and the last point of A
    t.same(interpolator(0.5), [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 15, y: 15 },
      { type: 'L', x: 105, y: 105 },
    ]);

    t.end();
  }
);

tape(
  'interpolatePathCommands() interpolates line to line: B is null',
  function (t) {
    const a = [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 10 },
      { type: 'L', x: 100, y: 100 },
    ];

    const b = null;

    const interpolator = interpolatePathCommands(a, b);

    t.same(interpolator(0), a);
    t.same(interpolator(1), []);

    // should be halfway towards the first point of a
    t.same(interpolator(0.5), [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 5, y: 5 },
      { type: 'L', x: 50, y: 50 },
    ]);

    t.end();
  }
);

tape(
  'interpolatePathCommands() interpolates line to line: A is null and B is null',
  function (t) {
    const a = null;
    const b = null;

    const interpolator = interpolatePathCommands(a, b);

    t.same(interpolator(0), []);
    t.same(interpolator(1), []);

    // should be halfway towards the first point of a
    t.same(interpolator(0.5), []);

    t.end();
  }
);

tape(
  'interpolatePathCommands() interpolates where both A and B end in Z',
  function (t) {
    const a = [{ type: 'M', x: 0, y: 0 }, { type: 'Z' }];
    const b = [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 20, y: 20 },
      { type: 'Z' },
    ];

    const interpolator = interpolatePathCommands(a, b);

    t.same(interpolator(0), [
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 0, y: 0 },
      { type: 'Z' },
    ]);

    t.equal(interpolator(1), b);

    // should be halfway towards the first point of a

    t.same(interpolator(0.5), [
      { type: 'M', x: 5, y: 5 },
      { type: 'L', x: 10, y: 10 },
      { type: 'Z' },
    ]);

    t.end();
  }
);

tape(
  'interpolatePathCommands() interpolates where A=null, B ends in Z',
  function (t) {
    const a = null;
    const b = [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 20, y: 20 },
      { type: 'Z' },
    ];

    const interpolator = interpolatePathCommands(a, b);

    t.same(interpolator(0), [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 10, y: 10 },
      { type: 'Z' },
    ]);
    t.equal(interpolator(1), b);

    // should be halfway towards the first point of a
    t.same(interpolator(0.5), [
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 15, y: 15 },
      { type: 'Z' },
    ]);

    t.end();
  }
);
