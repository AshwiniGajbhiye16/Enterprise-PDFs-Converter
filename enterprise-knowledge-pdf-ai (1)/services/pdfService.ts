
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for the ESM instance of pdfjs-dist.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

const MAX_IMAGE_DIMENSION = 2000; // Limit dimensions to prevent payload size errors

/**
 * Converts a specific PDF page to a base64 image string.
 * Optimized for Gemini OCR: Balances quality and payload size.
 */
export const convertPageToImage = async (pdfData: ArrayBuffer, pageNumber: number): Promise<string> => {
  const dataCopy = new Uint8Array(pdfData.slice(0));
  const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
  const pdf = await loadingTask.promise;
  
  try {
    const page = await pdf.getPage(pageNumber);
    const originalViewport = page.getViewport({ scale: 1.0 });
    
    // Calculate scale to keep the image within MAX_IMAGE_DIMENSION
    const maxDim = Math.max(originalViewport.width, originalViewport.height);
    let scale = 1.5; // Default good OCR scale
    
    if (maxDim * scale > MAX_IMAGE_DIMENSION) {
      scale = MAX_IMAGE_DIMENSION / maxDim;
    }
    
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error('Could not create canvas context');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    // Lowering quality slightly to 0.8 significantly reduces base64 payload size
    // while remaining perfectly legible for Gemini 3 Flash OCR.
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  } finally {
    await pdf.destroy();
  }
};

/**
 * Gets the total number of pages in a PDF document.
 */
export const getPageCount = async (pdfData: ArrayBuffer): Promise<number> => {
  const dataCopy = new Uint8Array(pdfData.slice(0));
  const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
  const pdf = await loadingTask.promise;
  
  try {
    return pdf.numPages;
  } finally {
    await pdf.destroy();
  }
};
