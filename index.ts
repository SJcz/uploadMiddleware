import express from  'express';
import { IHandlerOptions, OPTIONS } from './lib/options';
import { deleteMiddleHandler, downloadMiddleHandler, infoMiddleHandler, reviewMiddleHandler, uploadMiddleHandler } from './lib/file-handler';
import _ from 'lodash';
import { uploadCompleteFileMid } from './lib/file-upload-middleware';

export function uploadmiddleware(app: express.Application, options: IHandlerOptions): void {
    Object.assign(OPTIONS, options);
    console.log(`uploadmiddleware.options:`);
    console.log(OPTIONS);
    
    if (_.isEmpty(OPTIONS.routes)) throw new Error(`uploadmiddleware: OPTIONS.routes is empty`);
    require('express-async-errors');
    app.get(OPTIONS.routes.review, reviewMiddleHandler);
    app.get(OPTIONS.routes.download, downloadMiddleHandler);
    app.get(OPTIONS.routes.info, infoMiddleHandler);
    app.post(OPTIONS.routes.upload, uploadCompleteFileMid(), uploadMiddleHandler);
    app.delete(OPTIONS.routes.delete, deleteMiddleHandler);
}