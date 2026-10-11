import { describe, expect, it } from 'vitest';
import { createInitialProject } from '../engine/defaultData';
import { serializeProject } from '../services/image/mediaStore';

describe('project image persistence', () => {
  it('stores media paths without temporary browser URLs', () => {
    const project = createInitialProject('single');
    project.slides[0].content.image = {
      url: 'blob:http://localhost/current',
      originalUrl: 'blob:http://localhost/original',
      storagePath: 'cloud:current.png',
      originalStoragePath: 'cloud:original.png',
    };

    const image = serializeProject(project).slides[0].content.image;
    expect(image).toMatchObject({
      storagePath: 'cloud:current.png',
      originalStoragePath: 'cloud:original.png',
    });
    expect(image?.url).toBeUndefined();
    expect(image?.originalUrl).toBeUndefined();
  });

  it('flags old blob-only photos for reupload', () => {
    const project = createInitialProject('single');
    project.slides[0].content.image = { url: 'blob:http://localhost/expired' };

    const image = serializeProject(project).slides[0].content.image;
    expect(image?.missing).toBe(true);
    expect(image?.url).toBeUndefined();
  });
});
