import { FighterDebugRenderer } from "./imageMapper.js";
import { FighterState, HurtBox, PushBox } from "./fighter.js";
import { FighterDirection } from "./fighter.js";
import { animationSelected, animationSelected2, framesSelected, framesSelected2, imageSelected } from "../InsertFrameHere.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const camera = { position: { x: 0, y: 0 } };
let fighter;
let isPlaying = true; // Animation state


const frameKeyInput = document.getElementById('frameKey');
const pushXInput = document.getElementById('pushX');
const pushYInput = document.getElementById('pushY');
const pushWInput = document.getElementById('pushW');
const pushHInput = document.getElementById('pushH');

const hitXInput = document.getElementById('hitX');
const hitYInput = document.getElementById('hitY');
const hitWInput = document.getElementById('hitW');
const hitHInput = document.getElementById('hitH');

const hurtXInput = document.getElementById('hurtX');
const hurtYInput = document.getElementById('hurtY');
const hurtWInput = document.getElementById('hurtW');
const hurtHInput = document.getElementById('hurtH');

const hurtBodyXInput = document.getElementById('hurtBodyX');
const hurtBodyYInput = document.getElementById('hurtBodyY');
const hurtBodyWInput = document.getElementById('hurtBodyW');
const hurtBodyHInput = document.getElementById('hurtBodyH');

const hurtFeetXInput = document.getElementById('hurtFeetX');
const hurtFeetYInput = document.getElementById('hurtFeetY');
const hurtFeetWInput = document.getElementById('hurtFeetW');
const hurtFeetHInput = document.getElementById('hurtFeetH');

const nextFrameBtn = document.getElementById('nextFrameBtn');

const updateBtn = document.getElementById('updateFrame');
const currentFrameDisplay = document.createElement('div');
currentFrameDisplay.style.margin = "10px 0";
document.getElementById('debug-controls').appendChild(currentFrameDisplay);

const saveFramesBtn = document.getElementById('saveFramesBtn');

saveFramesBtn.addEventListener('click', () => {
    const anim = fighter.animations[fighter.currentState];

    const lines = anim.map(([key]) => {
        const frame = fighter.frames.get(key);
        if (!frame) return '';
        return `['${key}', ${JSON.stringify(frame)}],`;
    });

    const text = lines.join('\n');

   
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'frames.txt';
    a.click();
    URL.revokeObjectURL(url);
});


const playBtn = document.createElement('button');
playBtn.textContent = "Play";
const pauseBtn = document.createElement('button');
pauseBtn.textContent = "Pause";
const stopBtn = document.createElement('button');
stopBtn.textContent = "Stop";

document.getElementById('debug-controls').appendChild(playBtn);
document.getElementById('debug-controls').appendChild(pauseBtn);
document.getElementById('debug-controls').appendChild(stopBtn);

playBtn.addEventListener('click', () => isPlaying = true);
pauseBtn.addEventListener('click', () => isPlaying = false);
stopBtn.addEventListener('click', () => {
    isPlaying = false;
    fighter.animationFrame = 0;
    fighter.lastFrameTime = null;
});


const image = imageSelected;
if (!image) throw new Error("Golem image not found");

image.onload = () => initFighter(image);
if (image.complete) initFighter(image);


function initFighter(img) {
    const frames = framesSelected2;

    const animations = animationSelected2;

    fighter = new FighterDebugRenderer({
        image: img,
        frames,
        animations,
        position: { x: canvas.width/2, y: 220 },
        direction: FighterDirection.RIGHT,
        state: FighterState.IDLE
    });

    updateInputsFromFrame(fighter.animationFrame);

    animate();
}


function updateInputsFromFrame(frameIndex) {
    const anim = fighter.animations[fighter.currentState];
    const frameKey = anim[frameIndex][0];
    frameKeyInput.value = frameKey;

    const frame = fighter.frames.get(frameKey);
    if (!frame) return;

    // Push box
    [pushXInput.value, pushYInput.value, pushWInput.value, pushHInput.value] = frame[1];

    // Hit box
    [hitXInput.value, hitYInput.value, hitWInput.value, hitHInput.value] = frame[3];

    // Hurt boxes
    [hurtXInput.value, hurtYInput.value, hurtWInput.value, hurtHInput.value] = frame[2][0]; // head
    [hurtBodyXInput.value, hurtBodyYInput.value, hurtBodyWInput.value, hurtBodyHInput.value] = frame[2][1]; // body
    [hurtFeetXInput.value, hurtFeetYInput.value, hurtFeetWInput.value, hurtFeetHInput.value] = frame[2][2]; // feet

    // Show current frame
    currentFrameDisplay.textContent = `Current Frame: ${frameKey} (${frameIndex + 1}/${anim.length})`;
}


updateBtn.addEventListener('click', () => {
    const key = frameKeyInput.value;
    const frame = fighter.frames.get(key);
    if (!frame) return alert('Frame not found');

    // Push box
    frame[1] = [
        parseInt(pushXInput.value) || 0,
        parseInt(pushYInput.value) || 0,
        parseInt(pushWInput.value) || 0,
        parseInt(pushHInput.value) || 0
    ];

    // Hit box
    frame[3] = [
        parseInt(hitXInput.value) || 0,
        parseInt(hitYInput.value) || 0,
        parseInt(hitWInput.value) || 0,
        parseInt(hitHInput.value) || 0
    ];

    // Hurt boxes
    frame[2][0] = [
        parseInt(hurtXInput.value) || 0,
        parseInt(hurtYInput.value) || 0,
        parseInt(hurtWInput.value) || 0,
        parseInt(hurtHInput.value) || 0
    ];
    frame[2][1] = [
        parseInt(hurtBodyXInput.value) || 0,
        parseInt(hurtBodyYInput.value) || 0,
        parseInt(hurtBodyWInput.value) || 0,
        parseInt(hurtBodyHInput.value) || 0
    ];
    frame[2][2] = [
        parseInt(hurtFeetXInput.value) || 0,
        parseInt(hurtFeetYInput.value) || 0,
        parseInt(hurtFeetWInput.value) || 0,
        parseInt(hurtFeetHInput.value) || 0
    ];

    updateInputsFromFrame(fighter.animationFrame);
});

nextFrameBtn.addEventListener('click', () => {
    const anim = fighter.animations[fighter.currentState];
    fighter.animationFrame = (fighter.animationFrame + 1) % anim.length;
    updateInputsFromFrame(fighter.animationFrame);
});



const allInputs = [
    pushXInput, pushYInput, pushWInput, pushHInput,
    hitXInput, hitYInput, hitWInput, hitHInput,
    hurtXInput, hurtYInput, hurtWInput, hurtHInput,
    hurtBodyXInput, hurtBodyYInput, hurtBodyWInput, hurtBodyHInput,
    hurtFeetXInput, hurtFeetYInput, hurtFeetWInput, hurtFeetHInput
];
allInputs.forEach(input => {
    input.addEventListener('input', () => {
        const key = frameKeyInput.value;
        const frame = fighter.frames.get(key);
        if (!frame) return;

        // Push box
        frame[1] = [
            parseInt(pushXInput.value) || 0,
            parseInt(pushYInput.value) || 0,
            parseInt(pushWInput.value) || 0,
            parseInt(pushHInput.value) || 0
        ];

        // Hit box
        frame[3] = [
            parseInt(hitXInput.value) || 0,
            parseInt(hitYInput.value) || 0,
            parseInt(hitWInput.value) || 0,
            parseInt(hitHInput.value) || 0
        ];

        // Hurt boxes
        frame[2][0] = [
            parseInt(hurtXInput.value) || 0,
            parseInt(hurtYInput.value) || 0,
            parseInt(hurtWInput.value) || 0,
            parseInt(hurtHInput.value) || 0
        ];
        frame[2][1] = [
            parseInt(hurtBodyXInput.value) || 0,
            parseInt(hurtBodyYInput.value) || 0,
            parseInt(hurtBodyWInput.value) || 0,
            parseInt(hurtBodyHInput.value) || 0
        ];
        frame[2][2] = [
            parseInt(hurtFeetXInput.value) || 0,
            parseInt(hurtFeetYInput.value) || 0,
            parseInt(hurtFeetWInput.value) || 0,
            parseInt(hurtFeetHInput.value) || 0
        ];

       
        updateInputsFromFrame(fighter.animationFrame);
    });
});

function animate(time) {
    if (!fighter) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isPlaying) {
        const anim = fighter.animations[fighter.currentState];
        const frameDuration = anim[fighter.animationFrame][1];

        if (!fighter.lastFrameTime) fighter.lastFrameTime = time;
        if (time - fighter.lastFrameTime >= frameDuration) {
            fighter.animationFrame = (fighter.animationFrame + 1) % anim.length;
            fighter.lastFrameTime = time;
        }

        updateInputsFromFrame(fighter.animationFrame);
    }

    fighter.draw(ctx, camera);

    requestAnimationFrame(animate);
}
