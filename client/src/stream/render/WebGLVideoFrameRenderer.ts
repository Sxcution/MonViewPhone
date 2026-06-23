import { VideoFrameRenderer } from './VideoFrameRenderer';

const VS = `
  attribute vec2 position;
  varying vec2 texCoord;
  void main() {
    texCoord = position * 0.5 + 0.5;
    // VideoFrame texture orientation needs y-inversion relative to WebGL coordinates
    texCoord.y = 1.0 - texCoord.y;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FS = `
  precision mediump float;
  varying vec2 texCoord;
  uniform sampler2D u_texture;
  void main() {
    gl_FragColor = texture2D(u_texture, texCoord);
  }
`;

export class WebGLVideoFrameRenderer implements VideoFrameRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private positionLocation = -1;
  private lastDrawTime = 0;
  private closed = false;
  public maxFps: number;

  constructor(canvas: HTMLCanvasElement, maxFps: number = 15) {
    this.canvas = canvas;
    this.maxFps = maxFps;
    
    const options: WebGLContextAttributes = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false
    };

    this.gl = (canvas.getContext('webgl', options) || 
               canvas.getContext('experimental-webgl', options)) as WebGLRenderingContext | null;

    if (!this.gl) {
      throw new Error('WebGL is not supported by this browser/canvas.');
    }

    this.initWebGL();
  }

  private initWebGL() {
    const gl = this.gl!;

    // Create and compile shaders
    const vsShader = this.compileShader(gl.VERTEX_SHADER, VS);
    const fsShader = this.compileShader(gl.FRAGMENT_SHADER, FS);

    // Create program
    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create WebGL program.');
    gl.attachShader(program, vsShader);
    gl.attachShader(program, fsShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vsShader);
      gl.deleteShader(fsShader);
      throw new Error('WebGL program link failed: ' + err);
    }
    this.program = program;

    // Shader cleanup since they are linked into the program
    gl.deleteShader(vsShader);
    gl.deleteShader(fsShader);

    // Setup full-screen quad vertices
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);

    this.buffer = gl.createBuffer();
    if (!this.buffer) throw new Error('Failed to create WebGL buffer.');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.positionLocation = gl.getAttribLocation(program, 'position');

    // Create texture
    this.texture = gl.createTexture();
    if (!this.texture) throw new Error('Failed to create WebGL texture.');
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl!;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader.');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compilation failed: ' + err);
    }
    return shader;
  }

  draw(frame: VideoFrame) {
    if (this.closed || !this.gl || !this.program || !this.texture) return;

    const gl = this.gl;

    // Update canvas size and viewport if frame dimensions changed
    if (this.canvas.width !== frame.displayWidth || this.canvas.height !== frame.displayHeight) {
      this.canvas.width = frame.displayWidth;
      this.canvas.height = frame.displayHeight;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    gl.useProgram(this.program);

    // Setup coordinates buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Upload texture pixel data from VideoFrame
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  clear() {
    if (this.closed || !this.gl) return;
    const gl = this.gl;
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  close() {
    this.closed = true;
    const gl = this.gl;
    if (gl) {
      try {
        if (this.buffer) gl.deleteBuffer(this.buffer);
        if (this.texture) gl.deleteTexture(this.texture);
        if (this.program) gl.deleteProgram(this.program);
      } catch {}
    }
    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.texture = null;
  }
}
