import archiver from 'archiver';
import fs from 'fs';

/**
 * @param source
 * @param out
 * @returns {Promise<void>}
 */
export const zipDirectory = (source: string, out: string): Promise<void> => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise<void>((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', (err) => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
};
