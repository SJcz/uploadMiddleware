export interface IHandlerOptions {
    /**路由接口 */
    routes: {
        /**文件预览接口 */
        review: string,
        /**文件信息接口 */
        info: string,
        /**文件下载接口(可用预览接口替代, 网页访问该接口会直接下载文件) */
        download: string,
        /**文件上传接口 */
        upload: string,
        /**文件上删除接口 */
        delete: string
    },
    /**文件存储根目录, 默认是 process.cwd() / files */
    fileRootPath: string;
    /**文件同时下载的并发限制, 默认10 */
    downloadsLimit: number;
    /**上传时是否需要md5验证, 默认 false */
    needOauthMD5: boolean;
}

export const OPTIONS: IHandlerOptions = {
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
}