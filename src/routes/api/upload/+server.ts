import { json, type RequestEvent } from '@sveltejs/kit';
import { uploadToS3, invalidateCache } from '$lib/server/s3';
import type { UploadResponse } from '$lib/types/aws';

export async function POST({ request }: RequestEvent): Promise<Response> {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const uploadedUrls: string[] = [];
        const errors: string[] = [];

        for (const file of files) {
            const result = await uploadToS3(file, 'uploads');
            if (result.success && result.url) {
                uploadedUrls.push(result.url);
            } else {
                errors.push(`Failed to upload ${file.name}: ${result.error}`);
            }
        }

        if (uploadedUrls.length > 0) {
            // Invalidate CloudFront cache if needed
            await invalidateCache(uploadedUrls.map(url => new URL(url).pathname));
        }

        const response: UploadResponse = {
            success: errors.length === 0,
            urls: uploadedUrls,
            error: errors.length > 0 ? errors.join('; ') : undefined
        };

        return json(response);
    } catch (error) {
        console.error('Upload error:', error);
        return json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
        }, { status: 500 });
    }
}