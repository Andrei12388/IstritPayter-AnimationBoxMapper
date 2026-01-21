 export function getContext(){
 const canvasEl = document.querySelector('canvas');
    const context = canvasEl.getContext('2d');
    context.imageSmoothingEnabled = false;

    return context;
    }
 
 export function drawFrame(context, image, dimensions, x, y, direction = 1, alpha = 1){
        const [sourceX, sourceY, sourceWidth, sourceHeight] = dimensions;
        

        context.globalAlpha = alpha;
        context.scale(direction,1);
        context.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            x*direction, y, sourceWidth, sourceHeight,
        );
        context.setTransform(1,0,0,1,0,0);
        context.globalAlpha = 1;
    }