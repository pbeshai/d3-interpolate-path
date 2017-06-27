import { interpolateString } from 'd3-interpolate';
import { splitCurve } from './split';

/**
 * List of params for each command type in a path `d` attribute
 */
const typeMap = {
  M: ['x', 'y'],
  L: ['x', 'y'],
  H: ['x'],
  V: ['y'],
  C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  S: ['x2', 'y2', 'x', 'y'],
  Q: ['x1', 'y1', 'x', 'y'],
  T: ['x', 'y'],
  A: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'],
};

/**
 * Convert to object representation of the command from a string
 *
 * @param {String} commandString Token string from the `d` attribute (e.g., L0,0)
 * @return {Object} An object representing this command.
 */
function commandObject(commandString) {
  // convert all spaces to commas
  commandString = commandString.trim().replace(/ /g, ',');

  const type = commandString[0];
  const args = commandString.substring(1).split(',');
  return typeMap[type.toUpperCase()].reduce((obj, param, i) => {
    // parse X as float since we need it to do distance checks for extending points
    obj[param] = +args[i];
    return obj;
  }, { type });
}

/**
 * Converts a command object to a string to be used in a `d` attribute
 * @param {Object} command A command object
 * @return {String} The string for the `d` attribute
 */
function commandToString(command) {
  const { type } = command;
  const params = typeMap[type.toUpperCase()];
  return `${type}${params.map(p => command[p]).join(',')}`;
}

/**
 * Converts command A to have the same type as command B.
 *
 * e.g., L0,5 -> C0,5,0,5,0,5
 *
 * Uses these rules:
 * x1 <- x
 * x2 <- x
 * y1 <- y
 * y2 <- y
 * rx <- 0
 * ry <- 0
 * xAxisRotation <- read from B
 * largeArcFlag <- read from B
 * sweepflag <- read from B
 *
 * @param {Object} aCommand Command object from path `d` attribute
 * @param {Object} bCommand Command object from path `d` attribute to match against
 * @return {Object} aCommand converted to type of bCommand
 */
function convertToSameType(aCommand, bCommand) {
  const conversionMap = {
    x1: 'x',
    y1: 'y',
    x2: 'x',
    y2: 'y',
  };

  const readFromBKeys = ['xAxisRotation', 'largeArcFlag', 'sweepFlag'];

  // convert (but ignore M types)
  if (aCommand.type !== bCommand.type && bCommand.type.toUpperCase() !== 'M') {
    const aConverted = {};
    Object.keys(bCommand).forEach(bKey => {
      const bValue = bCommand[bKey];
      // first read from the A command
      let aValue = aCommand[bKey];

      // if it is one of these values, read from B no matter what
      if (aValue === undefined) {
        if (readFromBKeys.includes(bKey)) {
          aValue = bValue;
        } else {
          // if it wasn't in the A command, see if an equivalent was
          if (aValue === undefined && conversionMap[bKey]) {
            aValue = aCommand[conversionMap[bKey]];
          }

          // if it doesn't have a converted value, use 0
          if (aValue === undefined) {
            aValue = 0;
          }
        }
      }

      aConverted[bKey] = aValue;
    });

    // update the type to match B
    aConverted.type = bCommand.type;
    aCommand = aConverted;
  }

  return aCommand;
}

// helper function to interpolate between commandStart and commandEnd segmentCount times
function splitSegment(commandStart, commandEnd, segmentCount) {
  let segments = [];

  // ensure M command is put in in addition to the split segment
  if (commandStart.type === 'M') {
    segments.push(commandStart);
  }

  if (commandEnd.type === 'L' || commandEnd.type === 'Q' || commandEnd.type === 'C') {
    segments = segments.concat(splitCurve(commandStart, commandEnd, segmentCount));

  // general case - just copy the same point
  } else {
    const copyCommand = Object.assign({}, commandStart);
    segments = segments.concat(Array(segmentCount - 1).fill(0).map(() => copyCommand));
    segments.push(commandEnd);
  }

  return segments;
}

/**
 * Extends an array of commands to the length of the second array
 * inserting points at the spot that is closest by X value. Ensures
 * all the points of commandsToExtend are in the extended array and that
 * only numPointsToExtend points are added.
 *
 * @param {Object[]} commandsToExtend The commands array to extend
 * @param {Object[]} referenceCommands The commands array to match
 * @return {Object[]} The extended commands1 array
 */
function extend(commandsToExtend, referenceCommands) {
  // compute insertion points
  const numSegments = commandsToExtend.length - 1;

  // 1 goes to the final vertex, others are divided among segments
  const numPointsForSegments = referenceCommands.length - 1;

  const pointIndexIncrement = numSegments / numPointsForSegments;
  // TODO: handle special case 0 segments
  // TODO: consider referenceCommands.length = 1 so numPoints = 0

  // 0 = segment 0-1, 1 = segment 1-2, n-1 = last vertex
  const countPointsPerSegment = Array(numPointsForSegments).fill(0)
    .reduce((accum, d, i) => {
      const insertIndex = Math.floor(pointIndexIncrement * i);
      accum[insertIndex] = (accum[insertIndex] || 0) + 1;
      return accum;
    }, []);

  // extend each segment to have the correct number of points for a smooth interpolation
  const extended = countPointsPerSegment.reduce((extended, segmentCount, i) => {
    if (i === commandsToExtend.length - 1) {
      return extended.concat(commandsToExtend[commandsToExtend.length - 1]);
    }

    return extended.concat(splitSegment(commandsToExtend[i], commandsToExtend[i + 1],
      segmentCount));
  }, []);

  return extended;
}

/**
 * Interpolate from A to B by extending A and B during interpolation to have
 * the same number of points. This allows for a smooth transition when they
 * have a different number of points.
 *
 * Ignores the `Z` character in paths unless both A and B end with it.
 *
 * @param {String} a The `d` attribute for a path
 * @param {String} b The `d` attribute for a path
 */
export default function interpolatePath(a, b) {
  // remove Z, remove spaces after letters as seen in IE
  const aNormalized = a == null ? '' : a.replace(/[Z]/gi, '').replace(/([MLCSTQAHV])\s*/gi, '$1');
  const bNormalized = b == null ? '' : b.replace(/[Z]/gi, '').replace(/([MLCSTQAHV])\s*/gi, '$1');
  const aPoints = aNormalized === '' ? [] : aNormalized.split(/(?=[MLCSTQAHV])/gi);
  const bPoints = bNormalized === '' ? [] : bNormalized.split(/(?=[MLCSTQAHV])/gi);

  // if both are empty, interpolation is always the empty string.
  if (!aPoints.length && !bPoints.length) {
    return function nullInterpolator() {
      return '';
    };
  }

  // if A is empty, treat it as if it used to contain just the first point
  // of B. This makes it so the line extends out of from that first point.
  if (!aPoints.length) {
    aPoints.push(bPoints[0]);

  // otherwise if B is empty, treat it as if it contains the first point
  // of A. This makes it so the line retracts into the first point.
  } else if (!bPoints.length) {
    bPoints.push(aPoints[0]);
  }

  // convert to command objects so we can match types
  let aCommands = aPoints.map(commandObject);
  let bCommands = bPoints.map(commandObject);

  // extend to match equal size
  const numPointsToExtend = Math.abs(bPoints.length - aPoints.length);

  if (numPointsToExtend !== 0) {
    // B has more points than A, so add points to A before interpolating
    if (bCommands.length > aCommands.length) {
      aCommands = extend(aCommands, bCommands);

    // else if A has more points than B, add more points to B
    } else if (bCommands.length < aCommands.length) {
      bCommands = extend(bCommands, aCommands);
    }
  }

  // commands have same length now.
  // convert A to the same type of B
  aCommands = aCommands.map((aCommand, i) => convertToSameType(aCommand, bCommands[i]));

  let aProcessed = aCommands.map(commandToString).join('');
  let bProcessed = bCommands.map(commandToString).join('');

  // if both A and B end with Z add it back in
  if ((a == null || a[a.length - 1] === 'Z') &&
      (b == null || b[b.length - 1] === 'Z')) {
    aProcessed += 'Z';
    bProcessed += 'Z';
  }

  const stringInterpolator = interpolateString(aProcessed, bProcessed);

  return function pathInterpolator(t) {
    // at 1 return the final value without the extensions used during interpolation
    if (t === 1) {
      // return stringInterpolator(1);
      return b == null ? '' : b;
    }

    return stringInterpolator(t);
  };
}
