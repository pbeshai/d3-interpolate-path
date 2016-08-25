(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-interpolate')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-interpolate'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3));
}(this, (function (exports,d3Interpolate) { 'use strict';

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
function interpolatePath(a, b) {
  var aNormalized = a == null ? null : a.replace(/[Z]/gi, '');
  var bNormalized = b == null ? null : b.replace(/[Z]/gi, '');
  var aPoints = aNormalized == null ? [] : aNormalized.split(/(?=[MLCQAHV])/gi);
  var bPoints = bNormalized == null ? [] : bNormalized.split(/(?=[MLCQAHV])/gi);

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

  var numPointsToExtend = Math.abs(bPoints.length - aPoints.length);

  var aExtended = aNormalized;
  var bExtended = bNormalized;

  if (numPointsToExtend !== 0) {
    // B has more points than A, so add points to A before interpolating
    if (bPoints.length > aPoints.length) {
      var pointToAdd = aPoints[aPoints.length - 1].replace(/[MCQAHV]/, 'L');

      for (var i = 0; i < numPointsToExtend; i++) {
        aPoints.push(pointToAdd);
      }

      aExtended = aPoints.join('');

      // else if A has more points than B, add more points to B
    } else if (bPoints.length < aPoints.length) {
      var _pointToAdd = bPoints[bPoints.length - 1].replace(/[MCQAHV]/, 'L');

      for (var _i = 0; _i < numPointsToExtend; _i++) {
        bPoints.push(_pointToAdd);
      }

      bExtended = bPoints.join('');
    }
  }

  // if both A and B end with Z add it back in
  if ((a == null || a[a.length - 1] === 'Z') && (b == null || b[b.length - 1] === 'Z')) {
    aExtended += 'Z';
    bExtended += 'Z';
  }

  var stringInterpolator = d3Interpolate.interpolateString(aExtended, bExtended);

  return function pathInterpolator(t) {
    // at 1 return the final value without the extensions used during interpolation
    if (t === 1) {
      return b;
    }

    return stringInterpolator(t);
  };
}

exports.interpolatePath = interpolatePath;

Object.defineProperty(exports, '__esModule', { value: true });

})));