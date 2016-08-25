import { interpolateString } from 'd3-interpolate';

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
  const aPoints = aNormalized == null ? [] : aNormalized.split(/(?=[MLCQAHV])/gi);
  const bPoints = bNormalized == null ? [] : bNormalized.split(/(?=[MLCQAHV])/gi);

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

  const numPointsToExtend = Math.abs(bPoints.length - aPoints.length);

  let aExtended = aNormalized;
  let bExtended = bNormalized;

  if (numPointsToExtend !== 0) {
    // B has more points than A, so add points to A before interpolating
    if (bPoints.length > aPoints.length) {
      const pointToAdd = aPoints[aPoints.length - 1].replace(/[MCQAHV]/, 'L');

      for (let i = 0; i < numPointsToExtend; i++) {
        aPoints.push(pointToAdd);
      }

      aExtended = aPoints.join('');

    // else if A has more points than B, add more points to B
    } else if (bPoints.length < aPoints.length) {
      const pointToAdd = bPoints[bPoints.length - 1].replace(/[MCQAHV]/, 'L');

      for (let i = 0; i < numPointsToExtend; i++) {
        bPoints.push(pointToAdd);
      }

      bExtended = bPoints.join('');
    }
  }

  // if both A and B end with Z add it back in
  if ((a == null || a[a.length - 1] === 'Z') &&
      (b == null || b[b.length - 1] === 'Z')) {
    aExtended += 'Z';
    bExtended += 'Z';
  }

  const stringInterpolator = interpolateString(aExtended, bExtended);

  return function pathInterpolator(t) {
    // at 1 return the final value without the extensions used during interpolation
    if (t === 1) {
      return b;
    }

    return stringInterpolator(t);
  };
}
