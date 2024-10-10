// Use the global pdfjsLib and PDFLib objects

// Set up the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js`;

const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const gallery = document.getElementById('gallery');
const splitButton = document.getElementById('splitButton');
const pageContainer = document.getElementById('pageContainer');

let pdfFile = null;

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropArea.classList.add('highlight');
}

function unhighlight(e) {
  dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

fileElem.addEventListener('change', function() {
  handleFiles(this.files);
});

function handleFiles(files) {
  if (files.length > 0 && files[0].type === 'application/pdf') {
    pdfFile = files[0];
    updateGallery();
    splitButton.disabled = false;
  } else {
    alert('Please select a valid PDF file.');
  }
}

function updateGallery() {
  gallery.innerHTML = '';
  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-info';
  fileInfo.textContent = `File: ${pdfFile.name} (${formatFileSize(pdfFile.size)})`;
  gallery.appendChild(fileInfo);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

splitButton.addEventListener('click', async () => {
  if (!pdfFile) {
    alert('Please select a PDF file first.');
    return;
  }

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;

  pageContainer.innerHTML = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    const downloadButton = document.createElement('button');
    downloadButton.textContent = `Download Page ${i}`;
    downloadButton.className = 'download-button';
    downloadButton.addEventListener('click', () => downloadPage(arrayBuffer, i));

    const pagePreview = document.createElement('div');
    pagePreview.className = 'page-preview';
    pagePreview.appendChild(canvas);
    pagePreview.appendChild(downloadButton);

    pageContainer.appendChild(pagePreview);
  }
});

async function downloadPage(pdfArrayBuffer, pageNum) {
  const pdfDoc = await PDFLib.PDFDocument.load(pdfArrayBuffer);
  const newPdfDoc = await PDFLib.PDFDocument.create();

  const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
  newPdfDoc.addPage(copiedPage);

  const pdfBytes = await newPdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `page_${pageNum}.pdf`;
  link.click();
}