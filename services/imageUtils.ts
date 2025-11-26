import { FilterType } from '../types';

export const applyFilter = async (dataUrl: string, filter: FilterType): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('No context');
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      if (filter === FilterType.GRAYSCALE) {
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;     // R
          data[i + 1] = avg; // G
          data[i + 2] = avg; // B
        }
      } else if (filter === FilterType.MAGIC) {
        // High Contrast B&W (Thresholding with a twist)
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Soft thresholding
          const v = avg > 110 ? 255 : 0;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        }
      } else if (filter === FilterType.LIGHTEN) {
         // Gamma correction approximation
         for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.3);
          data[i + 1] = Math.min(255, data[i + 1] * 1.3);
          data[i + 2] = Math.min(255, data[i + 2] * 1.3);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

export const rotateImage = async (dataUrl: string, degrees: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject();

      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = dataUrl;
  });
};

export const addWatermark = async (dataUrl: string, text: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if(!ctx) return reject();

            ctx.drawImage(img, 0, 0);
            
            const fontSize = Math.floor(img.width / 20);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();

            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = dataUrl;
    });
};

export const overlaySignature = async (baseImgUrl: string, signatureUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const baseImg = new Image();
        baseImg.onload = () => {
            const sigImg = new Image();
            sigImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = baseImg.width;
                canvas.height = baseImg.height;
                const ctx = canvas.getContext('2d');
                if(!ctx) return reject();

                ctx.drawImage(baseImg, 0, 0);
                
                // Draw signature at bottom right, 30% width of doc
                const sigWidth = baseImg.width * 0.3;
                const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
                const x = baseImg.width - sigWidth - (baseImg.width * 0.05);
                const y = baseImg.height - sigHeight - (baseImg.height * 0.05);

                ctx.drawImage(sigImg, x, y, sigWidth, sigHeight);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            }
            sigImg.src = signatureUrl;
        };
        baseImg.src = baseImgUrl;
    });
}

// Compress by reducing quality
export const compressImage = async (dataUrl: string, quality: number = 0.5): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
             const canvas = document.createElement('canvas');
             canvas.width = img.width;
             canvas.height = img.height;
             const ctx = canvas.getContext('2d');
             if(!ctx) return reject();
             ctx.drawImage(img, 0, 0);
             resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    });
}

export const generatePDF = (images: string[], isPro: boolean): void => {
  const printWindow = window.open('', '_blank');
  if(!printWindow) return;

  // For Free users, add a small watermark text overlay in CSS
  const watermarkCSS = !isPro ? `
    .page::after {
        content: "Scanned with AI ScanMaster Free";
        position: absolute;
        bottom: 20px;
        right: 20px;
        color: rgba(0,0,0,0.5);
        font-family: sans-serif;
        font-size: 12px;
        z-index: 10;
        background: rgba(255,255,255,0.8);
        padding: 4px 8px;
        border-radius: 4px;
    }
  ` : '';

  const content = `
    <html>
      <head>
        <title>AI ScanMaster Document</title>
        <style>
          body { margin: 0; padding: 0; background: #525659; display: flex; flex-direction: column; align-items: center; }
          .page { position: relative; background: white; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
          img { width: 100%; height: auto; display: block; }
          ${watermarkCSS}
          @media print {
            body { background: none; display: block; margin: 0; }
            .page { margin: 0; box-shadow: none; page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${images.map(img => `<div class="page"><img src="${img}" /></div>`).join('')}
        <script>
          window.onload = () => {
             setTimeout(() => {
                window.print();
                window.close();
             }, 800);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
};