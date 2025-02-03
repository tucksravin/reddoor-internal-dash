
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { imagetools } from '@zerodevx/svelte-img/vite'


export default defineConfig({
	plugins: [

		sveltekit(),
		imagetools()
		
	],
	server: {
		fs: {
			// Allow access to files from the project root.
			allow: ['..']
		}
	},
	define: {
		'process.env': {}
	  }
});
