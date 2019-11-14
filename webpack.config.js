const autoprefixer = require("autoprefixer");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    soc: "./src/ts/soc.ts",
    filterHeading: "./src/ts/filterHeading.ts",
    background: "./src/ts/background.ts",
    options: "./src/ts/options.ts",
    mdc: "./src/styles/external/material-components-web.customized.scss"
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
        test: /\.scss$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "css/external/[name].min.css"
            }
          },
          { loader: "extract-loader" },
          { loader: "css-loader" },
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [autoprefixer()]
            }
          },
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                includePaths: ["./node_modules"]
              }
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
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: "js/[name].js",
    path: __dirname + "/build"
  },
  plugins: [
    new CopyPlugin(
      [
        { from: "./src/manifest.json", to: "./" },
        { from: "./src/styles", to: "./css" },
        { from: "./src/images", to: "images" },
        { from: "./src/options.html", to: "./" }
      ],
      { ignore: ["**/*.scss"] }
    )
  ]
};
