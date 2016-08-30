# d3-interpolate-path

[![npm version](https://badge.fury.io/js/d3-interpolate-path.svg)](https://badge.fury.io/js/d3-interpolate-path)

Demo: http://peterbeshai.com/vis/d3-interpolate-path/

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

Run a web server in the example directory

```bash
cd example
php -S localhost:8000
```

Go to http://localhost:8000


## Installing

If you use NPM, `npm install d3-interpolate-path`. Otherwise, download the [latest release](https://github.com/pbeshai/d3-interpolate-path/releases/latest).

## API Reference


<a href="#interpolatePath" name="interpolatePath">#</a> <b>interpolatePath</b>(*a*, *b*)

Returns an interpolator between two path attribute `d` strings *a* and *b*. The interpolator extends *a* and *b* to have the same number of points before using [d3.interpolateString](https://github.com/d3/d3-interpolate#interpolateString) on them.

```js
var pathInterpolator = interpolatePath('M0,0 L10,10', 'M10,10 L20,20 L30,30')
pathInterpolator(0)   // 'M0,0 L10,10 L10,10'
pathInterpolator(0.5) // 'M5,5 L15,15 L20,20'
pathInterpolator(1)   // 'M10,10 L20,20 L30,30'
```
