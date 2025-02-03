export interface S3UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export interface CloudFrontInvalidationResult {
    success: boolean;
    error?: string;
}

export interface UploadResponse {
    success: boolean;
    urls?: string[];
    error?: string;
}
