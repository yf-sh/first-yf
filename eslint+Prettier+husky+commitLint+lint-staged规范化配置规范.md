

# 配置eslint+prettier

[React 项目配置代码提交规范 ESLint、Pretttier、Husky、CommitLint - 知乎](https://zhuanlan.zhihu.com/p/696513571)

你必须安装并构建 [Node.js](https://nodejs.cn/)（`^18.18.0`、`^20.9.0` 或 `>=21.1.0`）并支持 SSL。（如果你使用的是官方 Node.js 发行版，则始终内置 SSL。）

## 进行配置eslint

1. ```shell
   npm init @eslint/config@latest
   ```

2. 运行 `npm init @eslint/config` 后，你的目录中将有一个 `eslint.config.js`（或 `eslint.config.mjs`）文件。在其中，你将看到一些配置如下的规则： (要是配置其他规则，去参考官网的)

   ```js
   export default [
       {
           rules: {
               "no-unused-vars": "error",
               "no-undef": "error"
           }
       }
   ];
   ```

3. 进行创建文件

   1. 配置文件 .eslintrc 

      ```json
      {
        "env": {
          "node": true,
          "es6": true,
        },
        "extends": [
          "eslint:recommended", //自带的规则	
          "plugin:node/recommended", //对node项目的一个插件
        ],
        "parserOptions": {
          "ecmaVersion": 2020,
          "sourceType": "module",
        },
        "plugins": ["prettier", "node"],
        "rules": {
          "prettier/prettier": "error",
          // 其他自定义规则...
        },
      }
      
      ```

   2. 配置package.json  

      ```
        "scripts": {
          "start": "node ./bin/www",
          "lint": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
        },
      ```

## 进行配置Prettier

1. ```
   npm install --save-dev --save-exact prettier
   ```

2. 然后，创建一个空的配置文件，让编辑器和其他工具知道你正在使用 Prettier：

   ```bash
   node --eval "fs.writeFileSync('.prettierrc','{}\n')"
   ```

3. 接下来，创建一个 [.prettierignore](https://www.prettier.cn/docs/ignore.html) 忽略文件，让 Prettier CLI 和编辑器知道哪些文件*不需要*格式化。下面是一个示例：

   ```text
   # Ignore artifacts:
   build
   coverage
   ```

4. 现在，使用 Prettier 格式化所有文件：

   ```
   npx prettier . --write
   ```

5. 配置 eslint和Prettier 冲突的依赖 eslint-config-prettier：

   ```
   npm install --save-dev eslint-config-prettier
   ```

6. 在 .eslint 这个文件中 添加 "plugin:prettier/recommended",这行代码

   ```
   "extends": [
       "eslint:recommended", //自带的规则	
       "plugin:node/recommended", //对node项目的一个插件
       "plugin:prettier/recommended", //解决冲突
     ],
   ```

7. 配置package.json  

   ```
     "scripts": {
       "start": "node ./bin/www",
       "lint": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
       "format": "prettier --write 'routes/**/*.js' 'views/**/*.jade'",
     },
   ```

# 进行配置commitlint

1. ​	安装依赖

   ```
   npm install --save-dev @commitlint/config-conventional @commitlint/cli
   ```

2. 创建 `commitlint` 配置文件

   1. 在项目的根目录创建一个名为 `.commitlintrc.js` 或 `.commitlintrc.json` 的文件，并添加以下内容来继承 conventional commits 规范：如果是 `.commitlintrc.js` 文件：

      ```
      module.exports = {
        extends: ['@commitlint/config-conventional']
      };
      ```

      如果是 `.commitlintrc.json` 文件：

      ```
      {
        "extends": ["@commitlint/config-conventional"]
      }
      ```

   2. 配置package.json 

      ```
       "scripts": {
          "start": "node ./bin/www",
          "lint": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
          "format": "prettier --write 'routes/**/*.js' 'views/**/*.jade'",
          "commitlint": "commitlint"
        },
        "commitlint": {
          "extends": [
            "@commitlint/config-conventional"
          ]
        },
      ```

# 配置husky+lint-staged

1. 其实husky已将到了9版本了，这里使用的是8.0.0版本

2. 首先你需要安装 `husky` 开发依赖

   ```
   npm install husky --save-dev
   ```

3. 初始化husky  注意:初始化之前你必须进行项目的git初始化否则的话无效。

   ```
   npx husky install
   ```

4.  使用名利给这个钩子添加`pre-commit` hook 来运行 `lint-staged`  

   ```
   npx husky add .husky/pre-commit "npx lint-staged"
   ```

5.  配置package.json 

   ```
     "husky": {
       "hooks": {
         "pre-commit": "lint-staged",
       }
     },
   ```

6. 配置lint-staged

   1. 进行安装依赖

      ```
      npm install lint - staged --save - dev
      ```

   2. 配置`package.json`文件 

      ```
      "lint-staged": {
          "*.{js,ts,jsx 等}": [
            "eslint --fix",
            "prettier --write",
            "git add"
          ]
        },
      ```

      



