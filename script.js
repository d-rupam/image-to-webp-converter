document.addEventListener('DOMContentLoaded', () => {
    // Inject ONLY the minimal structural CSS needed for the image cards
    const style = document.createElement('style');
    style.innerHTML = `
        .a4-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; width: 100%; margin-top: 15px; }
        .a4-card { width: 100px; height: 140px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; position: relative; padding: 8px; text-align: center; user-select: none; }
        .a4-card:hover { border-color: rgba(255, 255, 255, 0.3); }
        .a4-icon-wrapper { height: 80px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 4px; background: rgba(0, 0, 0, 0.5); margin-bottom: 6px; }
        .a4-icon-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .a4-name { font-size: 0.7rem; color: inherit; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-all; line-height: 1.2; }
        .a4-remove { position: absolute; top: -6px; right: -6px; background: #ff3366; color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; z-index: 10; font-weight: bold; padding-bottom: 2px; }
        .a4-add { border: 2px dashed rgba(255, 255, 255, 0.2); background: transparent; cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .a4-add:hover { border-color: rgba(255, 255, 255, 0.5); }
    `;
    document.head.appendChild(style);

    const upload = document.getElementById('upload');
    const convertBtn = document.getElementById('convert-btn');
    const downloadLink = document.getElementById('download-link');
    const stats = document.getElementById('stats');
    const dropZone = document.getElementById('drop-zone');
    const resetBtn = document.getElementById('reset-btn');
    const dropText = document.getElementById('drop-text');
    const previewImage = document.getElementById('preview-image');

    let currentFiles = [];

    // Create the Grid Container inside your existing dropzone
    const gridContainer = document.createElement('div');
    gridContainer.className = 'a4-grid';
    gridContainer.style.display = 'none';
    dropZone.appendChild(gridContainer);
    
    // Reset function
    function resetUI() {
        currentFiles = [];
        upload.value = '';
        dropText.style.display = 'block';
        previewImage.style.display = 'none';
        previewImage.src = '';
        
        gridContainer.style.display = 'none';
        gridContainer.innerHTML = '';
        dropZone.style.display = 'flex';
        
        convertBtn.style.display = 'block';
        convertBtn.textContent = "Convert to WebP";
        convertBtn.disabled = true;
        
        downloadLink.style.display = 'none';
        stats.style.display = 'none';
        resetBtn.style.display = 'none';
    }

    // Process files and render cards
    function renderGrid() {
        gridContainer.innerHTML = '';
        
        if (currentFiles.length === 0) {
            dropText.style.display = 'block';
            gridContainer.style.display = 'none';
            convertBtn.disabled = true;
            convertBtn.textContent = "Convert to WebP";
            return;
        }
        
        dropText.style.display = 'none';
        gridContainer.style.display = 'flex';
        convertBtn.disabled = false;
        convertBtn.textContent = `Convert ${currentFiles.length} File${currentFiles.length > 1 ? 's' : ''}`;

        currentFiles.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'a4-card';
            
            const thumbUrl = URL.createObjectURL(file);
            
            card.innerHTML = `
                <button class="a4-remove" title="Remove File">x</button>
                <div class="a4-icon-wrapper">
                    <img src="${thumbUrl}" alt="Preview">
                </div>
                <div class="a4-name" title="${file.name}">${file.name}</div>
            `;
            
            // Remove specific file
            const removeBtn = card.querySelector('.a4-remove');
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentFiles.splice(index, 1);
                renderGrid();
            });
            
            // Prevent opening file dialog when clicking a card
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            
            gridContainer.appendChild(card);
        });
        
        // "Add More" Button Card
        const addMore = document.createElement('div');
        addMore.className = 'a4-card a4-add';
        addMore.innerHTML = `
            <div style="font-size: 2rem; color: #888;">+</div>
            <div class="a4-name" style="margin-top: 5px;">Add More</div>
        `;
        addMore.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            upload.click();
        });
        gridContainer.appendChild(addMore);
    }

    function processInputFiles(files) {
        const validFiles = Array.from(files).filter(file => file && file.type.startsWith('image/'));
        if (validFiles.length === 0) return;
        currentFiles = [...currentFiles, ...validFiles];
        renderGrid();
    }

    resetBtn.addEventListener('click', resetUI);

    // Click upload
    upload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processInputFiles(e.target.files);
            upload.value = ''; // Reset input
        }
    });

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) processInputFiles(e.dataTransfer.files);
    });

    // Paste
    window.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        const files = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                files.push(items[i].getAsFile());
            }
        }
        if (files.length > 0) processInputFiles(files);
    });

    // Conversion
    convertBtn.addEventListener('click', async () => {
        if (currentFiles.length === 0) return;
        
        convertBtn.disabled = true;
        let totalInitialSize = 0;
        let totalFinalSize = 0;

        // SINGLE IMAGE COMPRESSION
        if (currentFiles.length === 1) {
            convertBtn.textContent = "Converting...";
            const file = currentFiles[0];
            totalInitialSize = file.size;

            new Compressor(file, {
                quality: 0.8,
                mimeType: 'image/webp',
                success(result) {
                    totalFinalSize = result.size;
                    
                    convertBtn.style.display = 'none';
                    dropZone.style.display = 'none'; 
                    
                    const url = URL.createObjectURL(result);
                    downloadLink.href = url;
                    downloadLink.download = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    downloadLink.textContent = "Download WebP";
                    downloadLink.style.display = 'block';
                    
                    stats.style.display = 'block';
                    resetBtn.style.display = 'block';
                    resetBtn.textContent = "Convert Another";
                    
                    const initialSize = (totalInitialSize / 1024).toFixed(2);
                    const finalSize = (totalFinalSize / 1024).toFixed(2);
                    const saved = (((totalInitialSize - totalFinalSize) / totalInitialSize) * 100).toFixed(1);
                    
                    stats.innerHTML = `Original: ${initialSize}KB<br>Converted: ${finalSize}KB<br><strong>Saved: ${saved}%</strong>`;
                },
                error(err) {
                    console.error(err);
                    convertBtn.textContent = "Error! Try again.";
                    convertBtn.disabled = false;
                },
            });
            
        // BULK IMAGE COMPRESSION (ZIP)
        } else {
            convertBtn.textContent = "Converting...";
            if (!window.JSZip) {
                alert("ZIP library is not loaded yet. Please wait a second.");
                convertBtn.textContent = `Convert ${currentFiles.length} Files`;
                convertBtn.disabled = false;
                return;
            }

            const zip = new JSZip();
            
            const promises = currentFiles.map(file => {
                totalInitialSize += file.size;
                return new Promise((resolve) => {
                    new Compressor(file, {
                        quality: 0.8,
                        mimeType: 'image/webp',
                        success(result) {
                            totalFinalSize += result.size;
                            const baseName = file.name.replace(/\.[^/.]+$/, "");
                            zip.file(baseName + ".webp", result);
                            resolve();
                        },
                        error(err) {
                            console.error(`Error processing ${file.name}:`, err);
                            resolve(); 
                        }
                    });
                });
            });

            await Promise.all(promises);
            convertBtn.textContent = "Packaging ZIP...";

            zip.generateAsync({ type: "blob" }).then(function(content) {
                convertBtn.style.display = 'none';
                dropZone.style.display = 'none'; 
                
                const url = URL.createObjectURL(content);
                downloadLink.href = url;
                downloadLink.download = "Operon_Rupam_Das_WebP_Converter.zip";
                downloadLink.textContent = "Download ZIP Archive";
                downloadLink.style.display = 'block';
                
                stats.style.display = 'block';
                resetBtn.style.display = 'block';
                resetBtn.textContent = "Convert Another Batch";
                
                const initialSizeMB = (totalInitialSize / (1024 * 1024)).toFixed(2);
                const finalSizeMB = (totalFinalSize / (1024 * 1024)).toFixed(2);
                const saved = (((totalInitialSize - totalFinalSize) / totalInitialSize) * 100).toFixed(1);
                
                stats.innerHTML = `Original: ${initialSizeMB}MB<br>Converted: ${finalSizeMB}MB<br><strong>Saved: ${saved}%</strong>`;
            });
        }
    });
});
