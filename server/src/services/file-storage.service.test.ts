import { describe, it, expect, vi, beforeEach } from 'vitest';

const { removeMock, fromMock } = vi.hoisted(() => {
  const removeMock = vi.fn().mockResolvedValue({ error: null });
  const fromMock = vi.fn(() => ({ remove: removeMock }));
  return { removeMock, fromMock };
});

vi.mock('../config/database', () => ({
  supabaseAdmin: {
    storage: { from: fromMock },
  },
}));

vi.mock('./cloudinary.service', () => ({
  deletePdfFromUrl: vi.fn().mockResolvedValue(undefined),
}));

import { deleteStoredFile } from './file-storage.service';
import { deletePdfFromUrl } from './cloudinary.service';

describe('file-storage.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes Cloudinary files', async () => {
    await deleteStoredFile('https://res.cloudinary.com/demo/raw/upload/v1/test.pdf');

    expect(deletePdfFromUrl).toHaveBeenCalledOnce();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('deletes legacy Supabase Storage files', async () => {
    await deleteStoredFile(
      'https://abc.supabase.co/storage/v1/object/public/notes/user123/file.pdf'
    );

    expect(fromMock).toHaveBeenCalledWith('notes');
    expect(removeMock).toHaveBeenCalledWith(['user123/file.pdf']);
    expect(deletePdfFromUrl).not.toHaveBeenCalled();
  });
});
