import express from "express";
import mime from "mime";
import path from 'path';
import fs from 'fs-extra';
import { ResourceHandler } from "./resource-handler";
import { OPTIONS } from "../options";
import { md5_file } from "../util/utils";

const downloadsMap = new Map();

export async function reviewMiddleHandler (req: express.Request, res: express.Response, next: Function): Promise<void> {
    const fileId = req.params.fileId;
    if (!fileId) {
        res.status(400).send(`uploadMid.reviewMiddleHandler: 缺少 fileId 参数`);
        return;
    }
    const fileDir = await ResourceHandler.getInstance().getFileDir(fileId);
    const filePath = await ResourceHandler.getInstance().getFirstFileInDir(fileDir);

    if (!filePath) {
        res.status(400).send(`uploadMid.reviewMiddleHandler: 要预览的文件不存在`);
        return;
    }
    const mimetype = (<any>mime).getType(filePath);
    if (mimetype == 'application/octet-stream' || !mimetype) { // 二进制类型的文件或者非标准文件
        console.log(`uploadMid.reviewMiddleHandler: 检测到 ${filePath} 的类型为 ${mimetype}, 不适宜直接打开, 自动下载`);
        res.download(filePath, `${path.basename(filePath)}`, async (err) => {
            if (err) {
                console.log(`下载文件 ${filePath} 失败, ${err}`);
            }
        });
    } else {
        res.set('Content-Type', mimetype);
        fs.createReadStream(filePath).pipe(res).on('error', err => {
            console.log(`uploadMid.reviewMiddleHandler: 预览文件 ${filePath} 失败, ${err}`);
        });
    }
} 

export async function downloadMiddleHandler (req: express.Request, res: express.Response, next: Function): Promise<void> {
    const fileId = req.params.fileId;
    if (!fileId) {
        res.status(400).send(`uploadMid.downloadMiddleHandler: 缺少 fileId 参数`);
        return;
    }

    // 限制单服务实例的并发下载
    const downloadsLimit =  10;
    if (downloadsMap.size >= OPTIONS.downloadsLimit) {
        res.status(400).send(`uploadMid.downloadMiddleHandler: 当前并发下载量过大, 请稍后下载`);
        return;
    }
    const fileDir = await ResourceHandler.getInstance().getFileDir(fileId);
    const filePath = await ResourceHandler.getInstance().getFirstFileInDir(fileDir);

    console.log(`并发下载量限制=${downloadsLimit} 当前正在下载数量: ${downloadsMap.size}, 预备下载的文件:${filePath}`);

    if (!filePath) {
        res.status(400).send(`uploadMid.downloadMiddleHandler: 要下载的文件不存在`);
        return;
    }

    // 下载文件 (内部使用流)
    res.download(filePath, `${path.basename(filePath)}`, async (err) => {
        if (err) {
            console.log(`下载文件 ${filePath} 失败, ${err}`);
        }
        // 清除占位
        downloadsMap.delete(req.ip);
    });
}

export async function infoMiddleHandler(req: express.Request, res: express.Response, next: Function): Promise<void> {
    const fileId = req.params.fileId;
    if (!fileId) {
        res.status(400).send(`uploadMid.infoMiddleHandler: 缺少 fileId 参数`);
        return;
    }
    const fileDir = await ResourceHandler.getInstance().getFileDir(fileId);
    const filePath = await ResourceHandler.getInstance().getFirstFileInDir(fileDir);
    if (!filePath) {
        res.status(400).send(`uploadMid.infoMiddleHandler: 要查看的文件不存在`);
        return;
    }
    const mimetype = (<any>mime).getType(filePath);
    const states = await fs.stat(filePath);
    res.json({ fileId, mimetype, size: states.size, filename: path.basename(filePath) });
}

export async function uploadMiddleHandler(req: express.Request, res: express.Response, next: Function): Promise<void> {
    const { md5, fileId } = req.body;
    if (!req.file) {
        res.status(400).send(`uploadMid.uploadMiddleHandler: 缺少需要上传的文件`);
        return;
    }
    if (!fileId) {
        // 参数错误删除刚刚上传的文件和文件夹
        await ResourceHandler.getInstance().removeFileOrDir(path.dirname(req.file.path));
        res.status(400).send(`uploadMid.uploadMiddleHandler: 缺少 fileId 参数, 请检查上一中间件`);
        return;
    }
    if (!md5 && OPTIONS.needOauthMD5) {
        // 参数错误删除刚刚上传的文件和文件夹
        await ResourceHandler.getInstance().removeFileOrDir(path.dirname(req.file.path));
        res.status(400).send(`uploadMid.uploadMiddleHandler: 缺少 md5 参数`);
        return;
    }
    
    // 校验文件 MD5
    const md5Value = await md5_file(req.file.path);
    if (OPTIONS.needOauthMD5 && md5 !== md5Value) {
        // MD5校验失败删除刚刚上传的文件和文件夹
        console.error(`完整文件 ${fileId}, filename=${req.file.filename}, filepath=${req.file.path} - 客户端MD5=${md5} 服务端 MD5=${md5Value} 校验失败, 删除刚刚上传的文件`);
        await ResourceHandler.getInstance().removeFileOrDir(path.dirname(req.file.path));
        res.status(400).send(`uploadMid.uploadMiddleHandler: 文件MD5校验错误`);
        return;
    }
    res.json({ fileId, mimetype: req.file.mimetype, size: req.file.size, filename: req.file.filename });
}

export async function deleteMiddleHandler(req: express.Request, res: express.Response, next: Function): Promise<void> {
    const fileId = req.params.fileId;
    if (!fileId) {
        res.status(400).send(`uploadMid.deleteMiddleHandler: 缺少 fileId 参数`);
        return;
    }
    const fileDir = await ResourceHandler.getInstance().getFileDir(fileId);
    const filePath = await ResourceHandler.getInstance().getFirstFileInDir(fileDir);
    if (!filePath) {
        res.status(400).send(`uploadMid.deleteMiddleHandler: 要删除的文件不存在`);
        return;
    }
    await fs.remove(fileDir); // 直接删除整个文件夹
    res.end('ok');
}