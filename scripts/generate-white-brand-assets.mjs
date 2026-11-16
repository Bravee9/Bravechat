import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function generate() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Read favicon.png from assets
  const faviconPath = path.resolve('assets/images/favicon.png');
  const faviconBase64 = fs.readFileSync(faviconPath).toString('base64');
  const faviconDataUrl = `data:image/png;base64,${faviconBase64}`;

  // Read bravemath-logo-4-1.png from assets
  const logo41Path = path.resolve('assets/images/bravemath-logo-4-1.png');
  const logo41Base64 = fs.readFileSync(logo41Path).toString('base64');
  const logo41DataUrl = `data:image/png;base64,${logo41Base64}`;

  console.log('Processing images in browser canvas...');

  const result = await page.evaluate(async ({ faviconUrl, logoUrl }) => {
    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    }

    // Process Favicon / Ribbon icon -> pure white with original alpha
    const iconImg = await loadImage(faviconUrl);
    const canvas = document.createElement('canvas');
    canvas.width = iconImg.naturalWidth;
    canvas.height = iconImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(iconImg, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Convert non-transparent pixels to pure white (#ffffff), keeping smooth alpha channel
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        // keep alpha intact for smooth antialiasing
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Also produce a 128x128 high-DPI icon version for UI rail
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = 128;
    smallCanvas.height = 128;
    const sCtx = smallCanvas.getContext('2d');
    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.drawImage(canvas, 0, 0, 128, 128);

    // Process Wordmark logo
    const wordmarkImg = await loadImage(logoUrl);
    const wCanvas = document.createElement('canvas');
    wCanvas.width = wordmarkImg.naturalWidth;
    wCanvas.height = wordmarkImg.naturalHeight;
    const wCtx = wCanvas.getContext('2d');
    wCtx.drawImage(wordmarkImg, 0, 0);

    const wImgData = wCtx.getImageData(0, 0, wCanvas.width, wCanvas.height);
    const wData = wImgData.data;
    for (let i = 0; i < wData.length; i += 4) {
      const alpha = wData[i + 3];
      if (alpha > 0) {
        wData[i] = 255;
        wData[i + 1] = 255;
        wData[i + 2] = 255;
      }
    }
    wCtx.putImageData(wImgData, 0, 0);

    return {
      whiteIconFull: canvas.toDataURL('image/png'),
      whiteIcon128: smallCanvas.toDataURL('image/png'),
      whiteWordmark: wCanvas.toDataURL('image/png'),
      dimensions: {
        icon: { w: canvas.width, h: canvas.height },
        wordmark: { w: wCanvas.width, h: wCanvas.height }
      }
    };
  }, { faviconUrl: faviconDataUrl, logoUrl: logo41DataUrl });

  console.log('Result dimensions:', result.dimensions);

  function saveBase64(dataUrl, destPath) {
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, Buffer.from(base64, 'base64'));
    console.log(`Saved: ${destPath} (${(Buffer.from(base64, 'base64').length / 1024).toFixed(1)} KB)`);
  }

  // Save to assets/images
  saveBase64(result.whiteIconFull, 'assets/images/bravemath-icon-white.png');
  saveBase64(result.whiteIcon128, 'assets/images/bravemath-icon-white-128.png');
  saveBase64(result.whiteWordmark, 'assets/images/bravemath-wordmark-white.png');

  // Save to apps/web/public/
  saveBase64(result.whiteIconFull, 'apps/web/public/bravemath-icon-white.png');
  saveBase64(result.whiteIcon128, 'apps/web/public/bravemath-icon-white-128.png');
  saveBase64(result.whiteWordmark, 'apps/web/public/bravemath-wordmark-white.png');

  await browser.close();
  console.log('Brand asset generation complete!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
