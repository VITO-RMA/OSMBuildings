View.Overlaymap = class {
  constructor() {
    this.shader = new GLX.Shader({
      source: shaders.overlaymap,
      attributes: ["aPosition", "aTexCoord"],
      uniforms: [
        "uViewMatrix",
        "uModelMatrix",
        "uTexIndex",
        "uFogDistance",
        "uFogBlurDistance",
        "uAlpha",
        "uLowerEdgePoint",
        "uViewDirOnMap",
      ],
    });
  }

  render() {
    APP.gridLayers.forEach((layer, index) => {
      if (!layer) {
        return;
      }

      if (APP.zoom < layer.minZoom || APP.zoom > layer.maxZoom) {
        return;
      }

      const shader = this.shader;

      shader.enable();

      shader.setParam("uFogDistance", "1f", APP.view.fogDistance);
      shader.setParam("uFogBlurDistance", "1f", APP.view.fogBlurDistance);
      shader.setParam("uLowerEdgePoint", "2fv", APP.view.lowerLeftOnMap);
      shader.setParam("uViewDirOnMap", "2fv", APP.view.viewDirOnMap);
      shader.setParam("uAlpha", "1f", 0.2);

      const zoom = Math.round(APP.zoom);

      let tile;
      for (let key in layer.visibleTiles) {
        // TODO: do not refer to layer.visibleTiles
        tile = layer.tiles[key];

        if (tile && tile.isReady) {
          this.renderTile(tile, index);
          continue;
        }

        const parentKey = [(tile.x / 2) << 0, (tile.y / 2) << 0, zoom - 1].join(
          ","
        );
        if (layer.tiles[parentKey] && layer.tiles[parentKey].isReady) {
          // TODO: there will be overlap with adjacent tiles or parents of adjacent tiles!
          this.renderTile(layer.tiles[parentKey], index);
          continue;
        }

        const children = [
          [tile.x * 2, tile.y * 2, tile.zoom + 1].join(","),
          [tile.x * 2 + 1, tile.y * 2, tile.zoom + 1].join(","),
          [tile.x * 2, tile.y * 2 + 1, tile.zoom + 1].join(","),
          [tile.x * 2 + 1, tile.y * 2 + 1, tile.zoom + 1].join(","),
        ];

        for (let i = 0; i < 4; i++) {
          if (layer.tiles[children[i]] && layer.tiles[children[i]].isReady) {
            this.renderTile(layer.tiles[children[i]], index);
          }
        }
      }

      shader.disable();
    });
  }

  renderTile(tile, index) {
    const shader = this.shader;

    const modelMatrix = new GLX.Matrix();

    modelMatrix.translateBy(
      (tile.longitude - APP.position.longitude) * METERS_PER_DEGREE_LONGITUDE,
      (-tile.latitude + APP.position.latitude) * METERS_PER_DEGREE_LATITUDE,
      0
    );

    GL.enable(GL.POLYGON_OFFSET_FILL);
    GL.polygonOffset(
      MAX_USED_ZOOM_LEVEL - tile.zoom,
      MAX_USED_ZOOM_LEVEL - tile.zoom
    );

    shader.setMatrix("uModelMatrix", "4fv", modelMatrix.data);
    shader.setMatrix(
      "uViewMatrix",
      "4fv",
      GLX.Matrix.multiply(modelMatrix, APP.view.viewProjMatrix)
    );

    shader.setBuffer("aPosition", tile.vertexBuffer);
    shader.setBuffer("aTexCoord", tile.texCoordBuffer);
    shader.setParam("uAlpha", "1f", 0.2);
    shader.setTexture("uTexIndex", 0, tile.texture);

    GL.drawArrays(GL.TRIANGLE_STRIP, 0, tile.vertexBuffer.numItems);
    GL.disable(GL.POLYGON_OFFSET_FILL);
  }

  destroy() {
    APP.gridLayers.forEach((layer) => layer.destroy());
  }
};
