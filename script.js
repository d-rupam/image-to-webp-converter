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

    function resetUI() {
        currentFile = null;
        upload.value = ''; 
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
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
    }

    function processInputFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        resetUI(); 
        currentFile = file;
        convertBtn.disabled = false;
        dropText.style.display = 'none';
        previewImage.src = URL.createObjectURL(file);
        previewImage.style.display = 'block';
    }

    resetBtn.addEventListener('click', resetUI);

    // INPUT LISTENERS
    upload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processInputFile(e.target.files[0]);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files.length > 0) processInputFile(e.dataTransfer.files[0]);
    });

    window.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
                processInputFile(items[i].getAsFile());
                break;
            }
        }
    });

    // CONVERSION ENGINE (Restored to working status)
    convertBtn.addEventListener('click', () => {
        if (!currentFile) return;

        convertBtn.textContent = "Converting...";
        convertBtn.disabled = true;
        progressWrap.style.display = 'block';
        progressBar.style.transition = 'width 1.5s linear';
        progressBar.style.width = '100%';

        new Compressor(currentFile, {
            quality: 0.8,
            mimeType: 'image/webp',
            success(result) {
                setTimeout(() => {
                    progressWrap.style.display = 'none';
                    convertBtn.style.display = 'none';
                    const url = URL.createObjectURL(result);
                    previewImage.src = url; 
                    downloadLink.href = url;
                    downloadLink.download = currentFile.name.replace(/\.[^/.]+$/, "") + ".webp";
                    downloadLink.style.display = 'block';
                    stats.style.display = 'block';
                    resetBtn.style.display = 'block';
                    stats.innerHTML = `Original: ${(currentFile.size/1024).toFixed(2)}KB<br>Converted: ${(result.size/1024).toFixed(2)}KB<br><strong>Saved: ${(((currentFile.size - result.size)/currentFile.size)*100).toFixed(1)}%</strong>`;
                }, 1500); // Matches transition duration
            },
            error(err) {
                console.error(err);
                convertBtn.textContent = "Error! Try again.";
                convertBtn.disabled = false;
            },
        });
    });
});
