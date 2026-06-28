document.addEventListener('DOMContentLoaded', () => {
    const upload = document.getElementById('upload');
    const convertBtn = document.getElementById('convert-btn');
    const downloadLink = document.getElementById('download-link');
    const stats = document.getElementById('stats');
    const dropZone = document.getElementById('drop-zone');
    const progressWrap = document.getElementById('progress-wrap');
    const progressBar = document.getElementById('progress-bar');
    
    // Updated Preview Elements (No more previewContainer)
    const dropText = document.getElementById('drop-text');
    const previewImage = document.getElementById('preview-image');

    let currentFile = null; 

    // ==========================================
    // 🧬 CENTRAL FILE PROCESSOR & PREVIEW GENERATOR
    // ==========================================
    function processInputFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please provide a valid image file.');
            return;
        }
        
        currentFile = file;
        convertBtn.disabled = false;
        
        // Hide the text and show the image inside the box!
        if (dropText) dropText.style.display = 'none';
        
        const previewUrl = URL.createObjectURL(file);
        previewImage.src = previewUrl;
        previewImage.style.display = 'block';
        
        // Reset the UI for a new conversion
        stats.style.display = 'none';
        downloadLink.style.display = 'none';
        progressWrap.style.display = 'none';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = '#ef4444'; 
        convertBtn.textContent = "Convert to WebP";
    }

    // ==========================================
    // 1. CLICK UPLOAD 
    // ==========================================
    upload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processInputFile(e.target.files[0]);
        }
    });

    // ==========================================
    // 2. DRAG & DROP METHOD
    // ==========================================
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

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
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            processInputFile(files[0]);
        }
    });

    // ==========================================
    // 3. PASTE METHOD (CTRL+V)
    // ==========================================
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
    // ⚙️ THE CONVERSION ENGINE
    // ==========================================
    convertBtn.addEventListener('click', () => {
        if (!currentFile) return;

        convertBtn.textContent = "Converting...";
        convertBtn.disabled = true;
        progressWrap.style.display = 'block';
        
        requestAnimationFrame(() => {
            progressBar.style.width = '40%';
            progressBar.style.backgroundColor = '#f59e0b'; 
        });

        setTimeout(() => {
            new Compressor(currentFile, {
                quality: 0.8,
                mimeType: 'image/webp',
                success(result) {
                    progressBar.style.width = '100%';
                    progressBar.style.backgroundColor = '#10b981'; 
                    
                    // Update the preview image with the compressed version
                    const resultUrl = URL.createObjectURL(result);
                    previewImage.src = resultUrl; 
                    
                    downloadLink.href = resultUrl;
                    downloadLink.download = currentFile.name.replace(/\.[^/.]+$/, "") + ".webp";
                    
                    downloadLink.style.display = 'block';
                    stats.style.display = 'block';
                    
                    const initialSize = (currentFile.size / 1024).toFixed(2);
                    const finalSize = (result.size / 1024).toFixed(2);
                    const saved = (((currentFile.size - result.size) / currentFile.size) * 100).toFixed(1);
                    
                    stats.innerHTML = `Original: ${initialSize}KB<br>Converted: ${finalSize}KB<br><strong>Saved: ${saved}%</strong>`;
                    
                    convertBtn.textContent = "Convert Another";
                    convertBtn.disabled = false;
                },
                error(err) {
                    console.error("Compression error:", err);
                    convertBtn.textContent = "Error! Try again.";
                    convertBtn.disabled = false;
                },
            });
        }, 150); 
    });
});
