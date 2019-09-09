const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    soc: "./src/ts/soc.ts",
    filterHeading: "./src/ts/filterHeading.ts",
    background: "./src/ts/background.ts",
    options: "./src/ts/options.ts"
  },
  mode: "production",
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: "js/[name].js",
    path: __dirname + "/build"
  },
  plugins: [
    new CopyPlugin([
      { from: "./src/manifest.json", to: "./" },
      { from: "./src/js/external", to: "./js/external" },
      { from: "./src/styles", to: "./css" },
      { from: "./src/images", to: "images" },
      { from: "./src/options.html", to: "./" }
    ])
  ]
};
