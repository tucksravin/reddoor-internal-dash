<script lang="ts">
import type { S3UploadResult } from '$lib/types/aws';

import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let isAuthenticated = false;
    let password = '';
    let pwerror = '';
    

    const CORRECT_PASSWORD = 'bd=bb';
    
    onMount(() => {
 
        if (browser) {
            isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
        }
    });
    
    function handlePasswordSubmit() {
        if (password === CORRECT_PASSWORD) {
            isAuthenticated = true;
            sessionStorage.setItem('isAuthenticated', 'true');
            pwerror = '';
        } else {
            pwerror = 'Incorrect password';
            password = '';
        }
    }
    
    function handleLogout() {
        isAuthenticated = false;
        sessionStorage.removeItem('isAuthenticated');
        goto('/');
    }

    let files: FileList | null = null;
    let uploading = false;
    let progress = 0;
    let error: string | null = null;
    let uploadedUrls: string[] = [];

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        console.log('Region:', import.meta.env.VITE_AWS_REGION);

        event.preventDefault();
        if (!files || files.length === 0) return;

        uploading = true;
        progress = 0;
        error = null;
        uploadedUrls = [];

        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const result = await response.json() as { 
                success: boolean; 
                urls?: string[]; 
                error?: string 
            };

            if (!result.success) throw new Error(result.error || 'Upload failed');
            
            uploadedUrls = result.urls || [];
            progress = 100;
        } catch (err) {
            error = err instanceof Error ? err.message : 'Unknown error occurred';
        } finally {
            uploading = false;
        }
    }

    function isValidFileType(file: File): boolean {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        return allowedTypes.includes(file.type);
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }
</script>
<svelte:head><title>Upload to Reddoor Cloudfront</title></svelte:head>


{#if !isAuthenticated}
<div class="p-24 h-screen w-full flex flex-col items-center justify-center gap-8">
    <h1>Password Required</h1>
    <form on:submit|preventDefault={handlePasswordSubmit}>
        <div>
            <label for="password">Enter Password:</label>
            <input
                type="password"
                id="password"
                class="border-black border-2 rounded-sm px-2"
                bind:value={password}
                required
            />
        </div>
        {#if pwerror}
            <p class="error text-black mt-4">{pwerror}</p>
        {/if}
        <button type="submit" class="mt-4 border-black border-2 rounded-sm p-1">Submit</button>
    </form>
</div>
{:else}
<button class="absolute top-8 right-8 border-2 border-black p-2 rounded-lg" on:click={handleLogout}>Log Out </button>
<div class="max-w-2xl mx-auto p-4">
    <form 
        on:submit={handleSubmit}
        class="space-y-4"
    >
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <label 
                for="file-upload" 
                class="block text-center cursor-pointer"
            >
                <span class="mt-2 block text-sm font-medium text-black">
                    Drop files here or click to upload
                </span>
                <input
                    id="file-upload"
                    type="file"
                    multiple
                    class="hidden"
                    bind:files
                    accept="image/*,application/pdf"
                    on:change={() => error = null}
                />
            </label>
            
            {#if files && files.length > 0}
                <div class="mt-4 space-y-2">
                    {#each Array.from(files) as file}
                        <div class="flex items-center justify-between p-2 bg-light rounded">
                            <div class="flex items-center space-x-2">
                                <span class="text-sm text-black">{file.name}</span>
                                {#if !isValidFileType(file)}
                                    <span class="text-xs text-black">
                                        Invalid file type
                                    </span>
                                {/if}
                            </div>
                            <span class="text-xs text-black">
                                {formatFileSize(file.size)}
                            </span>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        {#if uploading}
            <div class="w-full bg-light rounded-full h-2.5">
                <div
                    class="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style="width: {progress}%"
                ></div>
            </div>
        {/if}

        {#if error}
            <div class="p-4 bg-primary text-black rounded">
                {error}
            </div>
        {/if}

        {#if uploadedUrls.length > 0}
            <div class="p-4 bg- rounded">
                <h3 class="font-medium text-black mb-2">Uploaded Files:</h3>
                <ul class="space-y-1">
                    {#each uploadedUrls as url}
                        <li class="text-sm text-black break-all">
                            <a href={url} target="_blank" rel="noopener noreferrer">
                                {url}
                            </a>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}

        <button
            type="submit"
            disabled={!files || files.length === 0 || uploading || (files && Array.from(files).some(file => !isValidFileType(file)))}
            class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {uploading ? 'Uploading...' : 'Upload'}
        </button>
    </form>
</div>
{/if}