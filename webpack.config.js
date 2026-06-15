const {exec} = require('child_process')
const webpack = require('webpack')
const path = require('path')

module.exports = (env, options) => {
	const {mode = 'development'} = options

	const rules = [
		{
			test: /\.ts$/, // Only match .ts files
			use: 'ts-loader',
			exclude: /node_modules|dist|typings/,
		},
		{
			test: /\.svg$/i,
			type: 'asset/inline', // This converts the SVG to a base64 string.
		},
		{
			test: /\.html$/i,
			type: 'asset/source',
		},
	]

	const main = {
		mode,
		entry: {
			main: './src/main.ts', // Entry point is the main TypeScript file
		},
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name].js',
			chunkFilename: '[name].js',
		},
		resolve: {
			extensions: ['.ts', '.js'], // Only .ts and .js extensions
			fallback: {
				fs: false, // Cannot polyfill fs in browser, set to false
				path: require.resolve('path-browserify'),
				os: false,
				crypto: false,
				stream: false,
			},
		},
		module: {
			rules,
		},
		devtool: mode === 'development' ? 'source-map' : false, // Use 'source-map' for dev and disable in production
		plugins: [
			{
				apply: compiler => {
					compiler.hooks.afterDone.tap('pack-zip', () => {
						exec(
							'C:/Users/lukas/.bun/bin/bun.exe .vscode/pack-zip.js',
							(err, stdout, stderr) => {
								if (err) {
									console.error(err)
									return
								}
								console.log(stdout)
							},
						)
					})
				},
			},
			new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
				resource.request = resource.request.replace(/^node:/, '')
			}),
		],
	}

	return [main]
}
