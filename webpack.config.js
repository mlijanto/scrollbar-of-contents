const autoprefixer = require("autoprefixer");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    soc: "./src/ts/soc.ts",
    filterHeading: "./src/ts/filterHeading.ts",
    background: "./src/ts/background.ts",
    options: "./src/ts/options.ts"
  },
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  output: {
    filename: "js/[name].js",
    path: __dirname + "/build"
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        use: "source-map-loader"
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [autoprefixer()]
            }
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"]
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/manifest.json", to: "./" },
        { from: "./src/styles", to: "./css" },
        { from: "./src/images", to: "images" },
        { from: "./src/options.html", to: "./" }
      ]}
    )
  ]
};
