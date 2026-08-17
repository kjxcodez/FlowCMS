import { POST as createMedia } from "../../../apps/app/src/app/api/internal/media/route";
import { PATCH as updateMedia, DELETE as deleteMedia } from "../../../apps/app/src/app/api/internal/media/[id]/route";
import { POST as createFolder } from "../../../apps/app/src/app/api/internal/media/folders/route";
import { PATCH as updateFolder, DELETE as deleteFolder } from "../../../apps/app/src/app/api/internal/media/folders/[id]/route";
import { POST as bulkMedia } from "../../../apps/app/src/app/api/internal/media/bulk/route";
import { NextRequest } from "next/server";
import { prisma } from "../../../apps/app/src/lib/prisma";
import { setMockUser } from "../../run-rbac-tests";
import { storage } from "../../../apps/app/src/lib/storage";

export async function testMedia(ctx: {
  workspace: any;
  users: Record<string, any>;
  assert: (name: string, condition: boolean, message?: string) => void;
}) {
  const { workspace, users, assert } = ctx;
  const suffix = Math.random().toString(36).substring(7);

  // Mock Storage Upload to bypass local disk write during tests
  const originalUpload = storage.upload;
  storage.upload = async (workspaceId: string, file: File) => {
    return { url: `http://localhost:3000/uploads/test-${suffix}-${file.name}`, path: `test-${suffix}-${file.name}` };
  };

  const roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

  // 1. Test Media Upload (POST /api/internal/media)
  // Allowed for: OWNER, ADMIN, EDITOR
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN" || role === "EDITOR";

    const mockFile = new File(["test image data"], `pic-${role.toLowerCase()}-${suffix}.png`, { type: "image/png" });
    const formData = new FormData();
    formData.append("file", mockFile);

    const req = new NextRequest(`http://localhost:3000/api/internal/media`, {
      method: "POST",
    });
    req.formData = async () => formData;

    const res = await createMedia(req);
    if (isAllowed) {
      assert(`${role} is allowed to upload media`, res.status === 200, `Status: ${res.status}`);
      // Clean up uploaded media record from DB
      if (res.status === 200) {
        const body = await res.json();
        await prisma.media.delete({ where: { id: body.data.id } }).catch(() => {});
      }
    } else {
      assert(`${role} is blocked from uploading media`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // Set up static media record for metadata & delete tests
  const testMediaItem = await prisma.media.create({
    data: {
      workspaceId: workspace.id,
      filename: `test-${suffix}.png`,
      url: `http://localhost:3000/uploads/test-${suffix}.png`,
      mimeType: "image/png",
      size: 1024,
    },
  });

  // 2. Test Media Metadata Update (PATCH /api/internal/media/[id])
  // Allowed for: OWNER, ADMIN, EDITOR
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN" || role === "EDITOR";

    const req = new NextRequest(`http://localhost:3000/api/internal/media/${testMediaItem.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        alt: `Alt edited by ${role}`,
        title: "Test Title",
      }),
    });

    const res = await updateMedia(req, { params: Promise.resolve({ id: testMediaItem.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to update media metadata`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from updating media metadata`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 3. Test Media Deletion (DELETE /api/internal/media/[id])
  // Allowed for: OWNER, ADMIN (Blocked for EDITOR)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    // Create temp media to delete
    const tempMedia = await prisma.media.create({
      data: {
        workspaceId: workspace.id,
        filename: `temp-${role.toLowerCase()}-${suffix}.png`,
        url: `http://localhost:3000/uploads/temp-${role.toLowerCase()}-${suffix}.png`,
        mimeType: "image/png",
        size: 512,
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/internal/media/${tempMedia.id}`, {
      method: "DELETE",
    });

    const res = await deleteMedia(req, { params: Promise.resolve({ id: tempMedia.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to delete media`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from deleting media`, res.status === 403, `Status: ${res.status}`);
      // Cleanup manually
      await prisma.media.delete({ where: { id: tempMedia.id } });
    }
  }

  // 4. Test Media Folder Creation (POST /api/internal/media/folders)
  // Allowed for: OWNER, ADMIN (Blocked for EDITOR)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const req = new NextRequest(`http://localhost:3000/api/internal/media/folders`, {
      method: "POST",
      body: JSON.stringify({
        name: `Folder ${role} ${suffix}`,
      }),
    });

    const res = await createFolder(req);
    if (isAllowed) {
      assert(`${role} is allowed to create media folder`, res.status === 200, `Status: ${res.status}`);
      if (res.status === 200) {
        const body = await res.json();
        await prisma.mediaFolder.delete({ where: { id: body.data.id } }).catch(() => {});
      }
    } else {
      assert(`${role} is blocked from creating media folder`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // Set up static folder for update/delete/bulk tests
  const testFolder = await prisma.mediaFolder.create({
    data: {
      workspaceId: workspace.id,
      name: `Folder Test ${suffix}`,
    },
  });

  // 5. Test Media Folder Update (PATCH /api/internal/media/folders/[id])
  // Allowed for: OWNER, ADMIN
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const req = new NextRequest(`http://localhost:3000/api/internal/media/folders/${testFolder.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: `Folder Test Renamed ${role} ${suffix}`,
      }),
    });

    const res = await updateFolder(req, { params: Promise.resolve({ id: testFolder.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to update media folder`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from updating media folder`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 6. Test Media Folder Deletion (DELETE /api/internal/media/folders/[id])
  // Allowed for: OWNER, ADMIN
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    // Create temp folder
    const tempFolder = await prisma.mediaFolder.create({
      data: {
        workspaceId: workspace.id,
        name: `Folder Temp ${role} ${suffix}`,
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/internal/media/folders/${tempFolder.id}?mode=empty`, {
      method: "DELETE",
    });

    const res = await deleteFolder(req, { params: Promise.resolve({ id: tempFolder.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to delete media folder`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from deleting media folder`, res.status === 403, `Status: ${res.status}`);
      await prisma.mediaFolder.delete({ where: { id: tempFolder.id } });
    }
  }

  // 7. Test Media Bulk Action (POST /api/internal/media/bulk)
  // Allowed for: OWNER, ADMIN
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const req = new NextRequest(`http://localhost:3000/api/internal/media/bulk`, {
      method: "POST",
      body: JSON.stringify({
        ids: [testMediaItem.id],
        action: "move",
        targetFolderId: testFolder.id,
      }),
    });

    const res = await bulkMedia(req);
    if (isAllowed) {
      assert(`${role} is allowed to perform bulk media actions`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from bulk media actions`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // Clean up static media & folder
  await prisma.media.delete({ where: { id: testMediaItem.id } }).catch(() => {});
  await prisma.mediaFolder.delete({ where: { id: testFolder.id } }).catch(() => {});

  // Restore storage instance upload method
  storage.upload = originalUpload;
}
