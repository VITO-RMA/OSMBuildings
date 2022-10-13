GLX.texture.Image = class {
  constructor() {
    this.abortController = null;
    this.id = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, this.id);

    //GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    //GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

    GL.bindTexture(GL.TEXTURE_2D, null);
  }

  clamp(image, maxSize) {
    if (image.width <= maxSize && image.height <= maxSize) {
      return image;
    }

    let w = maxSize,
      h = maxSize;
    const ratio = image.width / image.height;
    // TODO: if other dimension doesn't fit to POT after resize, there is still trouble
    if (ratio < 1) {
      w = Math.round(h * ratio);
    } else {
      h = Math.round(w / ratio);
    }

    const canvas = document.createElement("CANVAS");
    canvas.width = w;
    canvas.height = h;

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  load(url, callback, options) {
    //load image with the header!
    const thisArg = this;
    if (options && options.headers) {
      if (this.abortController) this.abortController.abort();
      return (thisArg.abortController = fetchImage(
        url,
        (blob) => {
          createImageBitmap(blob, 0, 0, 256, 256)
            .then((image) => {
              thisArg.set(image);
              if (callback) {
                callback(image);
              }
            })
            .catch((error) => {
              if (callback) {
                callback();
              }
            });
        },
        options.headers
      ));
    }

    const image = new Image();
    image.crossOrigin = "*";
    image.onload = (e) => {
      this.set(image);
      if (callback) {
        callback(image);
      }
    };
    image.onerror = (e) => {
      if (callback) {
        callback();
      }
    };
    image.src = url;

    function fetchImage(url, callback, headers) {
      const controller = new AbortController();
      const signal = controller.signal;

      try {
        fetch(url, {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "image/png",
            Accept:
              "image/png,image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            ...headers,
          },
          signal: signal,
        })
          .then((f) => {
            f.blob()
              .then(callback)
              .catch((error) => {
                /** //ignore */
                return false;
              });
          })
          .catch((error) => {
            /** //ignore */
            return false;
          });
      } catch (error) {
        //ignore error plix!!
        return false;
      }
      return controller;
    }
  }

  color(color) {
    GL.bindTexture(GL.TEXTURE_2D, this.id);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texImage2D(
      GL.TEXTURE_2D,
      0,
      GL.RGBA,
      1,
      1,
      0,
      GL.RGBA,
      GL.UNSIGNED_BYTE,
      new Uint8Array([
        color[0] * 255,
        color[1] * 255,
        color[2] * 255,
        (color[3] === undefined ? 0.0 : color[3]) * 255,
      ])
    );
    GL.bindTexture(GL.TEXTURE_2D, null);
  }

  set(image) {
    if (!this.id) {
      // texture had been destroyed
      return;
    }

    image = this.clamp(image, GL.getParameter(GL.MAX_TEXTURE_SIZE));

    GL.bindTexture(GL.TEXTURE_2D, this.id);
    GL.texParameteri(
      GL.TEXTURE_2D,
      GL.TEXTURE_MIN_FILTER,
      GL.LINEAR_MIPMAP_NEAREST
    );
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);

    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
    GL.generateMipmap(GL.TEXTURE_2D);

    if (GL.anisotropyExtension) {
      // TODO OSMB4 use this dynamically
      GL.texParameterf(
        GL.TEXTURE_2D,
        GL.anisotropyExtension.TEXTURE_MAX_ANISOTROPY_EXT,
        GL.anisotropyExtension.maxAnisotropyLevel
      );
    }

    GL.bindTexture(GL.TEXTURE_2D, null);
  }

  enable(index) {
    if (!this.id) {
      return;
    }
    GL.activeTexture(GL.TEXTURE0 + (index || 0));
    GL.bindTexture(GL.TEXTURE_2D, this.id);
  }

  destroy() {
    GL.bindTexture(GL.TEXTURE_2D, null);
    GL.deleteTexture(this.id);
    this.id = null;
    if (this.abortController) this.abortController.abort();
    this.abortController = null;
  }
};
