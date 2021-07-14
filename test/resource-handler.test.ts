import should from 'should';
console.log(should.toString());
import { ResourceHandler } from "../lib/handler/resource-handler";
import path from 'path';
import fs from 'fs-extra';

describe('测试 resource-handler 模块的方法', () => {
    after(async () => {
        const instance = ResourceHandler.getInstance();
        instance.removeFileOrDir(instance.getFileRootPath());
    });
    it('getInstance 获取单例 , new 方式得到新的对象', () => {
        const instance = ResourceHandler.getInstance();
        const obj = new ResourceHandler('./tmp');
        instance.should.be.an.Object();
        obj.should.be.an.Object();
        instance.should.be.not.equal(obj);

        const instance2 = ResourceHandler.getInstance();
        instance2.should.be.an.Object();
        instance2.should.be.equal(instance);
    });

    it('getFileDir 根据文件id获取文件路径', async () => {
        const instance = ResourceHandler.getInstance();
        const fileDir = await instance.getFileDir('fileId'); // 只获取路径但不保证路径存在

        fileDir.should.be.String().and.be.equal(path.join(process.cwd(), 'files/fileId'));
        (await fs.pathExists(fileDir)).should.be.equal(false);

        const existDir = await instance.getFileDir('fileId2', true); // 保证路径存在
        existDir.should.be.String().and.be.equal(path.join(process.cwd(), 'files/fileId2'));
        (await fs.pathExists(existDir)).should.be.equal(true);
    });

    it('isFileExist 判断文件是否存在', async () => {
        const instance = ResourceHandler.getInstance();
        (await instance.isFileExist('不存在的文件ID', '不存在的文件')).should.be.equal(false);

        const fileDir = await instance.getFileDir('fileId', true);
        await fs.ensureFile(path.join(fileDir, 'a.txt'));

        (await instance.isFileExist('fileId', 'a.txt')).should.be.equal(true);
    });

    it('getFirstFileInDir 获取目录下第一个文件', async () => {
        const instance = ResourceHandler.getInstance();
        const fileDir = await instance.getFileDir('fileId', true);

        await fs.ensureFile(path.join(fileDir, 'a.txt'));
        await fs.ensureFile(path.join(fileDir, 'b.txt'));

        const filePath = await instance.getFirstFileInDir(fileDir);
        path.basename(filePath).should.be.equal('a.txt');
        path.extname(filePath).should.be.equal('.txt');

        const fileDirTwo = await instance.getFileDir('fileId2');
        (await instance.getFirstFileInDir(fileDirTwo)).should.be.equal('');
    });

    it('removeFileOrDir 删除文件或者目录', async () => {
        const instance = ResourceHandler.getInstance();
        const fileDir = await instance.getFileDir('fileId', true);
        await fs.ensureFile(path.join(fileDir, 'a.txt'));
        
        await instance.removeFileOrDir(fileDir);
        (await instance.isFileExist('fileId', 'a.txt')).should.be.equal(false);
        (await fs.pathExists(fileDir)).should.be.equal(false);
    });
});
