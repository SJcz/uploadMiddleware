# uploadMiddleware
## 介绍
一个TypeScript版本的express上传下载中间件, 可作为基础服务直接引入

## 使用
```
import express from "express";
import { uploadmiddleware } from ".";

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
