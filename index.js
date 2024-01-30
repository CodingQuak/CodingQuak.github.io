"use strict";
main();

function main() {
	const canvas = document.querySelector("#glcanvas");
	const gl = canvas.getContext("webgl2");
	if (gl === null) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	};
	var vertexShaderSource = `#version 300 es
in vec2 a_position;
uniform vec2 u_resolution;
uniform mat3 u_matrix;
out vec4 v_color;

void main() {
	vec2 position = (u_matrix * vec3(a_position, 1)).xy;
	vec2 zeroToOne = position / u_resolution;
	vec2 zeroToTwo = zeroToOne * 2.0;
	vec2 clipSpace = zeroToTwo - 1.0;
	gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
	v_color = gl_Position * 0.5 + 0.5;
}
`;
	var fragmentShaderSource = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() {
	outColor = v_color;
}
`;
	var transformMat3 = {
		translation: function(tx, ty) {
			return [
				1, 0, 0,
				0, 1, 0,
				tx, ty, 1,
			];
		},
		rotation: function(r) {
			var c = Math.cos(r);
			var s = Math.sin(r);
			return [
				c, -s, 0,
				s, c, 0,
				0, 0, 1,
			];
		},
		scaling: function(sx, sy) {
			return [
				sx, 0, 0,
				0, sy, 0,
				0, 0, 1,
			];
		},
		multiply: function(a, b) {
			var a00 = a[0];
			var a01 = a[1];
			var a02 = a[2];
			var a10 = a[3];
			var a11 = a[4];
			var a12 = a[5];
			var a20 = a[6];
			var a21 = a[7];
			var a22 = a[8];
			var b00 = b[0];
			var b01 = b[1];
			var b02 = b[2];
			var b10 = b[3];
			var b11 = b[4];
			var b12 = b[5];
			var b20 = b[6];
			var b21 = b[7];
			var b22 = b[8];
			return [
				b00 * a00 + b01 * a10 + b02 * a20,
				b00 * a01 + b01 * a11 + b02 * a21,
				b00 * a02 + b01 * a12 + b02 * a22,
				b10 * a00 + b11 * a10 + b12 * a20,
				b10 * a01 + b11 * a11 + b12 * a21,
				b10 * a02 + b11 * a12 + b12 * a22,
				b20 * a00 + b21 * a10 + b22 * a20,
				b20 * a01 + b21 * a11 + b22 * a21,
				b20 * a02 + b21 * a12 + b22 * a22,
			];
		},
	};
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
	const program = createProgram(gl, vertexShader, fragmentShader);

	const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	const matrixLoc = gl.getUniformLocation(program, "u_matrix");
	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(program);
	gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.width);

	const i_max = 12
	const x1 = 0;
	const x2 = 20;
	const y1 = 0;
	const y2 = 100;
	const x3 = 20;
	const x4 = 60;
	const y3 = 40;
	const y4 = 60;
	const square = [
		x1, y1,
		x2, y1,
		x1, y2,
		x1, y2,
		x2, y1,
		x2, y2,
		x3, y3,
		x4, y3,
		x3, y4,
		x3, y4,
		x4, y3,
		x4, y4,
		];
	var translation = {x: 0, y: 0};
	var rotation = 0;
	var scale = {x: 1, y: 1};
	for (var i = 0; i < i_max; i++) {
		translation.x += 40
		translation.y += 40
		rotation -= 13
		scale.x += 0.2
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square), gl.STATIC_DRAW);
		var translationMatrix = transformMat3.translation(translation.x, translation.y);
		var rotationMatrix = transformMat3.rotation(rotation);
		var scaleMatrix = transformMat3.scaling(scale.x, scale.y);
		var matrix = transformMat3.multiply(translationMatrix, rotationMatrix);
		matrix = transformMat3.multiply(matrix, scaleMatrix);
		gl.uniformMatrix3fv(matrixLoc, false, matrix);
		
		const primitiveType = gl.TRIANGLES;
		var offset = 0;
		var count = 12;
		gl.drawArrays(primitiveType, offset, count);
	};
}
function unitRotation(degrees) {
	var radians = degrees * Math.PI / 180;
	return [math.sin(radians), math.cos(radians)]
};
function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	};
	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
};

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	const success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	};
	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
};
