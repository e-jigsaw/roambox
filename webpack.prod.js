const { merge } = require('webpack-merge')
const SizePlugin = require('size-plugin')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  plugins: [new SizePlugin()],
})
