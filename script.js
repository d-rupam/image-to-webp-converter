// ==========================================
// 1. INJECT DEPENDENCIES & STYLES (WEBP CONVERTER)
// ==========================================
(function initEnvironment() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* Dynamic Dropzone Shrinking */
        #drop-zone { transition: padding 0.3s ease, min-height 0.3s ease; -webkit-tap-highlight-color: transparent; cursor: pointer; display: block; }
        #drop-zone.has-files { padding: 1.25rem 1rem 1.25rem 1rem !important; margin-bottom: 0 !important; cursor: default; }

        /* Grid Layout inside Dropzone */
        .a4-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; width: 100%; padding: 0; margin: 0; }
        
        /* Rigid Fixed-Height Cards */
        .a4-card { width: 110px; height: 160px; background-color: #121215; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px; position: relative; padding: 10px; text-align: center; display: block; transition: all 0.2s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.2); user-select: none; z-index: 5; }
        .a4-card:hover { border-color: rgba(0, 229, 255, 0.5); transform: translateY(-3px); box-shadow: 0 6px 15px rgba(0, 229, 255, 0.15); }
        
        /* Image Thumbnail styling */
        .a4-icon-wrapper { height: 90px; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden; border-radius: 4px; background: #050505; }
        .a4-icon-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .a4-icon { font-size: 2.5rem; color: #888; transition: color 0.2s; }
        
        .a4-name { font-size: 0.75rem; color: #e0e0e0; font-weight: 500; width: 100%; height: 38px; margin-top: 5px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.05); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; line-height: 1.3; word-break: break-word; }
        
        .a4-remove { position: absolute; top: -8px; right: -8px; background: #ff3366; color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 0.75rem; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.4); z-index: 10; transition: transform 0.2s;}
        .a4-remove:hover { transform: scale(1.1); }
        
        .a4-add { border: 2px dashed rgba(0, 229, 255, 0.3); background: rgba(0, 229, 255, 0.02); color: #00E5FF; cursor: pointer; box-shadow: none; display: flex; flex-direction: column; justify-content: center; }
        .a4-add:hover { border-color: #00E5FF; background: rgba(0, 229, 255, 0.05); transform: translateY(-3px); }
        .a4-add .a4-icon { color: #00E5FF; font-size: 2rem; margin-bottom: 5px; }
        .a4-add .a4-name { color: #00E5FF; font-weight: 600; border-top: none; height: auto; margin-top: 0; padding-top: 0; display: block; }

        /* Action Container & Buttons */
        .action-container { margin-top: 1.5rem !important; margin-bottom: 2rem; display: none; gap: 0.5rem; justify-content: center; flex-direction: column; align-items: center; }
        .button-group { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; width: 100%; }
        
        .btn-primary { background-color: #00E5FF; color: #000; border: none; padding: 0.85rem 2.5rem; font-size: 1.05rem; font-weight: 700; font-family: 'Courier New', Courier, monospace; border-radius: 6px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 15px rgba(0, 229, 255, 0.2); text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 5px 20px rgba(0, 229, 255, 0.4); }
        .btn-primary:disabled { background-color: #333; color: #888; cursor: not-allowed; transform: none; box-shadow: none; }
        
        .btn-secondary { background-color: transparent; color: #e0e0e0; border: 1px solid rgba(255,255,255,0.1); padding: 0.85rem 1.75rem; font-size: 0.95rem; font-weight: 600; border-radius: 6px; cursor: pointer; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .btn-secondary:hover { border-color: #00E5FF; color: #00E5FF; background-color: rgba(0, 229, 255, 0.05); }
        
        /* Success Stats UI */
        .success-message { width: 100%; text-align: center; color: #00E5FF; font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem; font-family: 'Courier New', Courier, monospace;}
        .stats-flow { color: #94A3B8; font-size: 0.9rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: rgba(0, 229, 255, 0.03); padding: 15px 20px; border-radius: 8px; border: 1px solid rgba(0, 229, 255, 0.2); text-align: center; width: 100%; max-width: 400px; }
        .stats-flow strong { color: #fff; }
    `;
    document.head.appendChild(style);
})();

// ==========================================
// WAIT FOR HTML DOM TO FULLY LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // 2. STATE MANAGEMENT & DOM SETUP
    let imageFiles = []; 

    const dropzone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('upload');
    const dropText = document.getElementById('drop-text');
    
    // Hide old HTML buttons to replace with our dynamic Action Container
    document.getElementById('convert-btn').style.display = 'none';
    document.getElementById('download-link').style.display = 'none';
    document.getElementById('stats').style.display = 'none';
    document.getElementById('reset-btn').style.display = 'none';
    if(document.getElementById('preview-image')) document.getElementById('preview-image').style.display = 'none';

    // Create the Grid Container inside the dropzone
    const a4Grid = document.createElement('div');
    a4Grid.className = 'a4-grid';
    a4Grid.style.display = 'none';
    dropzone.appendChild(a4Grid);

    // Create the Action Container outside the dropzone
    const actionContainer = document.createElement('div');
    actionContainer.className = 'action-container';
    dropzone.parentNode.insertBefore(actionContainer, dropzone.nextSibling);

    function initActionUI() {
        actionContainer.innerHTML = '';
        const btnGroup = document.createElement('div');
        btnGroup.className = 'button-group';
        
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn-primary';
        actionBtn.innerHTML = '⚙️ Convert to WebP';
        actionBtn.addEventListener('click', executeConversion);
        
        btnGroup.appendChild(actionBtn);
        actionContainer.appendChild(btnGroup);
    }

    // 3. EVENT LISTENERS
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            fileInput.value = ''; // Reset input so same file can be selected again
        }
    });

    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#00E5FF'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    window.addEventListener('paste', (e) => {
        if (e.clipboardData && e.clipboardData.files.length > 0) handleFiles(e.clipboardData.files);
    });

    // 4. FILE HANDLING & UI RENDERING
    function handleFiles(files) {
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (newFiles.length === 0) {
            alert('Invalid format. Please select valid images (JPG/PNG).');
            return;
        }
        imageFiles = [...imageFiles, ...newFiles];
        renderFileList();
    }

    function renderFileList() {
        a4Grid.innerHTML = '';
        
        if (imageFiles.length === 0) {
            dropzone.classList.remove('has-files');
            dropText.style.display = 'block';
            a4Grid.style.display = 'none';
            actionContainer.style.display = 'none';
            return;
        }
        
        dropzone.classList.add('has-files');
        dropText.style.display = 'none';
        a4Grid.style.display = 'flex';
        
        if(actionContainer.innerHTML === '') initActionUI();
        actionContainer.style.display = 'flex';
        const actionBtn = actionContainer.querySelector('.btn-primary');
        if(actionBtn) {
            actionBtn.innerHTML = `⚙️ Convert ${imageFiles.length} File${imageFiles.length > 1 ? 's' : ''}`;
        }

        imageFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'a4-card';
            
            // Create object URL for thumbnail
            const thumbUrl = URL.createObjectURL(file);

            item.innerHTML = `
                <button class="a4-remove" title="Remove File">✖</button>
                <div class="a4-icon-wrapper">
                    <img src="${thumbUrl}" alt="thumbnail">
                </div>
                <div class="a4-name" title="${file.name}">${file.name}</div>
            `;
            
            // Remove functionality. preventDefault stops the label from opening file dialog.
            const removeBtn = item.querySelector('.a4-remove');
            removeBtn.onclick = (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                imageFiles.splice(index, 1);
                renderFileList();
            };

            // Prevent clicks on the card from opening the file dialog
            item.onclick = (e) => { e.preventDefault(); e.stopPropagation(); };

            a4Grid.appendChild(item);
        });

        // Add More Button Card
        const addMoreCard = document.createElement('div');
        addMoreCard.className = 'a4-card a4-add';
        addMoreCard.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        };
        addMoreCard.innerHTML = `
            <div class="a4-icon-wrapper" style="background: transparent; height: auto;">
                <span class="a4-icon" style="color: #00E5FF;">+</span>
            </div>
            <div class="a4-name">Add More</div>
        `;
        a4Grid.appendChild(addMoreCard);
    }

    window.resetTool = function() {
        window.location.reload(); 
    };

    // 5. CLIENT-SIDE COMPRESSION & ZIPPING LOGIC
    async function executeConversion(e) {
        e.preventDefault();
        if (imageFiles.length === 0) return;

        const actionBtn = actionContainer.querySelector('.btn-primary');
        actionBtn.disabled = true;
        actionBtn.innerHTML = '⏳ Processing...';

        let totalInitialSize = 0;
        let totalFinalSize = 0;

        // SINGLE FILE PROCESSING (No ZIP needed)
        if (imageFiles.length === 1) {
            const file = imageFiles[0];
            totalInitialSize = file.size;

            new Compressor(file, {
                quality: 0.8,
                mimeType: 'image/webp',
                success(result) {
                    totalFinalSize = result.size;
                    const url = URL.createObjectURL(result);
                    const finalFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    renderSuccessUI(url, finalFileName, totalInitialSize, totalFinalSize);
                },
                error(err) {
                    console.error(err);
                    alert("Error compressing file.");
                    actionBtn.disabled = false;
                    actionBtn.innerHTML = '⚙️ Try Again';
                }
            });
        
        // BULK FILE PROCESSING (JSZip)
        } else {
            if (!window.JSZip) {
                alert("JSZip library is loading. Please wait a moment.");
                actionBtn.disabled = false;
                actionBtn.innerHTML = `⚙️ Convert ${imageFiles.length} Files`;
                return;
            }

            const zip = new JSZip();
            const conversionPromises = imageFiles.map(file => {
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
                            console.error(`Skipping ${file.name}:`, err);
                            resolve(); 
                        }
                    });
                });
            });

            await Promise.all(conversionPromises);
            actionBtn.innerHTML = '📦 Packaging ZIP...';

            zip.generateAsync({ type: "blob" }).then(function(content) {
                const url = URL.createObjectURL(content);
                const finalFileName = "Operon_Rupam_Das_WebP_Converter.zip";
                renderSuccessUI(url, finalFileName, totalInitialSize, totalFinalSize);
            });
        }
    }

    function renderSuccessUI(downloadUrl, fileName, initialSize, finalSize) {
        dropzone.style.display = 'none'; // Hide the grid box
        
        const initialSizeMB = (initialSize / (1024 * 1024)).toFixed(2);
        const finalSizeMB = (finalSize / (1024 * 1024)).toFixed(2);
        const savedPercent = initialSize > 0 ? (((initialSize - finalSize) / initialSize) * 100).toFixed(1) : 0;
        
        actionContainer.innerHTML = `
            <div class="success-message">
                ✔ Optimization Complete
            </div>
            <div class="stats-flow">
                <div>Original Size: <strong>${initialSizeMB} MB</strong></div>
                <div>WebP Size: <strong>${finalSizeMB} MB</strong></div>
                <div style="margin-top: 5px; color: #00E5FF;">Bandwidth Saved: <strong>${savedPercent}%</strong></div>
            </div>
            <div class="button-group">
                <a href="${downloadUrl}" download="${fileName}" class="btn-primary">
                    💾 Download ${imageFiles.length > 1 ? 'ZIP Archive' : 'WebP'}
                </a>
                <button class="btn-secondary" onclick="resetTool()">
                    🔄 Convert More
                </button>
            </div>
        `;
    }
});
