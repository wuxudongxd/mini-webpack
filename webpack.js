const Compiler = require("./compiler");

function webpack(config) {
  // 将用户配置参数和shell命令行参数合并
  const shellOptions = process.argv.slice(2).reduce((config, arg) => {
    let [key, value] = arg.split("=");
    config[key.slice(2)] = value;
    return config;
  }, {});
  const finalConfig = { ...config, ...shellOptions };

  // 实例化 Compiler 类接收配置参数
  const compiler = new Compiler(finalConfig);

  // 创建完 compiler 之后挂载插件
  finalConfig.plugins.forEach((plugin) => {
    plugin.apply(compiler);
  });
  return compiler;
}

module.exports = webpack;
