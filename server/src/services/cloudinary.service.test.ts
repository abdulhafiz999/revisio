import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadPdf, deletePdf, parseCloudinaryUrl } from './cloudinary.service';

vi.mock('../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

describe('Cloudinary Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports upload and delete functions', () => {
    expect(uploadPdf).toBeDefined();
    expect(deletePdf).toBeDefined();
  });

  it('parses Cloudinary raw and image PDF URLs', () => {
    expect(
      parseCloudinaryUrl(
        'https://res.cloudinary.com/demo/raw/upload/v123/revisio/notes/user/123_file.pdf'
      )
    ).toEqual({ publicId: 'revisio/notes/user/123_file', resourceType: 'raw' });

    expect(
      parseCloudinaryUrl(
        'https://res.cloudinary.com/demo/image/upload/v123/revisio/notes/user/123_Lecture%203.pdf'
      )
    ).toEqual({ publicId: 'revisio/notes/user/123_Lecture 3', resourceType: 'image' });
  });

  it('returns null for non-Cloudinary URLs', () => {
    expect(parseCloudinaryUrl('https://example.com/file.pdf')).toBeNull();
  });
});
