document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');

    // UI Elements
    const buttons = document.querySelectorAll('.func-btn');
    const sliderX = document.getElementById('slider-x');
    const sliderY = document.getElementById('slider-y');
    const valX = document.getElementById('val-x');
    const valY = document.getElementById('val-y');
    const formulaDisplay = document.getElementById('formula-display');

    // State
    let currentType = 'exponential';
    let scaleX = 1.0;
    let scaleY = 1.0;

    // Resize Canvas to handle zoom and window resize without stretching
    function resizeCanvas() {
        // Look up the size the canvas is being displayed
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // If it's resolution does not match change it
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            draw();
        }
    }

    // Mathematical Functions
    const functions = {
        linear: (x) => x,
        quadratic: (x) => x * x,
        sine: (x) => Math.sin(x),
        exponential: (x) => Math.exp(x)
    };

    const formulas = {
        linear: "y = ax",
        quadratic: "y = ax²",
        sine: "y = a·sin(x)",
        exponential: "y = a·e^(bx)"
    };

    // Update Formula Text
    function updateFormula() {
        const sx = parseFloat(scaleX).toFixed(1);
        const sy = parseFloat(scaleY).toFixed(1);
        
        // Interpreting sliders as coefficients for visualization clarity
        // If Scale Y changes, it multiplies the function (Vertical Stretch)
        // If Scale X changes, it multiplies X inside the function (Horizontal Stretch/Squish)
        
        let html = "";
        
        if (currentType === 'linear') {
            html = `y = <span style="color:#4fd1c5">${sy}</span> · x`;
        } else if (currentType === 'quadratic') {
             html = `y = <span style="color:#4fd1c5">${sy}</span> · x²`;
        } else if (currentType === 'sine') {
             html = `y = <span style="color:#4fd1c5">${sy}</span> · sin(<span style="color:#4fd1c5">${sx}</span>x)`;
        } else if (currentType === 'exponential') {
             html = `y = <span style="color:#4fd1c5">${sy}</span> · e^(<span style="color:#4fd1c5">${sx}</span>x)`;
        }
        
        formulaDisplay.innerHTML = html;
    }

    // Drawing Logic
    function draw() {
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear background
        ctx.fillStyle = '#13141f';
        ctx.fillRect(0, 0, w, h);

        // Grid Settings
        const gridSize = 40; 
        const centerX = w / 2;
        const centerY = h / 2;

        ctx.lineWidth = 1;

        // Draw Grid Lines
        ctx.strokeStyle = '#2d2d3a'; // Faint grid color
        ctx.beginPath();
        
        // Vertical grid lines
        for (let x = centerX; x < w; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let x = centerX; x > 0; x -= gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        
        // Horizontal grid lines
        for (let y = centerY; y < h; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        for (let y = centerY; y > 0; y -= gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();

        // Draw Axes
        ctx.strokeStyle = '#718096'; // Brighter axis color
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY); // X Axis
        ctx.lineTo(w, centerY);
        ctx.moveTo(centerX, 0); // Y Axis
        ctx.lineTo(centerX, h);
        ctx.stroke();

        // Draw Axis Numbers
        ctx.fillStyle = '#a0aaec';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // X Axis numbers
        for (let x = centerX + gridSize, val = 1; x < w; x += gridSize, val++) {
            ctx.fillText(val, x, centerY + 5);
        }
        for (let x = centerX - gridSize, val = -1; x > 0; x -= gridSize, val--) {
            ctx.fillText(val, x, centerY + 5);
        }

        // Y Axis numbers
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = centerY - gridSize, val = 1; y > 0; y -= gridSize, val++) {
            ctx.fillText(val, centerX - 8, y);
        }
        for (let y = centerY + gridSize, val = -1; y < h; y += gridSize, val--) {
            ctx.fillText(val, centerX - 8, y);
        }

        // --- DRAW FUNCTION ---
        ctx.beginPath();
        ctx.strokeStyle = '#ed8936'; // Orange graph color
        ctx.lineWidth = 3;

        const pixelsPerUnit = gridSize;
        let started = false;

        // Iterate across the canvas width (pixel by pixel)
        for (let px = 0; px < w; px++) {
            // Convert pixel x to graph x unit
            // (px - centerX) gives distance from center in pixels
            // divide by pixelsPerUnit gives math units
            const graphX = (px - centerX) / pixelsPerUnit;

            // Apply Slider X (horizontal scaling effect)
            // If we want the graph to look "squished" (higher freq), we multiply x input
            // If sliderX is our "parameter", let's behave like the formula e^(ax)
            let val = 0;
            const inputX = graphX * scaleX; 

            switch(currentType) {
                case 'linear':
                    // y = a * x (using slider Y as 'a')
                    val = inputX * (scaleY / scaleX); // Adjust for linear to behave nicely
                    break;
                case 'quadratic':
                    // y = a * x^2
                    val = (graphX * graphX) * scaleY; 
                    // Quadratic usually doesn't need X-scale param logic in standard form y=ax^2, 
                    // but we can use slider X for horizontal shift if we wanted. 
                    // Keeping it simple: Slider Y is amplitude/stretch.
                    break;
                case 'sine':
                    // y = A * sin(B * x)
                    val = scaleY * Math.sin(graphX * scaleX);
                    break;
                case 'exponential':
                    // y = A * e^(B * x)
                    val = scaleY * Math.exp(graphX * 0.5); // 0.5 to keep it viewable
                    // Let's use slider X for vertical shift for exponential to match "a and b" logic? 
                    // Or keep consistent? Let's keep consistent: Slider Y = vertical scale.
                    // To make X visible, let's make slider X affect the exponent.
                    val = (scaleY * 0.5) * Math.exp(graphX * scaleX);
                    break;
            }

            // Convert math y to pixel y
            // -val because canvas Y goes down, math Y goes up
            const py = centerY - (val * pixelsPerUnit);

            if (!started) {
                ctx.moveTo(px, py);
                started = true;
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
    }

    // Event Listeners for Sliders
    sliderX.addEventListener('input', (e) => {
        scaleX = parseFloat(e.target.value);
        valX.textContent = scaleX;
        updateFormula();
        draw();
    });

    sliderY.addEventListener('input', (e) => {
        scaleY = parseFloat(e.target.value);
        valY.textContent = scaleY;
        updateFormula();
        draw();
    });

    // Event Listeners for Buttons
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Toggle
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Logic Toggle
            currentType = btn.getAttribute('data-type');
            updateFormula();
            draw();
        });
    });

    // Handle Window Resize
    window.addEventListener('resize', resizeCanvas);

    // Initial Draw
    resizeCanvas();
    updateFormula();
});