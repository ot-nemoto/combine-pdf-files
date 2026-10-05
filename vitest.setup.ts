import "@testing-library/jest-dom/vitest";

// jsdom's URL.createObjectURL (via vitest's jsdom-compat shim) tries to read an
// internal Blob symbol via `Object.getOwnPropertySymbols(new window.Blob())[0]`.
// jsdom's Blob no longer exposes that symbol, so the shim throws
// "Cannot read properties of undefined (reading '_bytes')". Tests don't need
// real Blob URL semantics, so always use a simple mock instead of relying on
// that (currently broken) native/compat implementation.
let blobUrlCounter = 0;
URL.createObjectURL = () => `blob:mock-url-${++blobUrlCounter}`;
URL.revokeObjectURL = () => {};

// jsdom's File/Blob may not implement arrayBuffer(); polyfill it
if (!File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = function () {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
