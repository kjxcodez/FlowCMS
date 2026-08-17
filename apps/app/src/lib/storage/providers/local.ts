import fs from "fs/promises";
import path from "path";
import { StorageProvider, UploadResult } from "../types";

export class LocalStorageProvider implements StorageProvider {
  private uploadDir = path.join(process.cwd(), "public", "uploads");

  async upload(workspaceId: string, file: File): Promise<UploadResult> {
    // 1. Create target folder if missing
    const workspaceDir = path.join(this.uploadDir, workspaceId);
    await fs.mkdir(workspaceDir, { recursive: true });

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const relativePath = `${workspaceId}/${fileName}`;
    const fullPath = path.join(this.uploadDir, relativePath);

    // 2. Read array buffer and write to disc
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    const url = this.getPublicUrl(relativePath);
    return { url, path: relativePath };
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  getPublicUrl(filePath: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${appUrl}/uploads/${filePath}`;
  }
}
