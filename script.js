const imageUpload = document.getElementById("imageUpload");
const imageCanvas = document.getElementById("imageCanvas");
const resultCanvas = document.getElementById("resultCanvas");
const zoomSlider = document.getElementById("zoom");
const selectModeBtn = document.getElementById("selectMode");
const makeTransparentBtn = document.getElementById("makeTransparent");
const colorPreview = document.getElementById("colorPreview");
const downloadBtn = document.getElementById("downloadBtn");
const eraserBtn = document.getElementById("eraserMode");
const eraserSizeInput = document.getElementById("eraserSize");

const imageCtx = imageCanvas.getContext("2d");
const resultCtx = resultCanvas.getContext("2d");

let image = null;
let scale = 1;
let selecting = false;
let selectedColor = null;
let imageName = "output";

// Eraser state
let eraserActive = false;
let erasing = false;
let eraserSize = parseInt(eraserSizeInput.value, 10);

imageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  imageName = file.name.split('.').slice(0, -1).join('.') || "output";

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;
      resultCanvas.width = img.width;
      resultCanvas.height = img.height;
      imageCtx.clearRect(0, 0, img.width, img.height);
      resultCtx.clearRect(0, 0, img.width, img.height);
      imageCtx.drawImage(img, 0, 0);
      resultCtx.drawImage(img, 0, 0);
      image = img;
      drawImageScaled();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  drawImageScaled();
});

function drawImageScaled() {
  imageCanvas.style.transform = `scale(${scale})`;
  imageCanvas.style.transformOrigin = "0 0";
}

selectModeBtn.addEventListener("click", () => {
  selecting = true;
  eraserActive = false;
  eraserBtn.textContent = "Eraser Mode";
});

imageCanvas.addEventListener("click", (e) => {
  if (!selecting || !image) return;

  const rect = imageCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / scale);
  const y = Math.floor((e.clientY - rect.top) / scale);
  const pixel = imageCtx.getImageData(x, y, 1, 1).data;

  selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
  colorPreview.style.backgroundColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  selecting = false;
});

makeTransparentBtn.addEventListener("click", () => {
  if (!selectedColor || !image) return;

  const imageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
  const data = imageData.data;
  const tolerance = 10;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];

    if (
      Math.abs(r - selectedColor.r) <= tolerance &&
      Math.abs(g - selectedColor.g) <= tolerance &&
      Math.abs(b - selectedColor.b) <= tolerance
    ) {
      data[i + 3] = 0; // make transparent
    }
  }

  resultCtx.putImageData(imageData, 0, 0);
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `${imageName}_toTransparent.png`;
  link.href = resultCanvas.toDataURL("image/png");
  link.click();
});

// Eraser mode
eraserBtn.addEventListener("click", () => {
  eraserActive = !eraserActive;
  eraserBtn.textContent = eraserActive ? "Eraser: ON" : "Eraser Mode";
  selecting = false;
});

eraserSizeInput.addEventListener("input", () => {
  eraserSize = parseInt(eraserSizeInput.value, 10);
});

imageCanvas.addEventListener("mousedown", (e) => {
  if (!eraserActive) return;
  erasing = true;
  eraseAtMouse(e);
});

imageCanvas.addEventListener("mouseup", () => {
  if (eraserActive) erasing = false;
});

imageCanvas.addEventListener("mousemove", (e) => {
  if (eraserActive && erasing) {
    eraseAtMouse(e);
  }
});

function eraseAtMouse(e) {
  if (!image) return;

  const rect = imageCanvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / scale);
  const y = Math.floor((e.clientY - rect.top) / scale);

  const imageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
  const data = imageData.data;
  const width = resultCanvas.width;

  for (let dy = -eraserSize; dy <= eraserSize; dy++) {
    for (let dx = -eraserSize; dx <= eraserSize; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || py < 0 || px >= width || py >= resultCanvas.height) continue;
      const i = (py * width + px) * 4;
      data[i + 3] = 0; // make transparent
    }
  }

  resultCtx.putImageData(imageData, 0, 0);
}
