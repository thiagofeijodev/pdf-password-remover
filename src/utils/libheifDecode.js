import libheif from 'libheif-js/wasm-bundle.js';

function cleanupImages(images) {
  for (const image of images) {
    if (image && typeof image.free === 'function') {
      image.free();
    }
  }
}

function selectImage(images) {
  return (
    images.find((image) => typeof image.is_primary === 'function' && image.is_primary()) ||
    images[0]
  );
}

export async function decodeHeicBuffer(buffer) {
  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(new Uint8Array(buffer));

  if (!images || images.length === 0) {
    throw new Error('No HEIC images were found in the selected file');
  }

  const image = selectImage(images);
  const width = image.get_width();
  const height = image.get_height();
  const imageData = {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  };

  try {
    await new Promise((resolve, reject) => {
      image.display(imageData, (displayData) => {
        if (!displayData) {
          reject(new Error('HEIC decoding failed'));
          return;
        }
        resolve(displayData);
      });
    });

    return imageData;
  } finally {
    cleanupImages(images);
  }
}
