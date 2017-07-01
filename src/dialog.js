
//export GUIDialog function(GUI){
    const FONT_SIZE = 12;
    const CONTROL_HEIGHT = 16;
    const DOCK_TEAR_DISTANCE = 20;
    const DOCK_MAG_DISTANCEX = 20;
    const DOCK_MAG_DISTANCEY_DOWN = 5;
    const DOCK_MAG_DISTANCEY_UP = 10;

        

    const dialog = (function(){
        var controlOptionsDefault = {
            building : false, // To prevent needless update events set to true while constructing the dialog content
                              // use control.buildComplete() to signal that you have finished building the dialog
                              
            color : "#29b756",
            highlight : "#40ce2d", // "#40ce2d",
            closeIconHelp : "Click to close this dialog.",
            resizeIconHelp : "Click drag to resize dialog.",
        }
        
        const defaultPosition = {
            top : 100,
            left : 100,
            width : 200,
            height : CONTROL_HEIGHT*1+1,
            minWidth : 200,
            minHeight : CONTROL_HEIGHT*1 + 1,
            maxWidth : 1000,
            maxHeight : CONTROL_HEIGHT*1 + 1,
            opacity : 1,
        }
        function createControl(name,options){
            var control;
            var mouseX;
            var mouseY;
            var deltaX;
            var deltaY;
            var dockDragX;
            var ignorClickDelay = 0;
            var ignorNextFoldClick = false;
            var controls = {};
            var uName= name + GUI.getUID();
            var overflowRequests = 0;
            var updateEventHandle;
            var opening = true;
            var state;
            var currentFoldTransition;


            if(options.state){
                state = options.state;
                options.state = undefined;
            }
            options = Object.assign({},controlOptionsDefault,options);
            options.position = Object.assign({}, defaultPosition);
            options.position.top = state && state.top !== undefined ? state.top : options.position.top;
            options.position.left = state && state.left !== undefined ? state.left : options.position.left;
            if(state){
                state.top = undefined;
                state.left = undefined;
                options = Object.assign(options,state);
            }

            var animations = {
                setPos(pos,data){
                    options.position.opacity = pos;
                    options.position.height = pos * data.h;
                    if(options.docked){
                        options.position.left = options.dockedParent.options.position.left;
                        options.position.top = this.getDockedParentPos(options.dockedParent);
                        //options.position.top = options.dockedParent.options.position.top + options.dockedParent.options.position.height;
                        options.position.width = options.dockedParent.options.position.width;
                    }else if(options.dockedChild && !opening){
                        options.position.height = pos * (data.h-data.minh) + data.minh;
                        
                    }else{                
                        options.position.width = pos * data.w;
                        options.position.top = data.y + (1-pos) * 0.5 * data.h;
                        options.position.left = data.x + (1-pos) * 0.5 * data.w;
                    }
                    GUI.window.position(elements.container,options.position,true); 
                    updateControls(); 
                },
                getDockedParentPos(parent){
                    if(parent.options.dockedParent){
                        return this.getDockedParentPos(parent.options.dockedParent) + parent.options.position.height;
                    }
                    return  parent.options.position.top + parent.options.position.height;
                },
                setFold(pos,data){
                    options.position.height = pos * (data.h-data.minh) + data.minh;
                    if(options.docked){
                        options.position.top = this.getDockedParentPos(options.dockedParent);
                        //options.position.top = options.dockedParent.options.position.top + options.dockedParent.options.position.height;
                    }
                    GUI.window.position(elements.container,options.position,false,true); 
                    updateControls(); 
                },
                fold (t) {this.setFold(t.epos,t.data)},
                unfold (t) {this.setFold(1-t.epos,t.data)},
                folded (t) {
                    options.position.maxHeight = options.position.minHeight = t.data.minh;
                    this.setFold(t.epos,t.data);
                    control.folded = true;       
                    control.inTransition = false;                
                    currentFoldTransition = null;
                },
                unfolded (t) {
                    options.position.maxHeight = options.position.minHeight = control.height;
                    this.setFold(1-t.epos,t.data);
                    control.folded = false;
                    control.inTransition = false;
                    currentFoldTransition = null;

                },
                closing (t) {this.setPos(t.epos,t.data)},
                opening (t) {this.setPos(1-t.epos,t.data)},
                open (t) {this.setPos(1,t.data);control.inTransition = false;updateControls();opening = false;},
                closed (t) {
                    elements.container.style.display = "none";
                    control.inTransition = false;
                    destroy();
                    if (typeof control.onclosed === "function") {control.onclosed()}
                },
            }
            function close(event){
                var okToClose = true;
                if(event === undefined || (!event.exclusive && !control.inTransition)){
                    if(typeof control.onbeforeclose === "function"){
                        okToClose = control.onbeforeclose(control);
                    }
                    if(okToClose){
                        hideOverflow();
                        control.inTransition = true;            
                        GUI.animation.addTransition(0.5,{
                                x : options.position.left,
                                y : options.position.top,
                                w : options.position.width,
                                h : options.position.height,
                            },
                            animations.closing.bind(animations),
                            animations.closed.bind(animations)
                        )
                    }
                }
                return control;            
            }
            function open(){
                if(options.container){
                    $$(options.container,elements.container);
                }        
                control.inTransition = true;            
                GUI.animation.addTransition(0.5,{
                        x : options.position.left,
                        y : options.position.top,
                        w : options.position.width,
                        h : options.position.height,
                    },
                    animations.opening.bind(animations),
                    animations.open.bind(animations)
                )      
                return control;            
            }
            function foldup(){
                if(control.inTransition && currentFoldTransition){
                     //GUI.animation.clearTransition(currentFoldTransition,true);
                     //control.inTransition = false;
                     //currentFoldTransition = null;
                }
                if(!control.inTransition){
                    control.inTransition = true;
                    hideOverflow();
                    options.position.minHeight = CONTROL_HEIGHT + 1;
                    currentFoldTransition = GUI.animation.addTransition(0.5,{
                            h : options.position.height,
                            minh : CONTROL_HEIGHT + 1,
                        },
                        animations.fold.bind(animations),
                        animations.folded.bind(animations)
                    );                      
                }
            }
            function foldout(){
                if(control.inTransition && currentFoldTransition){
                     //GUI.animation.clearTransition(currentFoldTransition,true);
                     //control.inTransition = false;
                    // currentFoldTransition = null;
                }
                if(!control.inTransition){
                    control.inTransition = true;            
                    options.position.height = control.height;
                    currentFoldTransition = GUI.animation.addTransition(0.5,{
                            h : control.height,
                            minh : CONTROL_HEIGHT + 1,
                        },
                        animations.unfold.bind(animations),
                        animations.unfolded.bind(animations)
                    );                     
                }
            }        
            function fold(event, forced = false){
                if((!event || !event.exclusive) && !control.inTransition && (forced || ! ignorNextFoldClick)){
                    if(control.folded){
                        foldout();
                    }else{
                        foldup();
                    }
                }
                ignorNextFoldClick = false;
            }
            function setPos(x,y){
                if(!options.docked){
                    options.position.left += x;
                    options.position.top += y;
                    GUI.window.position(elements.container,options.position);        
                } 
            }
            function move(x = 0,y = 0){
                if(options.docked){
                    options.position.left = options.dockedParent.options.position.left;
                    options.position.top = options.dockedParent.options.position.top + options.dockedParent.options.position.height;
                    GUI.window.position(elements.container,options.position);   
                }else{
                    options.position.left += x;
                    options.position.top += y;
                    GUI.window.position(elements.container,options.position);        
                } 
            }
            function resize(x,y){
                options.position.width += x;
                options.position.height += y;
                GUI.window.position(elements.container,options.position);        
                updateControls();           
            }
            function allowOverflow () {   // When controls are larger than the dialog allow overflow
                elements.container.className = elements.container.className.replace("overflowHide","overflowShow");
                overflowRequests += 1;
            }
            function hideOverflow () { 
                overflowRequests -= 1;
                if(overflowRequests <= 0){
                    elements.container.className = elements.container.className.replace("overflowShow","overflowHide");
                    overflowRequests = 0;
                }
            }
            function magneticDock(dialog){
                if(dialog.uName !== control.uName && dialog.dockedChild === undefined){
                    if(Math.abs(dialog.options.position.left - control.options.position.left) <DOCK_MAG_DISTANCEX){
                        var y = (dialog.options.position.top + dialog.options.position.height) - control.options.position.top;
                        if(y < DOCK_MAG_DISTANCEY_DOWN && y > -DOCK_MAG_DISTANCEY_UP){
                            dock(dialog);
                            return true;
                        }
                    }
                }
            }
            function mouseMove(event){
                if(event.type === "mouseup"){
                    GUI.events.releaseEvent("mousemove");
                    GUI.events.releaseEvent("mouseup");
                    GUI.events.releaseExclusive();
                    updateControls();
                    return;
                }
                deltaX = event.pageX-mouseX;
                deltaY = event.pageY-mouseY;
                mouseX = event.pageX;
                mouseY = event.pageY;
                if(options.docked){
                    if(Math.abs(event.pageX-dockDragX)> DOCK_TEAR_DISTANCE){
                        var parent = options.dockedParent;
                        undock();
                        if(options.dockedChild){
                            var child = options.dockedChild;
                            options.dockedChild.dock(parent);
                            child.updateDocking();
                        }
                        deltaX = event.pageX-dockDragX;
                        deltaY = event.pageY-dockDragY;
                        ignorNextFoldClick = true;
                    }else if(Math.abs(event.pageY-dockDragY)> DOCK_TEAR_DISTANCE){
                        undock();
                        deltaX = event.pageX-dockDragX;
                        deltaY = event.pageY-dockDragY;
                        ignorNextFoldClick = true;                    
                    }
                }else{
                    ignorClickDelay += 1;
                    if(ignorClickDelay > 4){
                        ignorNextFoldClick = true;
                    }
                    dockDragX = event.pageX;
                    dockDragY = event.pageY;
                    GUI.window.eachDialog(magneticDock);
                }
                move(deltaX,deltaY)
                updateControls();
            }
            function mouseResize(event){
                if(!control.folded){
                    if(event.type === "mouseup"){
                        GUI.events.releaseEvent("mousemove");
                        GUI.events.releaseEvent("mouseup");
                        GUI.events.releaseExclusive();
                        updateControls();
                        return;
                    }
                    deltaX = event.pageX-mouseX;
                    deltaY = event.pageY-mouseY;
                    mouseX = event.pageX;
                    mouseY = event.pageY;
                    resize(deltaX,deltaY)
                    updateControls();
                }
            }
            function titleMouseDown(event){
                if(!event.exclusive){
                    ignorClickDelay = 0;
                    GUI.events.captureEvent("mousemove",mouseMove);
                    GUI.events.captureEvent("mouseup",mouseMove);
                    GUI.events.exclusive();
                    mouseX = event.pageX;
                    mouseY = event.pageY;
                    dockDragX = event.pageX;
                    dockDragY = event.pageY;
                    updateControls();
                    focus();
                }            
            }
            function resizeMouseDown(event){
                if(!event.exclusive){
                    GUI.events.captureEvent("mousemove",mouseResize);
                    GUI.events.captureEvent("mouseup",mouseResize);
                    GUI.events.exclusive();
                    mouseX = event.pageX;
                    mouseY = event.pageY;
                    updateControls();
                    focus();
                }
            }
            function focus(){
                if(!GUI.window.currentTop || (GUI.window.currentTop && GUI.window.currentTop.name !== control.name)){
                    GUI.window.requestTop(control);            
                }
                return control;            
            }
            function mouseOver(event){
                if(!event.exclusive){
                    control.mouseOver = true;
                    if      (event.target.id === uName + "Close")  { GUI.image.updateSpriteSheetImage("closeResizeIconsDefault", 1, event.target) }
                    else if (event.target.id === uName + "Resize") { GUI.image.updateSpriteSheetImage("closeResizeIconsDefault", 3, event.target) }
                    else { elements.title.style.background = options.highlight }
                    focus();
               }
            }
            function mouseOut(event){
                control.mouseOver = false;
                if      (event.target.id === uName + "Close")  { GUI.image.updateSpriteSheetImage("closeResizeIconsDefault", 0, event.target) }
                else if (event.target.id === uName + "Resize") { GUI.image.updateSpriteSheetImage("closeResizeIconsDefault", 2, event.target) }
                else { elements.title.style.background = options.color }                
                if (!event.exclusive) {}
            }
            function setTitle (text) { elements.title.textContent = text }
            function getTitle (text) { return elements.title.textContent }
            function setState (state = {}) {
                const isDefault = (val) => typeof val === "string" && val.toLowerCase() === "default";
                if(state.color){        
                    if (isDefault(state.color)) { state.color = controlOptionsDefault.defaultColor }
                    options.color = state.color;
                    if(!control.mouseOver){ elements.title.style.background = options.color }
                }
                if (state.help) { setHelp(state.help) }
                if(state.text && state.title === undefined){  // text is an alias of title for this control.
                    state.title = state.text;
                    state.text = undefined;
                }            
                if (state.title) {
                    if (isDefault(state.title)) { state.title = (options.displayName ? options.displayName : options.name) }
                    setTitle( state.title );                
                }      
                if(state.highlight){
                    if (isDefault(state.highlight)) { state.highlight = controlOptionsDefault.highlight }
                    options.highlight = state.highlight;
                    if(control.mouseOver){ elements.title.style.background = options.highlight }
                }    
                if(state.showCloseIcon !== undefined){
                    options.showCloseIcon = state.showCloseIcon;
                    if(!state.showCloseIcon){
                        elements.close.style.display = "none";            
                    }else{
                        elements.close.style.display = "block";            
                    }
                }    
                if(state.showResizeIcon !== undefined){
                    options.showResizeIcon
                    if(state.showResizeIcon === false){
                        elements.resize.style.display = "none";            
                    }else{
                        elements.resize.style.display = "block";            
                    }
                }
                if(state.resizeIconHelp){
                    if (isDefault(state.resizeIconHelp)) { state.resizeIconHelp = controlOptionsDefault.resizeIconHelp }
                    elements.resize.title = state.resizeIconHelp;
                }
                if(state.closeIconHelp){
                    if (isDefault(state.closeIconHelp)) { state.closeIconHelp = controlOptionsDefault.closeIconHelp }
                    elements.close.title = state.closeIconHelp;
                }
                
            }  
            const dockingUpdateDirections = {
                up : 1,
                down : 0,
                both : 2,
            };
            function updateDocking(direction = dockingUpdateDirections.down){
                var top;
                if(options.docked){
                    if(!control.inTransition){
                        options.position.left = options.dockedParent.options.position.left;
                        top = options.position.top = options.dockedParent.options.position.top + options.dockedParent.options.position.height;
                        GUI.window.position(elements.container,options.position);  
                    }
                    /*if(top > options.position.top && !control.folded && !control.inTransition && (!options.dockedChild || (!options.dockedChild.folded && !options.dockedChild.inTransition))){
                        fold();
                    }
                    if(top > options.position.top && !options.dockedParent.folded){
                        options.dockedParent.foldup();  // force the fold in case there is a block on folding
                        if(options.dockedParent && direction === dockingUpdateDirections.down){
                            options.dockedParent.updateDocking(dockingUpdateDirections.up);
                        }
                    }
                    if(top > options.position.top && !options.dockedParent.inTransition && options.dockedParent.folded){
                        options.dockedParent.move(0,-(top - options.position.top));
                    }*/
                    if(options.dockedParent && direction === dockingUpdateDirections.up){
                        options.dockedParent.updateDocking(dockingUpdateDirections.up);
                    }
                    if(options.dockedChild && direction === dockingUpdateDirections.down){
                        options.dockedChild.updateDocking(dockingUpdateDirections.down);
                    }
                }           
            }
            function undock(){
                if(options.docked){
                    options.docked = false;
                    options.dockedParent.options.dockedChild = undefined;
                    options.dockedParent = undefined;
                }
                return control;            
                
            }
            function dock(dockParent){
                if (!dockParent) {return}
                if(dockParent.destroyed){
                    console.warn("Dialog attempting to dock with destroyed control.");
                    return;
                }
                undock();
                options.docked = true;
                options.dockedParent = dockParent;
                if(options.dockedParent.options.dockedChild === undefined){
                    options.dockedParent.options.dockedChild = control;
                }else{
                    var child = options.dockedParent.options.dockedChild;
                    child.undock();
                    options.dockedParent.options.dockedChild = control;
                    child.dock(control);
                }
                return control;            
                
            }
    /*        var dockUpdateNeededTimer;
            function needDockUpdate(){  // called when a child docked object needs update
                clearTimeout(dockUpdateNeededTimer);
                dockUpdateNeededTimer = setTimeout(updateDockingAll,0);
                
            }
            function updateDockingAll(){
                var next = options;
                while(next.dockedChild){
                    next.dockedChild.updateDocking();
                    next = next.dockedChild.options;
                }
            }
            function findTopDock(){
                var next = control;
                while(next.options.dockedParent && next.name !== next.options.dockedParent.name){
                    next = next.options.dockedParent;
                }
                return next;
            }*/
            function addControl(addedControl){
                controls[addedControl.name] = addedControl;
                $$(elements.controlContainer,[addedControl.elements.container]);
               /* if(options.commonState){
                    if(typeof addedControl.setState === "function"){
                        addedControl.setState(options.commonState);
                    }
                }*/
                addedControl.update();
                options.position.minHeight += addedControl.height + 1; //CONTROL_HEIGHT + 1;
                options.position.maxHeight += addedControl.height + 1; //CONTROL_HEIGHT + 1;
                control.height = options.position.minHeight;
                options.position.height = options.position.minHeight; 
            }
            function updateControlsMain(){
                updateControls();            
                if(options.onafterupdate){
                    options.onafterupdate(control);
                }
            }
            function updateControls(){
                if(options.dockedChild){
                    options.dockedChild.updateDocking();
                }
                
                for(var c of Object.keys(controls)){
                    if(controls[c] && typeof controls[c].update === "function" ){
                        controls[c].update();
                    }
                }
            }
            function update(){ //update on display refresh
                if(!options.building){
                    move();
                    GUI.animation.clearFrameEvent(updateEventHandle);
                    updateEventHandle = GUI.animation.addFrameEvent(updateControlsMain);
                }
                return control;            
            }
            function buildComplete(){
                options.building = false;
                update();
            }
            var  elements = {
                container :  $("$D ",uName,"dialog frame overflowHide"),
                close : $(GUI.image.getSpriteSheetImage("closeResizeIconsDefault", 0), { className : "close", id : uName + "Close", title : options.closeIconHelp }),
                title : $("$D "+name, uName+"Title", "title"),
                resize : $(GUI.image.getSpriteSheetImage("closeResizeIconsDefault", 2), { className : "resize", id : uName + "Resize", title : options.resizeIconHelp }),
                controlContainer : $("$D ",uName+"Content","content")
            }
            
            var zIndex = elements.container.style.zIndex = GUI.window.getNextZIndex();
            $$(elements.container, [
                elements.close,
                elements.title,
                elements.resize,
                elements.controlContainer,
            ]);
            if (!options.showCloseIcon) { elements.close.style.display = "none" }
            if (options.showResizeIcon === false) { elements.resize.style.display = "none" }
            GUI.events.bindEvent("click",elements.close,close);
            GUI.events.bindEvent("mouseover",elements.close,mouseOver);
            GUI.events.bindEvent("mouseout",elements.close,mouseOut);
            GUI.events.bindEvent("click",elements.title,fold);
            GUI.events.bindEvent("mousedown",elements.title,titleMouseDown);
            GUI.events.bindEvent("mousedown",elements.resize,resizeMouseDown);   
            GUI.events.bindEvent("mouseover",elements.resize,mouseOver);
            GUI.events.bindEvent("mouseout",elements.resize,mouseOut);
            GUI.events.bindEvent("mouseover",elements.title,mouseOver);   
            GUI.events.bindEvent("mouseout",elements.title,mouseOut);      
            function destroy () {
                GUI.animation.clearFrameEvent(updateEventHandle);            
                undock();
                if (options.dockedChild) { options.dockedChild.undock() }
                GUI.events.unbindEvent("click",elements.close);
                GUI.events.unbindEvent("mouseover",elements.close);   
                GUI.events.unbindEvent("mouseout",elements.close);                      
                GUI.events.unbindEvent("click",elements.title);
                GUI.events.unbindEvent("mousedown",elements.title);
                GUI.events.unbindEvent("mousedown",elements.resize);   
                GUI.events.unbindEvent("mouseover",elements.resize);   
                GUI.events.unbindEvent("mouseout",elements.resize);               
                GUI.events.unbindEvent("mouseover",elements.title);   
                GUI.events.unbindEvent("mouseout",elements.title);                      
                for(var c of Object.keys(controls)){
                    if(controls[c] && typeof controls[c].destroy === "function" ){
                        controls[c].destroy();
                        $R(elements.controlContainer,controls[c].elements.container);
                        controls[c].elements.container.innerHTML = "";
                        controls[c] = undefined;
                    }
                }
                controls.length = 0;
                elements.controlContainer.innerHTML = "";
                elements.close = undefined;
                elements.title = undefined;
                elements.resize = undefined;
                elements.controlContainer = undefined;
                elements.container.innerHTML = "";
                if(options.container){
                    $R(options.container,elements.container);
                }              
                elements.container = undefined;
                control.destroyed = true;
                GUI.window.removeDialog(control);
                function thrower(){ throw new ReferenceError("This dialog '"+name+"' has been destroyed.") };  // for debug
                function thrower(){ console.warn("This dialog '"+name+"' has been destroyed.") };
                Object.assign(control, {
                    resize : thrower,
                    move : thrower,
                    close : thrower,
                    open : thrower,
                    setTitle : thrower,
                    getTitle : thrower,
                    addControl : thrower,
                    focus : thrower,
                    fold : thrower, 
                    foldup : thrower, 
                    foldout : thrower, 
                    dock : thrower,
                    undock : thrower,
                    update : thrower,              
                    updateDocking : thrower,
                    buildComplete : thrower, 
                    onbeforeclose  : thrower, 
                    //onclosed : thrower,
                    onafterupdate : thrower,
                    onchanged  : thrower,
                    allowOverflow  : thrower, 
                    hideOverflow : thrower,
                });
            }
            var control = {
                type : GUI.controlTypes.dialog,            
                name : name,
                uName : uName,
                elements,
                folded : false,
                options,
                zIndex,
                height : CONTROL_HEIGHT + 4,
                inTransition : false,
                mouseOver : false,
                controls,
                /*Functions*/
                resize,
                move,
                close,
                open,
                setTitle,
                getTitle,
                addControl,
                focus,
                fold,  // toggles fold only if not in transition
                foldup, // folds up stopping any current fold transition. Will not do anything if a non fold transition is happening
                foldout, // folds out (opens) stopping any current fold transition. Will not do anything if a non fold transition is happening
                dock,
                undock,
                update,
               
                updateDocking,
                buildComplete, // call when done adding controls to the dialog. Note only needed if the options.building is true
                onbeforeclose : options.onbeforeclose, // fires at the start of closing
                onclosed : options.onclosed,
                onafterupdate : options.onafterupdate,
                onchanged : options.onchanged, // global change event if any of the control change their value state
                allowOverflow,  // When controls are larger than the dialog allow overflow
                hideOverflow,
            }
            setState(state);        
            GUI.window.addDialog(control);
            return control
        }
        return {
            create : createControl,
        };

    }());
/*    import {GUICSSInjector} from "http://localhost/MarksHome/GitHub/GrooverGUI/src/CSSInject.js";
    GUICSSInjector().add(`*/
   
    CSSInjector.add(`
    /***********************************************************************************************************************
    * Dialog                                                       
    ***********************************************************************************************************************/
    .frame {
        border: 1px solid #000;
        background: #060c13;
        z-index: 1000;
        overflow: hidden;    
    }
    .dialog {
        position : absolute;
        font: ${FONT_SIZE}px 'Lucida Grande', sans-serif;  
        text-shadow: 1px 1px 1px #000;    
    }
    .content {
        border: 1px solid #000;
        background: #232723;
        position : absolute;
        right: 2px;
        bottom: 2px;
        left: 2px;
        top: 15px;
        z-index: 1001;
        overflow: inhert;
    }
    .overflowHide {
        overflow: hidden;
    }
    .overflowShow {
        overflow: visible;
    }
    .title {
        background: #29b756;
        width: 100%;
        text-align: center;
        cursor: move;
        overflow: hidden;
        position: absolute;
        color: #fff;
        font-weight : 700;
        
    }
    .close {
        cursor : pointer;
        position: absolute;
        right : 0px;
        overflow: hidden;
        z-index: 1010;
        color : #999;
    }
    .close:hover {
        background : red;
    }
    .resize {
        position : absolute;
        right: 0px;
        bottom: 0px;
        cursor :nwse-resize;
        overflow: hidden;
        z-index: 1010;
    }
    /*control common*/
    .control {
        position: relative;
        right: 1px;
        height: ${CONTROL_HEIGHT}px;
        left: 1px;
        top: 1px;
        border: 1px solid #444;
        background: #000;
        display : flex;
    }
    `);
//    return dialog;
//}