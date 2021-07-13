# uploadMiddleware

## 介绍
一个TypeScript版本的express上传下载中间件, 可作为基础中间件直接引入


## 使用
```javascript
import express from "express";
import { uploadmiddleware } from "uploadmiddleware";

const app = express();
app.use((req, res, next) => {
    console.log(req.url);
    next();
})
uploadmiddleware(app, {
    routes: { // 中间件提供的五个路由
        review: '/v1/file/review/:fileId', // 文件预览
        info: '/v1/file/:fileId', // 查看文件信息
        download: '/v1/file/download/:fileId', // 直接下载文件
        upload: '/v1/file/upload', // 上传文件
        delete: '/v1/file/:fileId' // 删除文件
    },
    fileRootPath: '', // 文件上传时的基础存储目录, 默认是 process.cwd()
    downloadsLimit: 10, // 同时下载的数量限制
    needOauthMD5: true // 文件上传是否需要验证 md5
});
app.listen(process.env.express_port || 8080, () => {
    console.log(`server is running ${process.env.express_port || 8080}`);
});
```

**暂未发布到 npm, 直接使用请先编译成js.**

## 路由
该中间件被引入时, 默认会自动注册五个路由
|  路由名   | 说明  |  请求方法 | 请求参数  |
|  ----  | ----  | ----  | ----  |
| /v1/file/review/:fileId  | 预览文件, 可直接在浏览器打开, 当文件是未知类型或者 application/octet-stream 时, 会自动下载文件 | get | fileId: 文件唯一id |
| /v1/file/:fileId  | 获取文件信息 | get | fileId: 文件唯一id |
| /v1/file/download/:fileId  | 下载文件, 不同于预览文件, 下载文件就是单纯的下载, 不提供网页打开功能 | get | fileId: 文件唯一id |
| /v1/file/upload  | 上传文件, 目前仅支持单文件上传 | post | filename: 可选, 上传之后保存的文件名<br>file: 必选, 上传的文件<br>md5: 可选, 文件的MD5 |
| /v1/file/:fileId  | 删除已经上传的文件 | delete | fileId: 文件唯一id |



## options
使用该中间件时, 可以通过 options 选项自定义部分内容
options 选项默认是
```javascript
export const OPTIONS: IHandlerOptions = {
    routes: {  // 中间件提供的五个路由
        review: '/v1/file/review/:fileId', // 文件预览
        info: '/v1/file/:fileId', // 查看文件信息
        download: '/v1/file/download/:fileId',  // 直接下载文件
        upload: '/v1/file/upload',  // 上传文件
        delete: '/v1/file/:fileId' // 删除文件
    },
    fileRootPath: '',  // 文件上传时的基础存储目录, 默认是 process.cwd()
    downloadsLimit: 10,  // 同时下载的数量限制
    needOauthMD5: false // 文件上传是否需要验证 md5
}
```
**更改路由接口时, 路由参数不可变更.**

|  options 选项   | 说明  |
|  ----  | ----  |
|  fileRootPath   | 文件上传时的基础存储路径, 默认是 process.cwd() / files  |
|  downloadsLimit   |  同时下载文件的请求限制, 通过 IP 限制, 默认是10个 |
|  needOauthMD5   | 开启时, 上传文件接口需要传入 md5 参数, 关闭时可不传  |



## 文件存储基础目录
使用 K8S 部署使用了该中间件的服务时, fileRootPath 需要被设置成 volume, 这样即便存在多个服务, 也可以访问到同一文件



## 文件类型
文件类型使用 mime 模块判断, 遇到 a.b | filea 等这种无法识别类型的文件时, 默认会下载.



## 错误处理
因为中间件都是使用 es6 的 async/await 语法, 没有捕获 promise reject 错误, 所以普通情况下, 中间件报错时, 因为 next 不执行, 整个请求会堵塞, 所以使用了 express-async-errors 模块来处理promise错误.
