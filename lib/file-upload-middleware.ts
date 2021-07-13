import express from "express";
import multer from "multer";
import { md5_str } from "../util/utils";
import { OPTIONS } from "./options";
import { ResourceHandler } from "./resource-handler";

/**multer 中间件处理时的文件信息结构 */
interface IMulterFileStructure {
    /**上传文件时对应的请求字段名 */
    fieldname: string;
    /**上传文件的原始文件名 */
    originalname: string;
    /**一般是 7bit */
    encoding: string;
    /**文件 mime 类型 */
    mimetype: string;
}

/**
 * 确定完整上传的普通文件应该存储在哪个文件夹
 * @param req 请求对象
 * @param file 中间件处理时的文件信息
 * @param cb 
 */
const completeFileDestination = async function(req: express.Request, file: IMulterFileStructure, cb: Function) {
    try {
        // filename 参数可选, 不存在时使用上传文件的文件名
        const filename = req.body.filename || file.originalname;
        const md5 = req.body.md5;
        
        // filename + MD5 重新计算 md5 , 得到唯一 fileId
        const encodeStr = `${md5}_${filename}`;
        const fileId = md5_str(encodeStr);
        req.body.fileId = fileId; // 后续处理需要用到

        cb(null, await ResourceHandler.getInstance().getFileDir(fileId, true));
    } catch (error) {
        cb(error);
    }
}

/**
 * 确定完整上传文件的存储文件名
 * @param req 请求对象
 * @param file 中间件处理时的文件信息
 * @param cb 
 */
 const completeFileFilename = async function (req: express.Request, file: IMulterFileStructure, cb: Function) {
    cb(null, `${req.body.filename || file.originalname}`);
}


/**
 * 普通文件上传中间件处理
 * multer 使用可参考 https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md
 */
 export function uploadCompleteFileMid () {
    const storage = multer.diskStorage({
        destination: completeFileDestination,
        filename: completeFileFilename,
    });
    return multer({ storage: storage }).single('file');
}