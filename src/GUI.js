/* New style in use 

   Single line blocks for if, else, else if, for, while, do on the same line at discretion of line width.
   .1 Must have encasing {} No blocks shall go without its curlies EVER.
   .2 No semi-colon if on same line
   .3 Space before and after { and before }
   .4 If code on same line the closing } must also be on that line.
        eg 
        // good
        if (test === 10) { log("Hi 10") }
        else { log("Hi.") }
        // bad
        if (test === 10) { log("Hi 10") 
        } else { log("Hi.") }

*/
/*export GUIMain function(){
    import {GUIDialog}      from "http://localhost/MarksHome/GitHub/GrooverGUI/src/dialog.js"
    import {GUISlider}      from "http://localhost/MarksHome/GitHub/GrooverGUI/src/slider.js"
    import {GUIIconGroup}   from "http://localhost/MarksHome/GitHub/GrooverGUI/src/iconGroup.js"
    import {GUIToggleString} from "http://localhost/MarksHome/GitHub/GrooverGUI/src/toggleString.js"
    import {GUISelector}    from "http://localhost/MarksHome/GitHub/GrooverGUI/src/select.js"
    import {GUIButtons}     from "http://localhost/MarksHome/GitHub/GrooverGUI/src/buttons.js"
    import {GUIString}      from "http://localhost/MarksHome/GitHub/GrooverGUI/src/string.js"
    import {GUISeparator}   from "http://localhost/MarksHome/GitHub/GrooverGUI/src/separator.js"*/
    
    const RESIZE_DEBOUNCE_TIME = 100;
    const controlTypes = {
        dialog : 1,
        button : 2,
        selection : 3,
        slider : 4,
        seperator : 5,
        checkBox : 6,
        string : 7,
        toggleString : 8,
    };    
    const GUI = {
        units : "px",
        UID : 0,
        getUID(){
            GUI.UID += 1;
            return GUI.UID - 1;
        },
        start(){
            this.stopped = false;
            if (CSSInjector) {CSSInjector.inject()}
            GUI.events.start();
            GUI.window.start();
            GUI.image.start();
            requestAnimationFrame(GUI.animation.frameUpdate);
        },
        stop(){
            GUI.events.stop();
            GUI.window.stop();
            this.stopped = true;
        },
        stopped : true,
        animation : {
            id : 1,
            time : 0,
            ease(v,p){
                v = v < 0 ? 0 : v > 1 ? 1 : v;
                var vv = Math.pow(v,p);
                return vv / (vv + Math.pow(1 - v, p));
            },
            transitions : [],
            frameEvents : [],
            addFrameEvent(callback,countdown = 0,data){
                GUI.animation.id += 1;
                GUI.animation.frameEvents.push({
                    callback,
                    countdown : Math.abs(Math.floor(countdown)),
                    data,
                    id : GUI.animation.id,
                })
                return GUI.animation.id;
            },
            clearFrameEvent(id){
                var events = GUI.animation.frameEvents;
                var i = 0;
                for (var i = 0; i < events.length; i++) {
                    if(events[i].id === id){
                        events.splice(i,1)[0];
                        return
                    }
                }
            },
            addTransition(length,data,update,onend){
                GUI.animation.id += 1;
                GUI.animation.transitions.push({
                    endTime : GUI.animation.time + length * 1000,
                    length : length * 1000,
                    id : GUI.animation.id,
                    update,onend,data
                });
                return GUI.animation.id;
            },
            clearTransition(id,dontCallback = false){
                var trans = GUI.animation.transitions;
                var i = 0;
                for (i = 0; i < trans.length; i++) {
                    if(trans[i].id === id){
                        var t = trans[i];
                        if (t.onend && !dontCallback) {t.onend(t)}
                        return trans.splice(i,1)[0];
                    }
                }
            },
            frameUpdate(timer){  
                var trans = GUI.animation.transitions;
                GUI.animation.time = timer;
                var i = 0;
                for (i = 0; i < trans.length; i++) {
                    var t = trans[i];
                    if (!t.paused) {
                        t.pos = (t.endTime - timer) / t.length;
                        t.epos = GUI.animation.ease(t.pos,2);
                    }
                    t.update(t)
                    if (t.pos <= 0){
                        if (t.onend) {t.onend(t)}
                        trans.splice(i,1);
                        i--
                    }
                }
                var events = GUI.animation.frameEvents;
                for (var i = 0; i < events.length; i++) {
                    if(events[i].countdown){
                        events[i].countdown -= 1;
                    }else{
                        events[i].callback(events[i].data);
                        events.splice(i--,1);
                    }
                }
                if (!this.stopped) {requestAnimationFrame(GUI.animation.frameUpdate)}
            }
        },
        utilities : {
            nameToReadable(name){
                var r = [];
                var str = "";
                for(var i = 0; i < name.length; i += 1) {
                    if (name[i].toUpperCase() === name[i] && str !== "") {
                        r.push(str);
                        str = name[i];
                    } else {str += name[i]}
                }
                if(str !== "") {r.push(str)}
                r.forEach((word, i) => {
                    if (i === 0) {word = word[0].toUpperCase() + word.substr(1)}
                    else {word = word.toLowerCase()}
                    r[i] = word;
                })
                return r.join(" ");
            }
        },
        window : {
            top : 0,
            left : 0,
            width : innerWidth,
            height : innerHeight,
            minZIndex : 1000,
            nextZIndex : 1000,
            topZIndex : 1100,
            currentTop : null,
            getNextZIndex() {GUI.window.nextZIndex += 1; return GUI.window.nextZIndex-=1},
            getTopZIndex() {return GUI.window.topZIndex},
            requestTop(control){
                if(GUI.window.currentTop !== null){
                    if(!GUI.window.currentTop.destroyed){
                        GUI.window.currentTop.elements.container.style.zIndex = GUI.window.currentTop.zIndex;
                    }
                }
                GUI.window.currentTop = control;
                control.elements.container.style.zIndex = GUI.window.topZIndex;
            },
            contain(position,unbound=false){
                var w = GUI.window.width;
                var h = GUI.window.height;            
                if(!unbound){
                    position.width = position.width < position.minWidth ? position.minWidth : position.width;
                    position.width = position.width > position.maxWidth ? position.maxWidth : position.width;
                    position.height = position.height < position.minHeight ? position.minHeight : position.height;
                    position.height = position.height > position.maxHeight ? position.maxHeight : position.height;
                }
                position.height = h <= position.height ? h : position.height;
                position.width = w <= position.width ? w : position.width;
                position.top = position.top < this.top ? this.top : position.top;
                position.left = position.left < this.left ? this.left : position.left;
                position.top = position.top + position.height + 2 >= h ? h - position.height - 2 : position.top;
                position.left = position.left + position.width + 2 >= w ? w - position.width - 2 : position.left;
            },
            position(el,position,free,unbound=false,set){
                var style = el.style;
                if (!free) { this.contain(position,unbound) }
                if(set===undefined){
                    set=["width","height","top","left","opacity"];
                }
                set.forEach(key => {
                    if (key !== "opacity") {style[key] = position[key] + GUI.units}
                    else {style[key] = position[key]}
                });
            },
            resized(event){
                function resize(){
                    GUI.window.width = innerWidth;
                    GUI.window.height = innerHeight;
                    GUI.window.eachDialog(dialog=>{
                        dialog.update();
                        return false;
                    });
                    console.log("resized");
                }
                clearTimeout(GUI.window.debounceHandle);
                GUI.window.debounceHandle = setTimeout(resize,RESIZE_DEBOUNCE_TIME);
                console.log("resize");
            },            
            start () {
                GUI.events.bindEvent("resize",window, GUI.window.resized);
            },
            stop () {
                GUI.events.unbindEvent("resize",window);
            },
            dialogs : {},
            addDialog (control) {GUI.window.dialogs[control.uName] = control},
            removeDialog (control) {GUI.window.dialogs[control.uName] = undefined},
            eachDialog (callback) {
                var keys = Object.keys(GUI.window.dialogs).filter(name=>GUI.window.dialogs[name]!==undefined);
                for(var i = 0; i < keys.length; i ++){
                    if(callback(GUI.window.dialogs[keys[i]]) === true){
                        break;
                    }
                }
            },
        },
        events : {
            id : Math.floor(Math.random()*10000),
            eventCaptureExclusive : false,
            eventList : "mousemove,mouseout,mouseover,mousedown,mouseup,click,wheel,mousewheel,contextmenu".split(","),
            eventCapture : {},
            keyBindings : {},
            keyModifyNames : ["ALT","CTRL","SHIFT"],
            keyNames : "KeyA,KeyB,KeyC,KeyD,KeyE,KeyF,KeyG,KeyH,KeyI,KeyJ,KeyK,KeyL,KeyM,KeyN,KeyO,KeyP,KeyQ,KeyR,KeyS,KeyT,KeyU,KeyV,KeyW,KeyX,KeyY,KeyZ,Digit0,Digit1,Digit2,Digit3,Digit4,Digit5,Digit6,Digit7,Digit8,Digit9,Delete,Backslash,ArrowUp,ArrowLeft,ArrowDown,ArrowRight,Enter,Escape,Tab,Delete,End,Home,Insert,MetaLeft,PageDown,PageUp,Pause,Backquote,Backslash,Backspace,BracketLeft,BracketRight,Equal,Minus,Semicolon,Quote,CapsLock,NumLock,NumpadAdd,NumpadDecimal,NumpadDivide,NumpadEnter,NumpadMultiply,NumpadSubtract".split(","),
            getKeyName(key,modifiers){
                key = key.toUpperCase();
                var mod = "";
                if(typeof modifiers === "string"){
                    if(GUI.events.keyModifyNames.indexOf(modifiers.toUpperCase()) > -1){
                        mod = "["+modifiers.toUpperCase() + "]";
                    }else{
                        console.warn("Unknown key modifier '"+modifiers+"'. Modifier not used.");
                    }
                }else if(Array.isArray(modifiers)){
                    for(var i = 0; i < modifiers.length; i ++){
                        if(GUI.events.keyModifyNames.indexOf(modifiers[i].toUpperCase()) > -1){
                            modifiers[i] = modifiers[i].toUpperCase();
                        }else{
                            console.warn("Unknown key modifier '"+modifiers[i]+"'. Modifier not used.");
                            modifiers.splice(i--,1);
                        }
                    }
                    mod = "["+ modifiers.sort().join("][") + "]";
                }
                if(key.length === 1){
                    for(var i = 0; i < GUI.events.keyNames.length; i ++){
                        if( GUI.events.keyNames[i][ GUI.events.keyNames[i].length-1] === key){
                            return mod + GUI.events.keyNames[i];
                        }
                    }
                }else{
                    for(var i = 0; i < GUI.events.keyNames.length; i ++){
                        if( GUI.events.keyNames[i].toUpperCase() === key){
                            return mod + GUI.events.keyNames[i];
                        }
                    }
                }
                    
            },
            bindKey(keyName,element,callback, preventDefault){
                if(element.id === null || element.id === undefined){
                    throw new ReferenceError("Can not bind key to an element without id");
                }
                if (element.eventKey === undefined) {element.eventKey = {}}
                element.eventKey[keyName] = callback;       
                            
                GUI.events.keyBindings[keyName] = {id : element.id, callback , preventDefault};
            },
            unbindKey(keyName,element){
                if (element === undefined || element.eventKey === undefined) {return}
                element.eventKey[keyName] = undefined;
                GUI.events.keyBindings[keyName] = undefined;
            },
            bindEvent(eventName,element,callback){
                if (element.eventBind === undefined) {element.eventBind = {}}
                element.eventBind[eventName] = callback;
            },
            unbindEvent(eventName,element){
                if (element === undefined || element.eventBind === undefined) {return}
                element.eventBind[eventName] = undefined;
            },
            blockContextMenu(element){
                element.blockContextMenu = true;
            },
            captureEvent(eventName,callback) {GUI.events.eventCapture[eventName] = callback},
            releaseEvent(eventName) {GUI.events.eventCapture[eventName] = undefined},      
            exclusive() {GUI.events.eventCaptureExclusive = true},
            releaseExclusive() {GUI.events.eventCaptureExclusive = false},        
            eventManager(event){
                var tag = event.target;
                if(typeof GUI.events.eventCapture[event.type] === "function"){
                    GUI.events.eventCapture[event.type](event);
                    event.preventDefault();
                    return false;                
                }
                if(tag.eventBind && typeof tag.eventBind[event.type] === "function"){
                    event.exclusive = GUI.events.eventCaptureExclusive;                
                    tag.eventBind[event.type](event);
                }
                if(event.type === "contextmenu" && event.target.blockContextMenu){
                    event.preventDefault();
                }
            },
            eventKeyManager(event){
                var keyCode = "";
                keyCode += event.altKey ? "[ALT]" : "";
                keyCode += event.ctrlKey ? "[CTRL]" : "";
                keyCode += event.shiftKey ? "[SHIFT]" : "";
                keyCode += event.code;
                if(typeof GUI.events.eventCapture[keyCode] === "function"){
                    event.modKey =  keyCode;
                    GUI.events.eventCapture[keyCode](event);
                    event.preventDefault();
                    return false;                
                }            
                if(GUI.events.keyBindings[keyCode]){
                    event.exclusive = GUI.events.eventCaptureExclusive;   
                    event.modKey =  keyCode;
                    if(GUI.events.keyBindings[keyCode].preventDefault){
                        event.preventDefault();
                    }
                    GUI.events.keyBindings[keyCode].callback(event);
                }
            },
            start(){
                this.eventList.forEach(event => {
                    document.removeEventListener(event,GUI.events.eventManager);
                    document.addEventListener(event,GUI.events.eventManager);
                });
                document.removeEventListener("keydown",GUI.events.eventKeyManager);
                document.removeEventListener("keyup",GUI.events.eventKeyManager);
                document.addEventListener("keydown",GUI.events.eventKeyManager);
                document.addEventListener("keyup",GUI.events.eventKeyManager);
                // resize is a little problematic when I have ace.js running on the page
                // so have the event on window instead of document.
                window.removeEventListener("resize",GUI.events.eventManager);
                window.addEventListener("resize",GUI.events.eventManager);
                
            },
            stop () {this.eventList.forEach(event => document.removeEventListener(event,this.eventManager))},
        },
        image : { // used to access sprite sheets. Sprites available as image elements (canvas)
            spriteSheets : null, // named sprite sheats
            images : null,  // images loaded  map index is the image src URL and value is the spriteSheet name
            start(){
                GUI.image.images = new Map(); 
                GUI.image.spriteSheets = {};
                GUI.image.rendering.dropArrow("dropArrowDefault",{size : 16});
                GUI.image.rendering.checkBox("checkBoxDefault",{size : 16});
                GUI.image.rendering.closeIcon("closeResizeIconsDefault",{size : 14});
                GUI.image.rendering.sliderTickBackground("sliderTicks",{width : 160, height : 14,ticks :16, size : 14});
            },
            updateSpriteSheetImage(name,spriteIndex,canvas){ // changes the canvas to the indexed sprite
                var ss = GUI.image.spriteSheets[name];
                ss.getSpriteByIndex(ss,canvas.ctx,spriteIndex);
            },
            getSpriteSheetImage(name,spriteIndex){  // creates a DOM element to display a sprite
                var ss = GUI.image.spriteSheets[name];
                var canvas = document.createElement("canvas");            
                canvas.width = ss.options.width;
                canvas.height = ss.options.height;
                canvas.ctx = canvas.getContext("2d");
                if (!ss.loaded) {
                    if (ss.renderList === undefined){ ss.renderList = [] }
                    ss.renderList.push({ctx : canvas.ctx, spriteIndex});
                } else { ss.getSpriteByIndex(ss,canvas.ctx,spriteIndex) }
                return canvas;
            },
            spriteSheet(name,src,options){
                const onloaded = (ss) => {
                     ss.loaded = true;
                     ss.error = false;
                     if(typeof ss.options.onload === "function") { ss.options.onload(name) }                         
                     callRenderRequests(ss); // if any requested copies of the sprite where made befor it was loaded render them now.                    
                     releaseDependants("loaded",ss)
                }
                const onerrored = (event,ss) => {
                     console.warn("Sprite sheet image failed to load from URL '"+src+"'");
                     ss.error = true;
                     ss.loaded = false;                         
                     if(typeof ss.options.onerror === "function") {ss.options.onerror(name,event) }
                     callRenderRequests(ss);  
                     releaseDependants("error",ss);
                }
                const callRenderRequests = (ss) => {
                     if(ss.renderList){
                         while(ss.renderList.length > 0){
                             var rl = ss.renderList.shift();
                             ss.getSpriteByIndex(ss,rl.ctx,rl.spriteIndex);
                         }
                     }
                     ss.renderList = undefined;
                }
                const releaseDependants = (type, ss) => {
                    if(ss.dependants){
                         while(ss.dependants.length > 0){
                             var ssd = ss.dependants.shift();
                             if(type === "error"){
                                 onerrored(null,ssd);
                             }else{
                                 onloaded(ssd);
                             }
                         }
                     }
                     ss.dependants = undefined;                    
                }
                 var ss = GUI.image.spriteSheets[name] = {};
                 ss.options = options;
                 ss.sprites = {};
                 ss.name = name;
                 ss.getSpriteByIndex = GUI.image.getSpriteByIndex;
                 var existingName = GUI.image.images.get(src);
                 if(existingName !== undefined){
                     var existing = GUI.image.spriteSheets[existingName]
                     ss.canvas = existing.canvas;
                     ss.ctx = existing.ctx;
                     if(existing.loaded) { setTimeout(()=>{ onloaded(ss) }, 0) }
                     else if(existing.error){ setTimeout(() => { onerrored(null,ss) }, 0) }
                     else{  // not loaded status unknown
                         if(existing.dependants === undefined) { existing.dependants = [] }
                         existing.dependants.push(ss);                         
                     }
                 }else{
                     GUI.image.images.set(src,name);
                     ss.canvas = document.createElement("canvas");
                     ss.canvas.width = options.width ? options.width : 16;
                     ss.canvas.height = options.height ? options.height : 16;
                     ss.ctx = ss.canvas.getContext("2d");
                     image = new Image();
                     image.src = src;
                     image.onload = function(){
                         ss.canvas.width = image.width;
                         ss.canvas.height = image.height;
                         ss.ctx.drawImage(this,0,0);
                         onloaded(ss);
                     }
                     image.onerror = (event) => { onerrored(event,ss) }
                 }
                 return ss;
            },
            createCanvas(w,h){
                 var canvas = document.createElement("canvas");
                 canvas.width = w;
                 canvas.height = h;
                 canvas.ctx = canvas.getContext("2d");
                 return canvas;            
            },
            getSpriteByIndex(spriteSheet,ctx,index){
                var ss = spriteSheet;
                var w = Math.floor(ss.canvas.width / ss.options.width);
                var h = Math.floor(ss.canvas.height / ss.options.height);
                var x = (index % w) * ss.options.width;
                var y = Math.floor(index / w) * ss.options.height;
                ctx.clearRect(0,0,ss.options.width,ss.options.height);
                if(ss.error){
                    ctx.fillStyle = "red";
                    ctx.fillRect(0,0,ss.options.width,ss.options.height);
                }else{
                    ctx.drawImage(ss.canvas,-x,-y);
                }
            },
            rendering : {
                sliderTickBackground(name,options){
                    options = Object.assign({
                        size : 16,
                        },options
                     );
                     var ss = GUI.image.spriteSheets[name] = {};
                     ss.options = options;
                     //options.width = options.size;
                     //options.height = options.size;
                     
                     ss.sprites = {};
                     ss.canvas = GUI.image.createCanvas(options.width, options.height);
                     var c = ss.ctx = ss.canvas.ctx;
                     var s = options.size;
                     ss.loaded = true;    

                     
                     c.fillStyle = "white";
                     var count = 0;
                     for(var i = 0; i < options.width; i += options.width / options.ticks){
                         
                         if(count % 4 === 1 || count % 4 === 3){
                             c.globalAlpha = 0.25;
                             c.fillRect(i,Math.floor(options.height * 0.75),1,Math.floor(options.height * 0.25));
                         }else if(count % 4 === 2){
                             c.globalAlpha = 0.5;
                             c.fillRect(i,Math.floor(options.height * 0.5),1,Math.floor(options.height * 0.5));
                         }else{
                             if(count !== 0){
                                c.globalAlpha = 0.70;
                                c.fillRect(i,Math.floor(options.height * 0.25),1,Math.floor(options.height * 0.75));
                             }
                         }
                         count ++;
                     }
                     ss.getSpriteByIndex = GUI.image.getSpriteByIndex;    
                     return ss;                 
                    
                    
                    
                },
                dropArrow(name,options){
                    options = Object.assign({
                        size : 16,
                        },options
                     );
                     var ss = GUI.image.spriteSheets[name] = {};
                     ss.options = options;
                     options.width = options.size;
                     options.height = options.size;
                     
                     ss.sprites = {};
                     ss.canvas = GUI.image.createCanvas(options.width * 2, options.height);
                     var c = ss.ctx = ss.canvas.ctx;
                     var s = options.size;
                     ss.loaded = true;    
                     var path = [2,3,14,3,8,14];
                     var pathInside = [3,4,13,4,8,13];
                     const addPath = (p,x,y,dir) => {
                         var i = 0;
                         c.setTransform(1,0,0,dir,x,y);
                         c.moveTo(p[i++],p[i++]);
                         while(i < p.length){ c.lineTo(p[i++],p[i++]) }
                         c.closePath();
                         c.setTransform(1,0,0,1,0,0);
                     }
                     
                     c.strokeStyle = "black";
                     c.fillStyle = "white";
                     c.beginPath();
                     addPath(path,0,0,1);
                     addPath(path,s,s,-1);
                     c.fill();
                     c.stroke();
                     c.beginPath();
                     addPath(pathInside,0,0,1);
                     addPath(pathInside,s,s,-1);
                     c.fillStyle = "#DDD";
                     c.fill();
                    
                     ss.getSpriteByIndex = GUI.image.getSpriteByIndex;    
                     return ss;                 
                    
                },
                closeIcon(name,options){  // legacy support
                    return this.closeResizeIcons(name,options);
                },
                closeResizeIcons(name,options){
                    options = Object.assign({
                        size : 16,
                        },options
                     );
                     var ss = GUI.image.spriteSheets[name] = {};
                     ss.options = options;
                     options.width = options.size;
                     options.height = options.size;
                     
                     ss.sprites = {};
                     ss.canvas = GUI.image.createCanvas(options.width*4, options.height);
                     var c = ss.ctx = ss.canvas.ctx;
                     var s = options.size;
                     var lw = 6;
                     var iN = 3;
                     ss.loaded = true;        
                     
                     // close icon
                     c.strokeStyle = "black";
                     c.lineWidth = lw;
                     c.lineCap = "round";
                     c.beginPath();
                     c.moveTo(iN,iN);
                     c.lineTo(s-iN,s-iN);
                     c.moveTo(s-iN,iN);
                     c.lineTo(iN,s-iN);
                     c.stroke();
                     c.strokeStyle = "white";
                     c.lineWidth = lw-2;
                     c.stroke();
                     c.strokeStyle = "black";
                     c.lineWidth = lw;
                     c.beginPath();
                     c.moveTo(s + iN,iN);
                     c.lineTo(s + s-iN,s-iN);
                     c.moveTo(s + s-iN,iN);
                     c.lineTo(s + iN,s-iN);
                     c.stroke();
                     c.strokeStyle = "red";
                     c.lineWidth = lw-2;
                     c.stroke();
                     
                     // resize icon
                     
                     var lw = 3;
                     var iN = 4;
                     var jN = 1;
                     
                     c.strokeStyle = "black";
                     c.lineWidth = lw;
                     c.beginPath();
                     //c.moveTo(s * 2 + s - jN,s - iN * 4);
                     //c.lineTo(s * 2 + s - iN * 4, s - jN);
                     c.moveTo(s * 2 + s - jN,          s - jN - iN * 3);
                     c.lineTo(s * 2 + s - jN - iN * 3, s - jN);
                     c.moveTo(s * 2 + s - jN,          s - jN - iN * 2);
                     c.lineTo(s * 2 + s - jN - iN * 2, s - jN);  
                     c.moveTo(s * 2 + s - jN,          s - jN - iN );
                     c.lineTo(s * 2 + s - jN - iN,     s - jN);  
                     c.stroke();
                     c.strokeStyle = "#AAA";
                     c.lineWidth = lw-2;
                     c.stroke();
                     
                     c.strokeStyle = "black";
                     c.lineWidth = lw;
                     c.beginPath();
                     c.moveTo(s * 3 + s - jN,          s - jN - iN * 3);
                     c.lineTo(s * 3 + s - jN - iN * 3, s - jN);
                     c.moveTo(s * 3 + s - jN,          s - jN - iN * 2);
                     c.lineTo(s * 3 + s - jN - iN * 2, s - jN);  
                     c.moveTo(s * 3 + s - jN,          s - jN - iN );
                     c.lineTo(s * 3 + s - jN - iN,     s - jN);  
                     c.stroke();
                     c.strokeStyle = "#F88";
                     c.lineWidth = lw-2;
                     c.stroke();
                     
                     
                     
                     ss.getSpriteByIndex = GUI.image.getSpriteByIndex;    
                     return ss;                 
                },
                checkBox(name,options){
                    options = Object.assign({
                        size : 16,
                        },options
                     );
                     var ss = GUI.image.spriteSheets[name] = {};
                     ss.options = options;
                     options.width = options.size;
                     options.height = options.size;
                     
                     ss.sprites = {};
                     ss.canvas = GUI.image.createCanvas(options.width*2, options.height);
                     var c = ss.ctx = ss.canvas.ctx;
                     var s = options.size;
                     ss.loaded = true;        
                     c.fillStyle = "black";
                     c.fillRect(0, 0, s, s);
                     c.fillStyle = "white";
                     c.fillRect(1, 1, s - 2, s - 2);
                     c.fillStyle = "black";
                     c.fillRect(3, 3, s - 6, s - 6);
                     c.fillStyle = "#AAA";
                     c.fillRect(4, 4, s - 8, s - 8);
                     c.drawImage(ss.canvas, s, 0);
                     c.fillStyle = "black";
                     c.fillRect(s + 2, 2, s - 4, s - 4);                 
                     c.fillStyle = "red";
                     c.fillRect(s + 3, 3, s - 6, s - 6);                 
                     c.fillStyle = "#F77";
                     c.fillRect(s + 4, 4, 4, 4);                 
                     c.fillStyle = "red";
                     c.fillRect(s + 5, 5, 3, 3);                 
                     ss.getSpriteByIndex = GUI.image.getSpriteByIndex;    
                     return ss;                 
                },
            }
        },
        //dataGUI : dataGUI,
        UIs : {
            dialog,slider,toggleString,selection,stringInput,separator,buttons,checkBox,
        },
        controlTypes : controlTypes,
        
    }
    //GUI.controlTypes = controlTypes;
/*    GUI.UIs.dialog = GUIDialog(GUI);
    GUI.UIs.slider = GUISlider(GUI);
    //GUI.UIs.iconGroup = GUIIconGroup(GUI);
    GUI.UIs.checkBox = GUICheckBox(GUI);
    GUI.UIs.toggleString = GUIToggleString(GUI);
    GUI.UIs.selection = GUISelector(GUI);
    GUI.UIs.stringInput = GUIButtons(GUI);
    GUI.UIs.separator = GUIString(GUI);
    GUI.UIs.buttons = GUISeparator(GUI);
    
    return GUI;    
}*/
//GUI.start();



/*END*/