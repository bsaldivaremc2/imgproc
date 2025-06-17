const imageUpload = document.getElementById("imageUpload");
const imageCanvas = document.getElementById("imageCanvas");
const resultCanvas = document.getElementById("resultCanvas");
const zoomSlider = document.getElementById("zoom");
const selectModeBtn = document.getElementById("selectMode");
const makeTransparentBtn = document.getElementById("makeTransparent");
const colorPreview = document.getElementById("colorPreview");
const downloadBtn = document.getElementById("downloadBtn");

const imageCtx = imageCanvas.getContext("2d");
const resultCtx = resultCanvas.getContext("2d");

let image = null;
let scale = 1;
let selecting = false;
let selectedColor = null;
let imageName = "output";

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
      imageCtx.drawImage(img, 0, 0);
      resultCtx.drawImage(img, 0, 0);
      image = img;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

zoomSlider.addEventListener("input", () => {
  scale = parseFloat(zoomSlider.value);
  if (image) {
    drawImageScaled();
  }
});

function drawImageScaled() {
  imageCanvas.style.transform = `scale(${scale})`;
  imageCanvas.style.transformOrigin = "0 0";
}

selectModeBtn.addEventListener("click", () => {
  selecting = true;
});

imageCanvas.addEventListener("click", (e) => {
  if (!selecting) return;

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

  const imageData = imageCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
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
