import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { getBinaryContent } from 'jszip-utils';
import sanitize from 'sanitize-filename';

declare var App: any;

let running = false;

export const checkIfDefinitionValid = async (definition) => {
  const pieceDirectory = definition.get('pieceDirectory');
  const url = new URL(`${pieceDirectory}/1.jpg`, document.baseURI).href;
  const response = await fetch(url);
  const body = await response.text();
  if (body.length > 0) return true;
  return false;
}

export const downloadBookAsZip = async (book) => {
  if (running) return;
  running = true;

  console.log(`Ripping ${book.lastPage} pages...`);

  const isHd = await checkIfDefinitionValid(book.hd);
  const definition = isHd ? book.hd : book.sd;

  console.log(`Using ${isHd ? 'HD' : 'SD'} quality`);

  const pages = await Promise.all([...(new Array(book.lastPage)).keys()]
    .map(pageNo => {
      const url = new URL(`${definition.get('pieceDirectory')}/${pageNo + 1}.jpg`, document.baseURI).href;
      return getBinaryContent(url).then((data: Blob) => {
        console.log(`Ripped page ${pageNo}, ${Math.trunc((pageNo / book.lastPage) * 100)}% complete`)
        return ({ filename: url.split('/').pop(), data });
      }).catch((err) => {
        console.warn(`Ripping page ${pageNo} failed`, err);
      });
    }));

  const zip = new JSZip();
  pages.forEach((entry) => {
    if (!entry.filename) return;
    zip.file(entry.filename, entry.data, {binary: true});
  });

  console.log('Creating zip...');
  const result = await zip.generateAsync({ type: 'blob' });

  console.log('Saving generated zip... This may take a moment');
  running = false;
  return saveAs(result, sanitize(book.get('title')) + '.zip');
}

globalThis.buttonAdded = false;

export const addButtonToUI = () => {
  if (globalThis.buttonAdded) {
    console.warn("Button already added to UI");
    return;
  }

  const div = document.createElement('div');
  div.className += 'acti-custom-second-toolbar-opener acti-toolbar-opener';
  div.addEventListener('click', () => downloadBookAsZip(App.book));
  div.innerHTML = `
  <style>
  .acti-custom-second-toolbar-opener {
    visibility: visible; 
    right: 80px;
  }
  .download-flat {
    display: block;
    width: 36px;
    height: 36px;
    background-size: cover;
    background-image: url(data:image/png;base64,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);
  }
  </style>
  <i class="download-flat"></i>`;
  document.getElementsByClassName('acti-toolbar-block')[0].appendChild(div);
}

setTimeout(() => addButtonToUI(), 1000);