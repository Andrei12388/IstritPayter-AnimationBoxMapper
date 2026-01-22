import { FighterHurtBox } from "./fighter.js";
import { FighterDirection } from "./fighter.js";
import { toolState } from "../InsertFrameHere.js";

/**
 * Lightweight fighter renderer for image mapping & debug visualization
 */
export class FighterDebugRenderer {
    constructor({
        image,
        frames,
        animations,
        position = { x: 0, y: 0 },
        direction = FighterDirection.RIGHT,
        state,
    }) {
        this.image = image;
        this.frames = frames;
        this.animations = animations;

        this.position = position;
        this.direction = direction;
        this.currentState = state;
        this.animationFrame = 0;

        this.boxes = this._emptyBoxes();
    }

    /* ---------------------------------- */
    /* Helpers                            */
    /* ---------------------------------- */

    _emptyBoxes() {
        return {
            push: { x: 0, y: 0, width: 0, height: 0 },
            hit:  { x: 0, y: 0, width: 0, height: 0 },
            hurt: {
                [FighterHurtBox.HEAD]: [0, 0, 0, 0],
                [FighterHurtBox.BODY]: [0, 0, 0, 0],
                [FighterHurtBox.FEET]: [0, 0, 0, 0],
            },
        };
    }

    /* ---------------------------------- */
    /* Box Extraction                     */
    /* ---------------------------------- */

    getBoxes(frameKey) {
        const frame = this.frames.get(frameKey);
        if (!frame) return this._emptyBoxes();

        const [
            , // sprite data (unused here)
            push = [0, 0, 0, 0],
            hurt = [[0,0,0,0],[0,0,0,0],[0,0,0,0]],
            hit  = [0, 0, 0, 0],
        ] = frame;

        const [px, py, pw, ph] = push;
        const [head, body, feet] = hurt;
        const [hx, hy, hw, hh] = hit;

        return {
            push: { x: px, y: py, width: pw, height: ph },
            hit:  { x: hx, y: hy, width: hw, height: hh },
            hurt: {
                [FighterHurtBox.HEAD]: head,
                [FighterHurtBox.BODY]: body,
                [FighterHurtBox.FEET]: feet,
            },
        };
    }

    /* ---------------------------------- */
    /* Debug Drawing                      */
    /* ---------------------------------- */

    drawDebugBox(context, camera, box, color) {
        if (!box) return;

        const { x = 0, y = 0, width = 0, height = 0 } = box;

        context.beginPath();
        context.strokeStyle = color;
        context.fillStyle = color + "33";

        context.rect(
            Math.floor(this.position.x + x * this.direction - camera.position.x) + 0.5,
            Math.floor(this.position.y + y - camera.position.y) + 0.5,
            width * this.direction,
            height
        );

        context.fill();
        context.stroke();
    }

    drawDebug(context, camera) {
        const [frameKey] = this.animations[this.currentState][this.animationFrame];
        const boxes = this.getBoxes(frameKey);

        context.lineWidth = 1;

        // Push box (green)
        this.drawDebugBox(context, camera, boxes.push, "#55FF55");

        // Hurt boxes (blue)
        Object.values(boxes.hurt).forEach(([x, y, w, h]) =>
            this.drawDebugBox(context, camera, { x, y, width: w, height: h }, "#7777FF")
        );

        // Hit box (red)
        this.drawDebugBox(context, camera, boxes.hit, "#FF0000");

        // Origin cross
        const ox = Math.floor(this.position.x - camera.position.x);
        const oy = Math.floor(this.position.y - camera.position.y);

        context.strokeStyle = "red";
        context.beginPath();
        context.moveTo(ox - 4, oy);
        context.lineTo(ox + 5, oy);
        context.moveTo(ox, oy - 5);
        context.lineTo(ox, oy + 4);
        context.stroke();
    }

    /* ---------------------------------- */
    /* Main Draw                          */
    /* ---------------------------------- */

    draw(context, camera) {
        const animation = this.animations[this.currentState];
        if (!animation) return;

        const [frameKey] = animation[this.animationFrame];
        const frame = this.frames.get(frameKey);
        if (!frame) return;

        const [[
            [sx, sy, sw, sh],
            [originX, originY]
        ]] = frame;

        this.boxes = this.getBoxes(frameKey);

        context.save();
        context.scale(this.direction, 1);

        context.drawImage(
            this.image,
            sx, sy, sw, sh,
            Math.floor((this.position.x - camera.position.x) * this.direction) - originX,
            Math.floor(this.position.y - camera.position.y) - originY,
            sw, sh
        );

        context.restore();

      if(toolState.showBox) this.drawDebug(context, camera);
    }
}
