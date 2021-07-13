process.env.express_port = <any>8080;
import should from 'should';
console.log(should.toString());
import express from 'express';
import { uploadmiddleware } from '..';
import fetch from 'node-fetch';
import { OPTIONS } from '../lib/options';
import fs from 'fs-extra';
import path from 'path';
import { ResourceHandler } from '../lib/resource-handler';
import FormData from 'form-data';
import http from 'http';
import _ from 'lodash';
import mime from 'mime';

describe('测试 file-handler 模块的方法', function() {
    const instance = ResourceHandler.getInstance();
    const testTextFilePath = path.join(instance.getFileRootPath(), './test.txt');
    const testStreamFilePath = path.join(instance.getFileRootPath(), './stream');
    let server: http.Server;
    let textFileId: string;
    let streamFileId: string;
    before(async () => {
        const startServer = new Promise((resolve, reject) => {
            const app = express();
            uploadmiddleware(app, {
                routes: {
                    review: '/v1/file/review/:fileId',
                    info: '/v1/file/:fileId',
                    download: '/v1/file/download/:fileId',
                    upload: '/v1/file/upload',
                    delete: '/v1/file/:fileId'
                },
                fileRootPath: '',
                downloadsLimit: 10,
                needOauthMD5: false
            });
            server = app.listen(process.env.express_port, () => {
                console.log(`server is running ${process.env.express_port}`);
                resolve('success');
            });
            setTimeout(() => {
                reject('fail');
            }, 3000)
        });
        await startServer.then(() => console.log(`测试服务器启动成功`));
        await fs.ensureFile(testTextFilePath);
        await fs.ensureFile(testStreamFilePath);
        let content = '';
        for (let i = 0; i < 1000; i++) {
            content += '123456789abcdefghig';
        }
        fs.writeFileSync(testTextFilePath, content);
        fs.writeFileSync(testStreamFilePath, content);

        console.log(`测试文件写入成功`);
    });
    after(async () => {
        server && server.close();
    });
    it('uploadMiddleHandler 上传文件', async () => {
        const form = new FormData();
        form.append('filename', 'a.txt');
        form.append('file', fs.createReadStream(testTextFilePath));

        const result = await fetch(`http://localhost:${process.env.express_port}/v1/file/upload`, {
            method: 'POST',
            body: form
        });
        const json = await result.json();
        json.should.have.property('size');
        json.should.have.property('mimetype');
        json.should.have.property('fileId');
        json.should.have.property('filename');
        json.filename.should.be.equal('a.txt');
        json.mimetype.should.be.equal((<any>mime).getType(testTextFilePath));

        textFileId = json.fileId;

        (await instance.isFileExist(json.fileId, 'a.txt')).should.be.equal(true);

        const streamForm = new FormData();
        streamForm.append('filename', 'stream');
        streamForm.append('file', fs.createReadStream(testStreamFilePath));
        const streamResult = await fetch(`http://localhost:${process.env.express_port}/v1/file/upload`, {
            method: 'POST',
            body: streamForm
        });
        const streamJson = await streamResult.json();
        streamJson.should.have.property('size');
        streamJson.should.have.property('mimetype');
        streamJson.should.have.property('fileId');
        streamJson.should.have.property('filename');
        streamJson.filename.should.be.equal('stream');
        streamJson.mimetype.should.be.equal('application/octet-stream');

        streamFileId = streamJson.fileId;

        (await instance.isFileExist(streamJson.fileId, 'stream')).should.be.equal(true);
    });

    it('uploadMiddleHandler 上传文件 - 不上传文件', async () => {
        const form = new FormData();
        form.append('filename', 'a.txt');

        const result = await fetch(`http://localhost:${process.env.express_port}/v1/file/upload`, {
            method: 'POST',
            body: form
        });
        result.status.should.be.equal(400);
        (await result.text()).should.be.equal('uploadMid.uploadMiddleHandler: 缺少需要上传的文件');
    });

    it('uploadMiddleHandler 上传文件 需要验证 MD5', async () => {
        OPTIONS.needOauthMD5 = true; // 开启 MD5 验证
        const form = new FormData();
        form.append('filename', 'test.txt');
        form.append('file', fs.createReadStream(testTextFilePath));

        const result = await fetch(`http://localhost:${process.env.express_port}/v1/file/upload`, {
            method: 'POST',
            body: form
        });
        result.status.should.be.equal(400);
        (await result.text()).should.be.equal('uploadMid.uploadMiddleHandler: 缺少 md5 参数');
    });

    it('infoMiddleHandler 获取文件信息', async () => {
        const result = await fetch(`http://localhost:${process.env.express_port}/v1/file/${textFileId}`, {
            method: 'GET'
        });
        const json = await result.json();
        json.should.have.property('size');
        json.should.have.property('mimetype');
        json.should.have.property('fileId');
        json.should.have.property('filename');
        json.filename.should.be.equal('a.txt');
        json.mimetype.should.be.equal((<any>mime).getType(testTextFilePath));
    });

    it('reviewMiddleHandler 预览文件', async () => {
        const result = await fetch(`http://localhost:${process.env.express_port}/v1/file/review/${textFileId}`, {
            method: 'GET'
        });
        (<any>result.headers.get('content-type')).should.startWith('text/plain');

        const streamResult = await fetch(`http://localhost:${process.env.express_port}/v1/file/review/${streamFileId}`, {
            method: 'GET'
        });
        (<any>streamResult.headers.get('content-type')).should.startWith('application/octet-stream');
    });

    it('downloadMiddleHandler 下载文件', async () => {
        const result = await fetch(`http://localhost:${process.env.express_port}/v1/file/download/${textFileId}`, {
            method: 'GET'
        });
        (<any>result.headers.get('content-type')).should.startWith('text/plain');

        const streamResult = await fetch(`http://localhost:${process.env.express_port}/v1/file/download/${streamFileId}`, {
            method: 'GET'
        });
        (<any>streamResult.headers.get('content-type')).should.startWith('application/octet-stream');
    });

    it('deleteMiddleHandler 删除文件', async () => {
        const result = await fetch(`http://localhost:${process.env.express_port}/v1/file/${textFileId}`, {
            method: 'DELETE'
        });
        (await result.text()).should.be.equal('ok');
        (await instance.isFileExist(textFileId, 'stream')).should.be.equal(false);

        const streamResult = await fetch(`http://localhost:${process.env.express_port}/v1/file/${streamFileId}`, {
            method: 'DELETE'
        });
        (await streamResult.text()).should.be.equal('ok');
        (await instance.isFileExist(streamFileId, 'stream')).should.be.equal(false);
    });
});
