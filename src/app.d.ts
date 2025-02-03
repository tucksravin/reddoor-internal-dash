// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
	namespace NodeJS {
        interface ProcessEnv {
            AWS_REGION: string;
            AWS_ACCESS_KEY_ID: string;
            AWS_SECRET_ACCESS_KEY: string;
            AWS_S3_BUCKET: string;
            AWS_CLOUDFRONT_DISTRIBUTION_ID?: string;
        }
    }
}


export {};
