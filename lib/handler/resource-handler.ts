import path from 'path';
import fs from 'fs-extra';
import { OPTIONS } from '../options';

/**
 * 封装处理资源的逻辑
 */
export class ResourceHandler {
    private fileRootPath: string = '';
    private static instance: ResourceHandler;
    static getInstance(): ResourceHandler {
        if (!ResourceHandler.instance) {
            ResourceHandler.instance = new ResourceHandler('');
        }
        return ResourceHandler.instance;
    }

    constructor(fileRootPath: string) {
        this.fileRootPath = path.join(fileRootPath || OPTIONS.fileRootPath || process.cwd(), 'files'); 
        console.log(`文件存储根路径: ${this.fileRootPath}`); 
    }

    getFileRootPath() {
        return this.fileRootPath;
    }

    /**
     * 获取某文件的文件存储目录
     * @param fileId 
     * @parammk 不存在文件夹时创建
     */
    async getFileDir(fileId: string, mk: boolean = false): Promise<string> {
        const dir = path.join(this.fileRootPath, fileId);  
        if (mk) await fs.ensureDir(dir);
        return dir;
    }

    /**
     * 判断文件是否存在
     * @param {string} fileId 文件唯一id, 作为存储文件的目录名
     * @param {string} filename 文件名
     * @returns 
     */
    async isFileExist(fileId: string, filename: string): Promise<boolean> {
        const filePath = path.join(await this.getFileDir(fileId), filename);
        return await fs.pathExists(filePath);
    }

    /**
     * 获取文件夹下的第一个文件
     * @param {*} dirPath 
     */
    async getFirstFileInDir(dirPath: string): Promise<string> {
        if (!(await fs.pathExists(dirPath))) {
            return '';
        }
        const files = await fs.readdir(dirPath);
        if (files.length > 0) {
            return path.join(dirPath, files[0]);
        }
        return '';
    }

    /**
     * 删除某文件或某目录
     * @param {string} path 
     */
    async removeFileOrDir(path: string): Promise<void> {
        await fs.remove(path);
    }
}