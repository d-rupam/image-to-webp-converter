document.addEventListener('DOMContentLoaded', () => {
    const upload = document.getElementById('upload');
    const convertBtn = document.getElementById('convert-btn');
    const downloadLink = document.getElementById('download-link');
    const stats = document.getElementById('stats');
    const dropZone = document.getElementById('drop-zone');
    const progressWrap = document.getElementById('progress-wrap');
    const progressBar = document.getElementById('progress-bar');
    const resetBtn = document.getElementById('reset-btn');
    const dropText = document.getElementById('drop-text');
    const previewImage = document.getElementById('preview-image');

    let currentFile = null; 

    // ==========================================
    // 🧬 STATE 1: RESET / LOAD FILE
    // ==========================================
    function resetUI() {
        currentFile = null;
        upload.value = ''; // Clear file input
        dropText.style.display = 'block';
        previewImage.style.display = 'none';
        previewImage.src = '';
        
        convertBtn.style.display = 'block';
        convertBtn.textContent = "Convert to WebP";
        convertBtn.disabled = true;
        
        downloadLink.style.display = 'none';
        stats.style.display = 'none';
        resetBtn.style.display = 'none';
        progressWrap.style.display = 'none';
        progressBar.style.width = '0%';
    }

    function processInputFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please provide a valid image file.');
            return;
        }
        
        // Reset the UI states before loading new file
        resetUI(); 
        
        currentFile = file;
        convertBtn.disabled = false;
        
        dropText.style.display = 'none';
        const previewUrl = URL.createObjectURL(file);
        previewImage.src = previewUrl;
        previewImage.style.display = 'block';
    }

    // Event Listener for the new "Convert Another" button
    resetBtn.addEventListener('click', resetUI);

    // ==========================================
    // INPUT LISTENERS (Click, Drag, Paste)
    // ==========================================
    upload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processInputFile(e.target.files[0]);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        document.body.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = 'var(--primary)'; 
            dropZone.style.color = 'var(--primary)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.borderColor = '#475569'; 
            dropZone.style.color = '#94a3b8';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files.length > 0) processInputFile(e.dataTransfer.files[0]);
    });

    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const blob = item.getAsFile();
                const file = new File([blob], "clipboard-capture-" + Date.now() + ".png", { type: item.type });
                processInputFile(file);
                break; 
            }
        }
    });

    // ==========================================
    // ⚙️ STATE 2 & 3: CONVERSION ENGINE
    // ==========================================
    convertBtn.addEventListener('click', () => {
        if (!currentFile) return;

        // Enter State 2: Processing
        convertBtn.textContent = "Converting...";
        convertBtn.disabled = true;
        progressWrap.style.display = 'block';
        
        // Start smooth fake progress up to 90%
        requestAnimationFrame(() => {
            progressBar.style.width = '90%';
        });

        setTimeout(() => {
            new Compressor(currentFile, {
                quality: 0.8,
                mimeType: 'image/webp',
                success(result) {
                    // Push progress to 100%
                    progressBar.style.width = '100%';
                    
                    // Wait a tiny fraction of a second for the bar to hit 100% smoothly
                    setTimeout(() => {
                        // Enter State 3: Done
                        progressWrap.style.display = 'none'; // Hide progress bar
                        convertBtn.style.display = 'none';   // Hide convert button
                        
                        const resultUrl = URL.createObjectURL(result);
                        previewImage.src = resultUrl; 
                        
                        downloadLink.href = resultUrl;
                        downloadLink.download = currentFile.name.replace(/\.[^/.]+$/, "") + ".webp";
                        
                        // Show Final UI Elements
                        downloadLink.style.display = 'block';
                        stats.style.display = 'block';
                        resetBtn.style.display = 'block';
                        
                        const initialSize = (currentFile.size / 1024).toFixed(2);
                        const finalSize = (result.size / 1024).toFixed(2);
                        const saved = (((currentFile.size - result.size) / currentFile.size) * 100).toFixed(1);
                        
                        stats.innerHTML = `Original: ${initialSize}KB<br>Converted: ${finalSize}KB<br><strong style="color: var(--success);">Saved: ${saved}%</strong>`;
                    }, 300);
                },
                error(err) {
                    console.error("Compression error:", err);
                    convertBtn.textContent = "Error! Try again.";
                    convertBtn.disabled = false;
                    progressWrap.style.display = 'none';
                },
            });
        }, 150); 
    });
});
