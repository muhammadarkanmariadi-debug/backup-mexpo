import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
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
    const put = () =>
      this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    try {
      try {
        await put();
      } catch (err) {
        // A bucket missing from the storage init script must not break every
        // upload into it: create it (public-read, like the init script) once.
        if ((err as Error)?.name !== 'NoSuchBucket') throw err;
        await this.createPublicBucket(bucket);
        await put();
      }
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

  private async createPublicBucket(bucket: string) {
    this.logger.warn(`Bucket ${bucket} does not exist; creating it`);
    try {
      await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (err) {
      const name = (err as Error)?.name;
      if (
        name !== 'BucketAlreadyOwnedByYou' &&
        name !== 'BucketAlreadyExists'
      ) {
        throw err;
      }
    }
    // Uploaded assets are served by direct URL (MINIO_ENDPOINT/bucket/key),
    // so objects must be anonymously readable — same as `mc anonymous set download`.
    await this.s3.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        }),
      }),
    );
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
