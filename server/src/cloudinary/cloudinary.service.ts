import { Injectable } from '@nestjs/common';
import cloudinary from '../config/cloudinary.config';
import multer from 'multer';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'fraudlens-documents',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          },
        )
        .end(file.buffer);
    });
  }
}
