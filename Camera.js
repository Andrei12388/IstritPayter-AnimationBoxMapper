import { SCROLL_BOUNDRY, STAGE_HEIGHT, STAGE_PADDING, STAGE_WIDTH } from "./constants/stage.js";

export class Camera {
    constructor(x, y, fighters){
        this.position = { x, y };
        this.fighters = fighters;
        // screen shake state (duration in seconds)
        this.shakeDuration = 0;
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    // time: { previous, secondsPassed }
    update(time, context){
       this.position.y = -6 + Math.floor(Math.min(this.fighters[1].position.y, this.fighters[0].position.y)/10);
   
       const lowX = Math.min(this.fighters[1].position.x, this.fighters[0].position.x);
       const highX = Math.max(this.fighters[1].position.x, this.fighters[0].position.x);
   
       if (highX - lowX > context.canvas.width - SCROLL_BOUNDRY*2){
        const midPoint = (highX - lowX)/2;
        this.position.x = lowX + midPoint - (context.canvas.width)/2;
       } else{
        for (const fighter of this.fighters){
            if(fighter.position.x < this.position.x + SCROLL_BOUNDRY){
                this.position.x = fighter.position.x - SCROLL_BOUNDRY;
            } else if (fighter.position.x > this.position.x + context.canvas.width - SCROLL_BOUNDRY){
                this.position.x = fighter.position.x - context.canvas.width + SCROLL_BOUNDRY;
            }
          }
       }

       if (this.position.x < STAGE_PADDING) this.position.x = STAGE_PADDING;
       if (this.position.x > STAGE_WIDTH + STAGE_PADDING - context.canvas.width){
        this.position.x = STAGE_WIDTH + STAGE_PADDING - context.canvas.width;
       }

       if (this.position.y <0) this.position.y = 0;
       if (this.position.y > STAGE_HEIGHT - context.canvas.height){
        this.position.y = STAGE_HEIGHT - context.canvas.height;
       }

       // apply shake (if active) on top of the calculated camera position
       if (this.shakeTime > 0) {
           // decrement shake timer (time.secondsPassed is in seconds)
           this.shakeTime -= (time && time.secondsPassed) ? time.secondsPassed : 0;
           const progress = Math.max(0, this.shakeTime / (this.shakeDuration || 1));
           const magnitude = this.shakeIntensity * progress;
           // random offset each frame
           const offsetX = (Math.random() * 2 - 1) * magnitude;
           const offsetY = (Math.random() * 2 - 1) * magnitude;
           this.position.x += offsetX;
           this.position.y += offsetY;
           if (this.shakeTime <= 0) {
               // reset shake
               this.shakeDuration = 0;
               this.shakeIntensity = 0;
               this.shakeTime = 0;
           }
       }
    }

    // start a camera shake: intensity in pixels, duration in seconds
    shake(intensity = 4, duration = 0.15){
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTime = duration;
    }
}