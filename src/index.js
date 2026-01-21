import { FighterDebugRenderer } from "./imageMapper.js";
import { FighterState, FighterDirection } from "./fighter.js";
import { animationSelected, framesSelected, imageSelected } from "../InsertFrameHere.js";

/* ==================== UTIL ==================== */
const snap = v => Math.round(Number(v) || 0);
const HANDLE_SIZE = 6;

/* ==================== CANVAS ==================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const camera = { position: { x: 0, y: 0 } };

let fighter;
let isPlaying = true;

/* ==================== STATE ==================== */
const boxVisibility = {
    push: true,
    hit: true,
    hurtHead: true,
    hurtBody: true,
    hurtFeet: true,
};

const boxLocked = {
    push: false,
    hit: false,
    hurtHead: false,
    hurtBody: false,
    hurtFeet: false,
};

let draggingBox = null;
let resizing = null;
let dragOffset = { x: 0, y: 0 };

/* ==================== INPUTS ==================== */
const el = id => document.getElementById(id);

const frameKeyInput = el('frameKey');
const pushXInput = el('pushX');
const pushYInput = el('pushY');
const pushWInput = el('pushW');
const pushHInput = el('pushH');

const hitXInput = el('hitX');
const hitYInput = el('hitY');
const hitWInput = el('hitW');
const hitHInput = el('hitH');

const hurtXInput = el('hurtX');
const hurtYInput = el('hurtY');
const hurtWInput = el('hurtW');
const hurtHInput = el('hurtH');

const hurtBodyXInput = el('hurtBodyX');
const hurtBodyYInput = el('hurtBodyY');
const hurtBodyWInput = el('hurtBodyW');
const hurtBodyHInput = el('hurtBodyH');

const hurtFeetXInput = el('hurtFeetX');
const hurtFeetYInput = el('hurtFeetY');
const hurtFeetWInput = el('hurtFeetW');
const hurtFeetHInput = el('hurtFeetH');

const updateBtn = el('updateFrame');
const nextFrameBtn = el('nextFrameBtn');
const saveFramesBtn = el('saveFramesBtn');
const currentFrameDisplay = el('currentFrameDisplay');

/* ==================== PLAY CONTROLS ==================== */
const controls = document.getElementById('debug-controls');
['Play','Pause','Stop'].forEach(name => {
    const b = document.createElement('button');
    b.textContent = name;
    controls.appendChild(b);
    if (name === 'Play') b.onclick = () => isPlaying = true;
    if (name === 'Pause') b.onclick = () => isPlaying = false;
    if (name === 'Stop') b.onclick = () => {
        isPlaying = false;
        fighter.animationFrame = 0;
        updateInputsFromFrame(0);
    };
});

/* ==================== VISIBILITY PANEL ==================== */
const panel = document.createElement('div');
panel.innerHTML = `
<h4>Box Visibility / Lock</h4>
${Object.keys(boxVisibility).map(b => `
<label><input type="checkbox" data-vis="${b}" checked> 👁 ${b}</label>
<label><input type="checkbox" data-lock="${b}"> 🔒</label><br>
`).join('')}
`;
controls.appendChild(panel);

panel.querySelectorAll('[data-vis]').forEach(cb =>
    cb.onchange = e => boxVisibility[e.target.dataset.vis] = e.target.checked
);
panel.querySelectorAll('[data-lock]').forEach(cb =>
    cb.onchange = e => boxLocked[e.target.dataset.lock] = e.target.checked
);

/* ==================== INIT ==================== */
const image = imageSelected;
if (!image) throw new Error("Image not found");
image.onload = () => initFighter(image);
if (image.complete) initFighter(image);

function initFighter(img) {
    fighter = new FighterDebugRenderer({
        image: img,
        frames: framesSelected,
        animations: animationSelected,
        position: { x: canvas.width / 2, y: 220 },
        direction: FighterDirection.RIGHT,
        state: FighterState.IDLE
    });
    updateInputsFromFrame(0);
    animate();
}

/* ==================== SAVE & NEXT ==================== */
saveFramesBtn.addEventListener('click', () => {
    const anim = fighter.animations[fighter.currentState];
    const lines = anim.map(([key]) => {
        const frame = fighter.frames.get(key);
        return frame ? `['${key}', ${JSON.stringify(frame)}],` : '';
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'frames.txt';
    a.click();
    URL.revokeObjectURL(a.href);
});

nextFrameBtn.addEventListener('click', () => {
    const anim = fighter.animations[fighter.currentState];
    fighter.animationFrame = (fighter.animationFrame + 1) % anim.length;
    updateInputsFromFrame(fighter.animationFrame);
});

/* ==================== FRAME UPDATE ==================== */
function updateInputsFromFrame(i) {
    const anim = fighter.animations[fighter.currentState];
    const key = anim[i][0];
    const f = fighter.frames.get(key);
    if (!f) return;

    frameKeyInput.value = key;

    [pushXInput.value, pushYInput.value, pushWInput.value, pushHInput.value] = f[1];
    [hitXInput.value, hitYInput.value, hitWInput.value, hitHInput.value] = f[3];
    [hurtXInput.value, hurtYInput.value, hurtWInput.value, hurtHInput.value] = f[2][0];
    [hurtBodyXInput.value, hurtBodyYInput.value, hurtBodyWInput.value, hurtBodyHInput.value] = f[2][1];
    [hurtFeetXInput.value, hurtFeetYInput.value, hurtFeetWInput.value, hurtFeetHInput.value] = f[2][2];

    currentFrameDisplay.textContent = `Frame: ${key} (${i+1}/${anim.length})`;
}

/* ==================== INPUT SYNC ==================== */
[
    pushXInput,pushYInput,pushWInput,pushHInput,
    hitXInput,hitYInput,hitWInput,hitHInput,
    hurtXInput,hurtYInput,hurtWInput,hurtHInput,
    hurtBodyXInput,hurtBodyYInput,hurtBodyWInput,hurtBodyHInput,
    hurtFeetXInput,hurtFeetYInput,hurtFeetWInput,hurtFeetHInput
].forEach(i => i.oninput = () => {
    const f = fighter.frames.get(frameKeyInput.value);
    if (!f) return;

    f[1] = [snap(pushXInput.value),snap(pushYInput.value),snap(pushWInput.value),snap(pushHInput.value)];
    f[3] = [snap(hitXInput.value),snap(hitYInput.value),snap(hitWInput.value),snap(hitHInput.value)];
    f[2][0] = [snap(hurtXInput.value),snap(hurtYInput.value),snap(hurtWInput.value),snap(hurtHInput.value)];
    f[2][1] = [snap(hurtBodyXInput.value),snap(hurtBodyYInput.value),snap(hurtBodyWInput.value),snap(hurtBodyHInput.value)];
    f[2][2] = [snap(hurtFeetXInput.value),snap(hurtFeetYInput.value),snap(hurtFeetWInput.value),snap(hurtFeetHInput.value)];
});

/* ==================== RESIZE HANDLE ==================== */
function getHandle(mx,my,x,y,w,h){
    const pts = { nw:[x,y], ne:[x+w,y], sw:[x,y+h], se:[x+w,y+h] };
    for (const k in pts){
        const [hx,hy]=pts[k];
        if(mx>=hx-HANDLE_SIZE && mx<=hx+HANDLE_SIZE && my>=hy-HANDLE_SIZE && my<=hy+HANDLE_SIZE)
            return k;
    }
    return null;
}

/* ==================== MOUSE ==================== */
canvas.onmousedown = e => {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const mx = snap((e.clientX - r.left) * sx);
    const my = snap((e.clientY - r.top) * sy);

    const f = fighter.frames.get(frameKeyInput.value);
    if (!f) return;

    const boxes = {
        push: f[1],
        hit: f[3],
        hurtHead: f[2][0],
        hurtBody: f[2][1],
        hurtFeet: f[2][2],
    };

    for (const k in boxes){
        if (!boxVisibility[k] || boxLocked[k]) continue;
        const [x,y,w,h] = boxes[k];
        const bx = fighter.position.x + x;
        const by = fighter.position.y + y;

        const hnd = getHandle(mx,my,bx,by,w,h);
        if (hnd) return resizing={box:k,corner:hnd};

        if (mx>=bx && mx<=bx+w && my>=by && my<=by+h){
            draggingBox=k;
            dragOffset={x:mx-bx,y:my-by};
            return;
        }
    }
};

canvas.onmousemove = e => {
    if (!draggingBox && !resizing) return;

    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const mx = snap((e.clientX - r.left) * sx);
    const my = snap((e.clientY - r.top) * sy);

    const f = fighter.frames.get(frameKeyInput.value);
    const map = {
        push: f[1], hit: f[3],
        hurtHead: f[2][0], hurtBody: f[2][1], hurtFeet: f[2][2]
    };

    if (resizing){
        const b = map[resizing.box];
        let [x,y,w,h] = b;
        const bx = fighter.position.x + x;
        const by = fighter.position.y + y;

        if (resizing.corner.includes('e')) w = snap(mx - bx);
        if (resizing.corner.includes('s')) h = snap(my - by);
        if (resizing.corner.includes('w')) { w += bx - mx; x = snap(mx - fighter.position.x); }
        if (resizing.corner.includes('n')) { h += by - my; y = snap(my - fighter.position.y); }

        b[0]=x; b[1]=y; b[2]=Math.max(1,w); b[3]=Math.max(1,h);
        updateInputsFromFrame(fighter.animationFrame);
    }

    if (draggingBox){
        const b = map[draggingBox];
        b[0]=snap(mx-fighter.position.x-dragOffset.x);
        b[1]=snap(my-fighter.position.y-dragOffset.y);
        updateInputsFromFrame(fighter.animationFrame);
    }
};

canvas.onmouseup = canvas.onmouseleave = () => {
    draggingBox=null;
    resizing=null;
};

/* ==================== DRAW ==================== */
function drawHandle(x,y){
    ctx.fillStyle='white';
    ctx.fillRect(x-HANDLE_SIZE/2,y-HANDLE_SIZE/2,HANDLE_SIZE,HANDLE_SIZE);
}

function drawBoxes(frame) {
    if (!frame) return;
    const boxes = { push: frame[1], hit: frame[3], hurtHead: frame[2][0], hurtBody: frame[2][1], hurtFeet: frame[2][2] };
    for (const [name, box] of Object.entries(boxes)) {

        if (!boxVisibility[name]) continue;

        const [x, y, w, h] = box;
        const px = fighter.position.x + x;
        const py = fighter.position.y + y;

        const isActive = draggingBox === name || resizing?.box === name;

        ctx.strokeStyle = isActive ? 'yellow' :
            name === 'push' ? 'green' : name === 'hit' ? 'red' : 'blue';
        ctx.lineWidth = isActive ? 3 : 1;
        ctx.strokeRect(px, py, w, h);

        if (!boxLocked[name]) {
            drawHandle(px, py);
            drawHandle(px + w, py);
            drawHandle(px, py + h);
            drawHandle(px + w, py + h);
        } else {
            ctx.fillStyle = 'white';
            ctx.fillText('🔒', px + w - 10, py - 2);
        }

        if (boxVisibility[name]) { // show name only if visible
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(name, px, py - 2);
        }
    }
}

function drawText(){
     ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText("Animation Box Mapper by Robert Andrei Bardoquillo (2026)", canvas.width/12, 30);
}

/* ==================== LOOP ==================== */
function animate(t){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const anim = fighter.animations[fighter.currentState];
    const frame = fighter.frames.get(anim[fighter.animationFrame][0]);

    if (isPlaying){
        if (!fighter.lastFrameTime) fighter.lastFrameTime=t;
        if (t-fighter.lastFrameTime>=anim[fighter.animationFrame][1]){
            fighter.animationFrame=(fighter.animationFrame+1)%anim.length;
            fighter.lastFrameTime=t;
        }
    }

    fighter.draw(ctx,camera);
    drawBoxes(frame);
    updateInputsFromFrame(fighter.animationFrame);
    drawText();
    requestAnimationFrame(animate);
}
