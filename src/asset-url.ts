/** Resolve public/ assets under the configured Vite project-site base. */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
