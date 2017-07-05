# d3-interpolate-path

[![npm version](https://badge.fury.io/js/d3-interpolate-path.svg)](https://badge.fury.io/js/d3-interpolate-path)

d3-interpolate-path is a D3 plugin that adds an [interpolator](https://github.com/d3/d3-interpolate)
optimized for SVG &lt;path&gt; elements.

Blog: [Improving D3 Path Animation](https://bocoup.com/weblog/improving-d3-path-animation)

Demo: http://peterbeshai.com/d3-interpolate-path/

![d3-interpolate-path demo](http://peterbeshai.com/vis/d3-interpolate-path/d3-interpolate-path-demo.gif)

## Example Usage

```js
var line = d3.line()
  .curve(d3.curveLinear)
  .x(function (d) { return x(d.x); })
  .y(function (d) { return y(d.y); });

d3.select('path.my-path')
  .transition()
  .duration(2000)
  .attrTween('d', function (d) {
    var previous = d3.select(this).attr('d');
    var current = line(d);
    return d3.interpolatePath(previous, current);
  });
```


## Development

Get rollup watching for changes and rebuilding

```bash
npm run watch
```

Run a web server in the docs directory

```bash
cd docs
php -S localhost:8000
```

Go to http://localhost:8000


## Installing

If you use NPM, `npm install d3-interpolate-path`. Otherwise, download the [latest release](https://github.com/pbeshai/d3-interpolate-path/releases/latest).

## API Reference


<a href="#interpolatePath" name="interpolatePath">#</a> <b>interpolatePath</b>(*a*, *b*, *excludeSegment*)

Returns an interpolator between two path attribute `d` strings *a* and *b*. The interpolator extends *a* and *b* to have the same number of points before using [d3.interpolateString](https://github.com/d3/d3-interpolate#interpolateString) on them.

```js
var pathInterpolator = interpolatePath('M0,0 L10,10', 'M10,10 L20,20 L30,30')
pathInterpolator(0)   // 'M0,0 L10,10 L10,10'
pathInterpolator(0.5) // 'M5,5 L15,15 L20,20'
pathInterpolator(1)   // 'M10,10 L20,20 L30,30'
```

You can optionally provide a function *excludeSegment* that takes two adjacent path commands and returns true if that segment should be excluded when splitting the line. A command object has form `{ type, x, y }` (with possibly more attributes depending on type). An example object:

```js
// equivalent to M0,150 in a path `d` string
{
  type: 'M',
  x: 0,
  y: 150
}
```

This is most useful when working with d3-area. Excluding the final segment (i.e. the vertical line at the end) from being split ensures a nice transition. If you know that highest `x` value in the path, you can exclude the final segment by passing an excludeSegment function similar to:

```js
function excludeSegment(a, b) {
  return a.x === b.x && a.x === 300; // here 300 is the max X
}
```
