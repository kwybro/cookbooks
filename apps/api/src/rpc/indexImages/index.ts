import { createIndexImage } from './create';
import { getIndexImage } from './get';
import { getUploadUrl } from './getUploadUrl';
import { listIndexImages } from './list';
import { processIndexImage } from './process';
import { uploadAndCreate } from './uploadAndCreate';

export const indexImagesRouter = {
  getUploadUrl,
  create: createIndexImage,
  uploadAndCreate,
  get: getIndexImage,
  list: listIndexImages,
  process: processIndexImage,
};
