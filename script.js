document.addEventListener('DOMContentLoaded', () => {
    const upload = document.getElementById('upload');
    const convertBtn = document.getElementById('convert-btn');
    const downloadLink = document.getElementById('download-link');
    const stats = document.getElementById('stats');
    const dropZone = document.getElementById('drop-zone');
    const resetBtn = document.getElementById('reset-btn');
    const dropText = document.getElementById('drop-text');
    const previewImage = document.getElementById('preview-image');

    let currentFiles = [];

    // Reset UI to default state
    function resetUI() {
        currentFiles = [];
        upload.value = '';
        dropText.style.display = 'block';
        dropText.innerHTML = 'Click, Drag, or Paste (CTRL+V) image(s) here';
        previewImage.style.display = 'none';
        previewImage.src = '';
        convertBtn.style.display = 'block';
        convertBtn.textContent = "Convert to WebP";
        convertBtn.disabled = true;
        downloadLink.style.display = 'none';
        stats.style.display = 'none';
        resetBtn.style.display = 'none';
    }

    // Process single or multiple files
    function processInputFiles(files) {
        const validFiles = Array.from(files).filter(file => file && file.type.startsWith('image/'));
        if (validFiles.length === 0) return;
        
        currentFiles = validFiles;
        convertBtn.disabled = false;
        
        if (currentFiles.length === 1) {
            dropText.style.display = 'none';
            previewImage.src = URL.createObjectURL(currentFiles[0]);
            previewImage.style.display = 'block';
        } else {
            dropText.style.display = 'block';
            dropText.innerHTML = `<strong style="color: #00E5FF; font-size: 1.2rem;">${currentFiles.length} images</strong> queued for bulk conversion.`;
            previewImage.style.display = 'none';
        }
    }

    resetBtn.addEventListener('click', resetUI);

    // Event Listeners for File Input
    upload.addEventListener('change', (e) => {
        processInputFiles(e.target.files);
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        processInputFiles(e.dataTransfer.files);
    });

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

    // Conversion Execution (Single & Bulk)
    convertBtn.addEventListener('click', async () => {
        if (currentFiles.length === 0) return;
        
        convertBtn.disabled = true;
        let totalInitialSize = 0;
        let totalFinalSize = 0;

        // SINGLE FILE PROCESSING
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
                    
                    const url = URL.createObjectURL(result);
                    previewImage.src = url;
                    downloadLink.href = url;
                    downloadLink.download = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    downloadLink.textContent = "Download WebP";
                    downloadLink.style.display = 'block';
                    
                    stats.style.display = 'block';
                    resetBtn.style.display = 'block';
                    
                    const initialSize = (totalInitialSize / 1024).toFixed(2);
                    const finalSize = (totalFinalSize / 1024).toFixed(2);
                    const saved = (((totalInitialSize - totalFinalSize) / totalInitialSize) * 100).toFixed(1);
                    stats.innerHTML = `Original: ${initialSize}KB<br>Converted: ${finalSize}KB<br><strong>Saved: ${saved}%</strong>`;
                },
                error(err) {
                    console.error(err);
                    convertBtn.textContent = "Error! Try again.";
                    convertBtn.disabled = false;
                }
            });

        // BULK FILE PROCESSING (JSZip)
        } else {
            convertBtn.textContent = `Converting ${currentFiles.length} files...`;
            const zip = new JSZip();

            const conversionPromises = currentFiles.map(file => {
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
                            console.error(`Skipping corrupted file ${file.name}:`, err);
                            resolve(); // Continue processing the rest of the batch
                        }
                    });
                });
            });

            await Promise.all(conversionPromises);
            convertBtn.textContent = "Packaging ZIP...";

            zip.generateAsync({ type: "blob" }).then(function(content) {
                convertBtn.style.display = 'none';
                
                const url = URL.createObjectURL(content);
                downloadLink.href = url;
                downloadLink.download = "Operon_Rupam_Das_WebP_Converter.zip";
                downloadLink.textContent = "Download ZIP Archive";
                downloadLink.style.display = 'block';
                
                stats.style.display = 'block';
                resetBtn.style.display = 'block';
                
                const initialSizeMB = (totalInitialSize / (1024 * 1024)).toFixed(2);
                const finalSizeMB = (totalFinalSize / (1024 * 1024)).toFixed(2);
                const saved = (((totalInitialSize - totalFinalSize) / totalInitialSize) * 100).toFixed(1);
                
                stats.innerHTML = `Original Batch: ${initialSizeMB}MB<br>Converted Batch: ${finalSizeMB}MB<br><strong>Bandwidth Saved: ${saved}%</strong>`;
            });
        }
    });
});
