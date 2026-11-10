import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolves target bucket and key.
   * If a main bucket is configured via MINIO_BUCKET (e.g. s3-mexpo0 on AWS S3),
   * any category bucket parameter (e.g. expo-project-event) is treated as a subfolder
   * prefix inside the main bucket to avoid requiring multiple AWS S3 buckets.
   */
  private resolveTarget(bucket: string, key: string) {
    const configuredBucket = this.configService.get<string>('MINIO_BUCKET');
    if (configuredBucket && configuredBucket !== bucket) {
      return {
        bucket: configuredBucket,
        key: `${bucket}/${key}`,
      };
    }
    return { bucket, key };
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType?: string,
  ) {
    const target = this.resolveTarget(bucket, key);
    const put = () =>
      this.s3.send(
        new PutObjectCommand({
          Bucket: target.bucket,
          Key: target.key,
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
        await this.createPublicBucket(target.bucket);
        await put();
      }
    } catch (err) {
      const error = err as Error;
      if (error && error.message && error.message.includes('Invalid URL')) {
        this.logger.warn(
          `Skipping S3 upload for ${target.key}: S3 endpoint is missing or invalid in environment config.`,
        );
      } else {
        throw err;
      }
    }
    return { bucket: target.bucket, key: target.key };
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
    const target = this.resolveTarget(bucket, key);
    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: target.bucket,
        Key: target.key,
      }),
    );
    // res.Body is a ReadableStream (Node)
    return res.Body as Readable;
  }

  async delete(bucket: string, key: string) {
    const target = this.resolveTarget(bucket, key);
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: target.bucket,
          Key: target.key,
        }),
      );
    } catch (err) {
      this.logger.warn(
        `Failed to delete S3 object ${target.key} from ${target.bucket}: ${(err as Error)?.message}`,
      );
    }
  }

  parseS3Url(fileUrl: string) {
    const u = new URL(fileUrl);
    const parts = u.pathname.replace(/^\/+/, '').split('/');
    const configuredBucket = this.configService.get<string>('MINIO_BUCKET');

    // Case 1: Path-style URL (https://s3.us-east-1.amazonaws.com/s3-mexpo0/expo-project-event/file.jpg)
    if (configuredBucket && parts[0] === configuredBucket) {
      parts.shift(); // remove main bucket 's3-mexpo0'
      const category = parts.shift() || configuredBucket;
      const key = decodeURIComponent(parts.join('/'));
      return { bucket: category, key };
    }

    // Case 2: Virtual-host style URL (https://s3-mexpo0.s3.us-east-1.amazonaws.com/expo-project-event/file.jpg)
    if (configuredBucket && u.hostname.startsWith(`${configuredBucket}.`)) {
      const category = parts.shift() || configuredBucket;
      const key = decodeURIComponent(parts.join('/'));
      return { bucket: category, key };
    }

    // Standard MinIO format (path-style with category as first segment)
    const bucket = parts.shift();
    const key = decodeURIComponent(parts.join('/'));
    return { bucket, key };
  }
}
