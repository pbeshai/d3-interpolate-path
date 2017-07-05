import babel from 'rollup-plugin-babel';

var globals = {
  'd3-interpolate': 'd3',
}

export default {
  entry: 'index.js',
  moduleName: 'd3',
  plugins: [babel({
  	plugins: ['transform-object-assign'],
  })],
  globals: globals,
  external: Object.keys(globals),
  targets: [
    { format: 'umd', dest: 'build/d3-interpolate-path.js' },
    { format: 'umd', dest: 'docs/d3-interpolate-path.js' },
  ]
};
