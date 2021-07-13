import fs from 'fs';
import crypto, { Encoding } from 'crypto';

/**
 * 计算某个字符串的md5值
 * @param str 字符串
 * @param encoding 字符串的字符集
 */
export function md5_str(str: string, encoding: Encoding = 'utf8'): string {
    return crypto.createHash('md5').update(str, encoding).digest('hex');
}

/**
 * 计算某个文件的 md5
 * @param filepath 文件路径
 * @param options 读取文件时的的options
 */
export function md5_file(filepath: string, options = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filepath, options);
        const cryptoStream = crypto.createHash('md5');
        readStream.pipe(cryptoStream);
        // 通常, 可读流触发end事件时, 可写流也会触发 finish 事件
        cryptoStream.on('finish', () => {
            const md5Value = cryptoStream.digest('hex');
            resolve(md5Value);
        });
        readStream.on('error', (err) => {
            readStream.close();
            cryptoStream.end();
            reject(err);
        });
        readStream.on('data', (chunk) => {
            //console.log('chunk', chunk)
        });
    })
}
