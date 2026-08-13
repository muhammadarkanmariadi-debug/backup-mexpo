import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  constructor(@Inject('S3_CLIENT') private readonly s3: S3Client) {}

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType?: string,
  ) {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (err) {
      const error = err as Error;
      if (error && error.message && error.message.includes('Invalid URL')) {
        this.logger.warn(
          `Skipping S3 upload for ${key}: S3 endpoint is missing or invalid in environment config.`,
        );
      } else {
        throw err;
      }
    }
    return { bucket, key };
  }

  async getObject(bucket: string, key: string) {
    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    // res.Body is a ReadableStream (Node)
    return res.Body as Readable;
  }

  async delete(bucket: string, key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  parseS3Url(fileUrl: string) {
    const u = new URL(fileUrl);
    // assuming forcePathStyle true:
    // u.pathname => "/moklet-app-assets/1757915463834-ChatGPT Image ..."
    const parts = u.pathname.replace(/^\/+/, '').split('/');
    const bucket = parts.shift(); // first segment is bucket
    const key = decodeURIComponent(parts.join('/'));
    return { bucket, key };
  }
}
