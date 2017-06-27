// points = [start, control1, control2, ..., end]
// t = number in [0, 1]
// inspired by https://pomax.github.io/bezierinfo/
// de Casteljau's algorithm for drawing/splitting bezier curves
function decasteljau(points, t) {
  const left = [];
  const right = [];

  function decasteljauRecurse(points, t) {
    if (points.length === 1) {
      left.push(points[0]);
      right.push(points[0])
    } else {
      const newPoints = Array(points.length - 1);

      for (let i = 0; i < newPoints.length; i++) {
        if (i === 0) {
          left.push(points[0]);
        }
        if (i === newPoints.length - 1) {
          right.push(points[i + 1]);
        }

        newPoints[i] = [
          (1 - t) * points[i][0] + t * points[i + 1][0],
          (1 - t) * points[i][1] + t * points[i + 1][1],
        ];
      }

      decasteljauRecurse(newPoints, t);
    }
  }

  if (points.length) {
    decasteljauRecurse(points, t);
  }

  return { left, right: right.reverse() };
}

// points = [start, control1, control2, ..., end]
function pointsToCommand(points) {
  const command = {};

  if (points.length === 4) {
    command.x2 = points[2][0];
    command.y2 = points[2][1];
  }
  if (points.length >= 3) {
    command.x1 = points[1][0];
    command.y1 = points[1][1];
  }

  command.x = points[points.length - 1][0];
  command.y = points[points.length - 1][1];

  if (points.length === 4) { // start, control1, control2, end
    command.type = 'C';
  } else if (points.length === 3) { // start, control, end
    command.type = 'Q';
  } else { // start, end
    command.type = 'L';
  }

  return command;
}



function splitCurveAsPoints(points, segmentCount) {
  segmentCount = segmentCount || 2;

  const segments = [];

  let t = 0;
  let remainingCurve = points;

  const tIncrement = 1 / segmentCount;


  // x-----x-----x-----x
  // t=  0.33   0.66   1
  // x-----o-----------x
  // r=  0.33
  //       x-----o-----x
  // r=         0.5  (0.33 / (1 - 0.33))  === tIncrement / (1 - (tIncrement * (i - 1))


  // x-----x-----x-----x----x
  // t=  0.25   0.5   0.75  1
  // x-----o----------------x
  // r=  0.25
  //       x-----o----------x
  // r=         0.33  (0.25 / (1 - 0.25))
  //             x-----o----x
  // r=         0.5  (0.25 / (1 - 0.5))

  for (let i = 0; i < segmentCount - 1; i++) {
    const tRelative = tIncrement / (1 - (tIncrement * (i)));
    const split = decasteljau(remainingCurve, tRelative);
    segments.push(split.left);
    remainingCurve = split.right;
  }

  // last segment is just to the end from the last point
  segments.push(remainingCurve);

  return segments;
}



export function splitCurve(commandStart, commandEnd, segmentCount) {
  const points = [[commandStart.x, commandStart.y]];
  if (commandEnd.x1 != null) {
    points.push([commandEnd.x1, commandEnd.y1]);
  }
  if (commandEnd.x2 != null) {
    points.push([commandEnd.x2, commandEnd.y2])
  }
  points.push([commandEnd.x, commandEnd.y]);

  return splitCurveAsPoints(points, segmentCount).map(pointsToCommand);
}
