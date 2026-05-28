export interface UploadResult {
  url: string;
  path: string;
}

export interface StorageProvider {
  upload(workspaceId: string, file: File): Promise<UploadResult>;
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}
