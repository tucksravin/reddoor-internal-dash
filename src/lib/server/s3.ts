import { 
    S3Client, 
    PutObjectCommand, 
    type PutObjectCommandInput 
} from '@aws-sdk/client-s3';
import { 
    CloudFrontClient, 
    CreateInvalidationCommand, 
    type CreateInvalidationCommandInput 
} from '@aws-sdk/client-cloudfront';
import { v4 as uuidv4 } from 'uuid';
import type { S3UploadResult, CloudFrontInvalidationResult } from '$lib/types/aws';

const s3Client = new S3Client({
    region: import.meta.env.VITE_AWS_REGION as string,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID as string,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY as string
    }
});

const cloudfrontClient = new CloudFrontClient({
    region: import.meta.env.VITE_AWS_REGION as string,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID as string,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY as string
    }
});

export async function uploadToS3(
    file: File, 
    directory: string = ''
): Promise<S3UploadResult> {
    try {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${directory}/${uuidv4()}.${fileExtension}`;
        
        const uploadParams: PutObjectCommandInput = {
            Bucket: import.meta.env.VITE_AWS_S3_BUCKET as string,
            Key: fileName,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type,
            ACL: 'public-read'
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        const url = `https://${import.meta.env.VITE_AWS_S3_BUCKET}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${fileName}`;
        console.log("url: "+url)
        return { success: true, url };
    } catch (error) {
        console.error('S3 upload error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
    }
}

export async function invalidateCache(
    paths: string[]
): Promise<CloudFrontInvalidationResult> {
    try {
        if (!import.meta.env.VITE_AWS_CLOUDFRONT_DISTRIBUTION_ID) {
            return { success: true }; // Skip if no distribution ID
        }

        const params: CreateInvalidationCommandInput = {
            DistributionId: import.meta.env.VITE_AWS_CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: Date.now().toString(),
                Paths: {
                    Quantity: paths.length,
                    Items: paths.map(path => path.startsWith('/') ? path : `/${path}`)
                }
            }
        };

        const command = new CreateInvalidationCommand(params);
        await cloudfrontClient.send(command);
        return { success: true };
    } catch (error) {
        console.error('CloudFront invalidation error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
    }
}