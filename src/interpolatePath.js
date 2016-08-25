import { interpolateString } from 'd3-interpolate';

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
}

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
    obj[param] = args[i];
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
  }
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
            aValue = aCommand[conversionMap[bKey]]
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
  const aNormalized = a == null ? null : a.replace(/[Z]/gi, '');
  const bNormalized = b == null ? null : b.replace(/[Z]/gi, '');
  const aPoints = aNormalized == null ? [] : aNormalized.split(/(?=[MLCSTQAHV])/gi);
  const bPoints = bNormalized == null ? [] : bNormalized.split(/(?=[MLCSTQAHV])/gi);

  // if both are empty, interpolation is always null.
  if (!aPoints.length && !bPoints.length) {
    return function nullInterpolator() {
      return null;
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
  const bCommands = bPoints.map(commandObject);

  // extend to match equal size
  const numPointsToExtend = Math.abs(bPoints.length - aPoints.length);

  if (numPointsToExtend !== 0) {
    // B has more points than A, so add points to A before interpolating
    if (bCommands.length > aCommands.length) {
      const commandToAdd = Object.assign({}, aCommands[aCommands.length - 1]);
      if (commandToAdd.type === 'M') {
        commandToAdd.type = 'L';
      }

      for (let i = 0; i < numPointsToExtend; i++) {
        aCommands.push(commandToAdd);
      }

    // else if A has more points than B, add more points to B
    } else if (bCommands.length < aCommands.length) {
      const commandToAdd = Object.assign({}, bCommands[bCommands.length - 1]);
      if (commandToAdd.type === 'M') {
        commandToAdd.type = 'L';
      }

      for (let i = 0; i < numPointsToExtend; i++) {
        bCommands.push(commandToAdd);
      }
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
      return b;
    }

    return stringInterpolator(t);
  };
}
