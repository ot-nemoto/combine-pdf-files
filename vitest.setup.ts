import "@testing-library/jest-dom";

// jsdom does not implement URL.createObjectURL / revokeObjectURL
let blobUrlCounter = 0;
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = () => `blob:mock-url-${++blobUrlCounter}`;
}
if (typeof URL.revokeObjectURL === "undefined") {
  URL.revokeObjectURL = () => {};
}

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
