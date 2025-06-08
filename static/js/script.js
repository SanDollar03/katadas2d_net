const grid = document.getElementById('grid');
const select = document.getElementById('productSelect');
const issueSelect = document.getElementById('issueSelect');
const saveBtn = document.getElementById('saveButton');
const crossX = document.getElementById('crosshair-x');
const crossY = document.getElementById('crosshair-y');
const currentPathDisplay = document.getElementById('currentPath');

const rows = 180, cols = 320;
const activeCells = new Set();
let hasUnsavedChanges = false;

const canvas = document.createElement('canvas');
canvas.width = cols;
canvas.height = rows;
const ctx = canvas.getContext('2d');
let bgImage = new Image();

fetch('/get_products')
    .then(res => res.json())
    .then(products => {
        select.innerHTML = products.map(p => `<option value="${p}">${p}</option>`).join('');
        updateBackground();
    });

fetch('/get_issues')
    .then(res => res.json())
    .then(issues => {
        issueSelect.innerHTML = issues.map(i => `<option value="${i}">${i}</option>`).join('');
    });

function updateBackground() {
    const imagePath = `/images/${select.value}.jpg`;
    grid.style.backgroundImage = `url('${imagePath}')`;
    bgImage.src = imagePath;
    bgImage.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    };
}

function getColorForPixel(x, y) {
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    return brightness > 128 ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,0,0.5)';
}

select.addEventListener('change', () => {
    if (hasUnsavedChanges && confirm("変更があります。保存しますか？")) {
        saveGrid(() => {
            clearGrid();
            updateBackground();
        });
    } else {
        clearGrid();
        updateBackground();
    }
});

function clearGrid() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('active');
        cell.style.backgroundColor = '';
    });
    activeCells.clear();
    hasUnsavedChanges = false;
}

for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.x = x;
        cell.dataset.y = y;

        cell.addEventListener('click', () => {
            const key = `${x},${y}`;
            if (cell.classList.contains('active')) {
                cell.classList.remove('active');
                cell.style.backgroundColor = '';
                activeCells.delete(key);
            } else {
                const color = getColorForPixel(x, y);
                cell.classList.add('active');
                cell.style.backgroundColor = color;
                activeCells.add(key);
            }
            hasUnsavedChanges = true;
        });

        grid.appendChild(cell);
    }
}

function saveGrid(callback) {
    const now = new Date();
    const timestamp = now.getFullYear().toString()
        + String(now.getMonth() + 1).padStart(2, '0')
        + String(now.getDate()).padStart(2, '0')
        + String(now.getHours()).padStart(2, '0')
        + String(now.getMinutes()).padStart(2, '0')
        + String(now.getSeconds()).padStart(2, '0');

    const product = select.value;
    const issue = issueSelect.value;
    const csv = ["日時,プロダクト名,問題,X座標,Y座標"];
    activeCells.forEach(key => {
        const [x, y] = key.split(',');
        csv.push(`${timestamp},${product},${issue},${x},${y}`);
    });

    fetch(`/save_csv?timestamp=${timestamp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: csv.join('\n')
    }).then(res => {
        if (res.ok) {
            alert("CSV保存完了");
            clearGrid();
            hasUnsavedChanges = false;
            if (callback) callback();
        } else {
            alert("保存に失敗しました。");
        }
    }).catch(err => {
        console.error("通信エラー:", err);
        alert("通信エラー：CSV保存に失敗しました。");
    });
}

saveBtn.addEventListener('click', () => saveGrid());

function updateSavePathDisplay() {
    fetch('/get_save_path')
        .then(res => res.json())
        .then(data => {
            currentPathDisplay.textContent = `保存先: ${data.path}`;
        });
}
updateSavePathDisplay();

document.addEventListener('mousemove', e => {
    const rect = grid.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (inside) {
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        crossX.style.display = 'block';
        crossY.style.display = 'block';
        requestAnimationFrame(() => {
            crossX.style.transform = `translateY(${relY}px)`;
            crossY.style.transform = `translateX(${relX}px)`;
        });
    } else {
        crossX.style.display = 'none';
        crossY.style.display = 'none';
    }
});