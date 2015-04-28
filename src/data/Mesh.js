
var Mesh = function(data) {
  this.zoom = 16;

  if (typeof data === 'object') {
    this.onLoad(data);
  }
};

(function() {

  function createBuffer(itemSize, data) {
    var buffer = gl.createBuffer();
    buffer.itemSize = itemSize;
    buffer.numItems = data.length/itemSize;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  }

  //***************************************************************************

  Mesh.prototype.load = function(url) {
    this.request = XHR.loadJSON(url, this.onLoad.bind(this));
  };

  Mesh.prototype.onLoad = function(json) {
    this.request = null;

    var
      worldSize = TILE_SIZE * Math.pow(2, this.zoom),
      p = project(json.offset.latitude, json.offset.longitude, worldSize);

    this.x = p.x;
    this.y = p.y;

    var geom = JS3D.read(this.x, this.y, this.zoom, json);
    this.vertexBuffer = createBuffer(3, new Float32Array(geom.vertices));
    this.normalBuffer = createBuffer(3, new Float32Array(geom.normals));
    this.colorBuffer  = createBuffer(3, new Uint8Array(geom.colors));
    geom = null; json = null;
    this.isReady = true;
  };

  Mesh.prototype.render = function(program, projection) {
    if (!this.isReady || !this.isVisible()) {
      return;
    }

    var ratio = 1/Math.pow(2, this.zoom-Map.zoom);
    var size = Map.size;
    var origin = Map.origin;

    var matrix = Matrix.create();

    matrix = Matrix.scale(matrix, ratio, ratio, ratio*0.65);
    matrix = Matrix.translate(matrix, this.x*ratio - origin.x, this.y*ratio - origin.y, 0);
    matrix = Matrix.rotateZ(matrix, Map.rotation);
    matrix = Matrix.rotateX(matrix, Map.tilt);
    matrix = Matrix.translate(matrix, size.width/2, size.height/2, 0);
    matrix = Matrix.multiply(matrix, projection);

    gl.uniformMatrix4fv(program.uniforms.uMatrix, false, new Float32Array(matrix));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(program.attributes.aPosition, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(program.attributes.aNormal, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.vertexAttribPointer(program.attributes.aColor, this.colorBuffer.itemSize, gl.UNSIGNED_BYTE, true, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexBuffer.numItems);
  };

  Mesh.prototype.isVisible = function(key, buffer) {
    buffer = buffer || 0;
return true;
  };

  Mesh.prototype.destroy = function() {
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteBuffer(this.normalBuffer);
    gl.deleteBuffer(this.colorBuffer);

    if (this.request) {
      this.request.abort();
    }
  };

}());