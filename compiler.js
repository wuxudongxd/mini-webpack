const path = require("path");
const fs = require("fs");
const { SyncHook } = require("tapable");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const types = require("babel-types");

class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new SyncHook(),
      done: new SyncHook(),
      emit: new SyncHook(),
    };

    this.entries = new Set(); // 保存打包过程中的入口信息
    this.module = new Set(); // 保存打包过程中所有出现的 module 信息
    this.chunks = new Set(); // 保存代码块信息
    this.files = new Set(); // 保存所有产出文件的名称
    this.assets = {}; // 资源清单
    this.context = this.options.context || process.cwd();
  }

  run() {
    this.hooks.run.call();

    // 01 确定入口信息 (将字符串转为对象的形式)
    let entry = {};
    if (typeof this.options.entry === "string") {
      entry.main = this.options.entry;
    } else {
      entry = this.options.entry;
    }

    // 02 确定入口模块的绝对路径
    for (let entryName in entry) {
      const entryPath = path.join(this.context, entry[entryName]);
      // TODO:调用自定义的方法来实现具体的编译过程，得到结果
      const entryModule = this.buildModule(entryName, entryPath);
    }

    console.log("调用run方法准备编译");
  }

  buildModule(moduleName, modulePath) {
    // 01 读取入口模块当中的源文件
    const originalSourceCode = fs.readFileSync(modulePath, "utf8");
    let targetSourceCode = originalSourceCode;

    // 02 获取loader
    let loaders = [];
    const rules = this.options.module.rules;
    for (let i = 0; i < rules.length; i++) {
      if (rules[i].test.test(modulePath)) {
        loaders = [...loaders, ...rules[i].use];
      }
    }

    // 03 调用 loader
    for (let i = loaders.length - 1; i >= 0; i--) {
      targetSourceCode = require(loaders[i])(targetSourceCode);
    }

    // 04 获取模块id (取相对路径)
    const moduleId = path.relative(this.context, modulePath);

    // 05 定义变量保存将来编译之后的产出
    const module = { id: moduleId, dependencies: [], name: moduleName };

    // 06 使用 ast 语法树按着自己的需要来处理，然后将结果返回
    let ast = parser.parse(targetSourceCode, { sourceType: "module" });
    traverse(ast, {
      CallExpression: (nodePath) => {
        const node = nodePath.node;
        if (node.callee.object.name === "console") {
          console.log(node.arguments[0].value);
        }
      },
    });
  }
}

module.exports = Compiler;
