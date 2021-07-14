/**
 * 该文件主要用于本地启动一个服务从而测试中间件.
 */
import express from "express";
import uploadMiddleware = require('.');

const app = express();
app.use((req, res, next) => {
    console.log(req.url);
    next();
})
uploadMiddleware(app, {
    routes: {
        review: '/v1/file/review/:fileId',
        info: '/v1/file/:fileId',
        download: '/v1/file/download/:fileId',
        upload: '/v1/file/upload',
        delete: '/v1/file/:fileId'
    },
    fileRootPath: '',
    downloadsLimit: 10,
    needOauthMD5: true
});
app.listen(process.env.express_port || 8080, () => {
    console.log(`server is running ${process.env.express_port || 8080}`);
});