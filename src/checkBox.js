    "use strict";
    const ICON_WIDTH = 24;
    const checkBox = (function(){
        const controlOptionsDefault = {
        }
        function createControl(name,options){
            var preColour;
            var iconWidth = ICON_WIDTH;
            var mouseOverFlag = false;
            var options = Object.assign({},controlOptionsDefault,options);
            function mouseOver (event) {mouseOverFlag = true}
            function mouseOut (event) {mouseOverFlag = false}

            function iconClicked(event){
                if(!event.exclusive){
                    dontUpdate = false;
                    changeIcon(!control.checked);
                    control.dialog.focus(); 
                }
            }
            function iconHover(event){
                if(!event.exclusive){
                    mouseOverFlag = true;
                    setIcons();
                    control.dialog.focus();
                }
            }        
            function iconHoverOut(event){
                if(!event.exclusive){
                    mouseOverFlag = false;
                    setIcons();
                }
            }

            function setIcons(){
                var imgs = options.images;
                if(options.spriteSheet){
                    
                    if (mouseOverFlag && imgs.onHoverIndex && imgs.offHoverIndex) {
                        if (control.checked) { GUI.image.updateSpriteSheetImage(imgs.onHoverSpriteSheetName, imgs.onHoverIndex, elements.icon) }
                        else { GUI.image.updateSpriteSheetImage(imgs.offHoverSpriteSheetName, imgs.offHoverIndex, elements.icon) }
                    } else {
                        if(control.checked){ GUI.image.updateSpriteSheetImage(imgs.onSpriteSheetName, imgs.onIndex, elements.icon) }
                        else{ GUI.image.updateSpriteSheetImage(imgs.offSpriteSheetName, imgs.offIndex, elements.icon) }
                    }

                }else{
                    if (mouseOverFlag) {elements.icon.src = control.checked ? imgs.onHover : imgs.offHover}
                    else {elements.icon.src = control.checked ? imgs.on : imgs.off}
                }
            }
            function update(dontCheckData, supressCallback){
                dontCallCallback = supressCallback;
                if(!dontCheckData){
                    if(options.data !== undefined){
                        dontUpdate = true;
                        if(typeof options.data[options.property] === "boolean"){
                            changeIcon(options.data[options.property]);
                        }
                    }
                }
              
                if (control.dirty) {setIcons()}
                control.dirty = false;
                dontCallCallback = false;
            }
            var dontUpdate = false;
            var dontCallCallback = false;
                
            function changeIcon(state){
                if(control.checked !== state){
                    control.checked = state;
                    if (options.data !== undefined) {
                        if(typeof options.data[options.property] === "boolean"){
                            options.data[options.property] = state;                        
                        }
                    }
                    if(!dontCallCallback){
                        control.dirty = true;
                        if (control.onchanged) { control.onchanged(control)}   
                        else if (control.dialog.onchanged) { control.dialog.onchanged(control) }   
                    }                
                    if (!dontUpdate) { update() }
                    dontUpdate = false;
                }
                return control;
            }
            
            function setState(state){
               if(state.onIconIndex){ options.images.onIndex = state.onIconIndex }
               if(state.offIconIndex){ options.images.offIndex = state.offIconIndex }
               if(state.onHoverIconIndex){ options.images.onHoverIndex = state.onHoverIconIndex }
               if(state.offHoverIconIndex){ options.images.offHoverIndex = state.offHoverIconIndex }
               if(state.text) { elements.displayName.textContent = state.text }       
               if(state.help) {
                   elements.displayName.title = state.help;
                   elements.container.title = state.help;
                   elements.icon.title = state.help;
               }
               
                
            }

            var uName = name + GUI.getUID();
            const elements = {
                container   :  $("$D ",uName,"control checkBox"),
                displayName : $("$D " + (options.displayName ? options.displayName : options.name), uName+"Annotation", "anotation"),
                icon : null,
            }

            
   
            if(options.images === undefined){
                options.images = {
                    on : options.imageOn,
                    off : options.imageOff,
                }
            } 
            if(options.images.on.indexOf("#SpriteSheet") === 0){
                options.spriteSheet = true;
                if(options.images.offHover){
                    var details = options.images.offHover.split(",");
                    options.images.offHoverIndex = details[2];
                    options.images.offHoverSpriteSheetName = details[1];
                    var details = options.images.onHover.split(",");
                    options.images.onHoverIndex = details[2];
                    options.images.onHoverSpriteSheetName = details[1];
                }
                
                var details = options.images.off.split(",");
                options.images.offIndex = details[2];
                options.images.offSpriteSheetName = details[1];
                
                var details = options.images.on.split(",");
                options.images.onIndex = details[2];
                options.images.onSpriteSheetName = details[1];
                
                elements.icon = GUI.image.getSpriteSheetImage(details[1],details[2]);
                elements.icon.className = "checkBoxImage";
                elements.icon.id = "img_"+uName;
                elements.icon.style.top = CONTROL_HEIGHT - elements.icon.height + "px";
            }else{
                elements.icon = $("img",{
                    src : options.on ? options.images.on : options.images.off,
                    className : "checkBoxImage",
                    id : "img_"+uName,
                })
            }

            elements.iconContainer = $$($("$N",uName + "_imgCont","checkBoxContainer"),[elements.icon  ]);
            GUI.events.bindEvent("click",elements.icon,iconClicked);  
            if(options.images.onHover || options.images.offHover ){
                GUI.events.bindEvent("mouseover",elements.icon,iconHover);                
                GUI.events.bindEvent("mouseout",elements.icon,iconHoverOut);           
            }
            $$(elements.container,[ elements.displayName, elements.iconContainer, ]);
            elements.displayName.style.cursor = "pointer"; 
            elements.container.style.cursor = "pointer";
            GUI.events.bindEvent("click",elements.displayName,iconClicked);              
            GUI.events.bindEvent("click",elements.container,iconClicked);              
            setState({help : options.help});



            function destroy(){

                GUI.events.unbindEvent("click",elements.icon);    
                if(options.images.onHover || options.images.offHover ){
                    GUI.events.unbindEvent("mouseover",elements.icon);                
                    GUI.events.unbindEvent("mouseout",elements.icon);           
                }                
                GUI.events.unbindEvent("click",elements.displayName);              
                GUI.events.unbindEvent("click",elements.container);              
                elements.container.innerHTML  = "";
                elements.displayName = undefined;
                elements.icon = undefined;
                elements.iconContainer = undefined;
            }
            var control = {
                type : GUI.controlTypes.checkBox,
                dialog : options.dialog,
                name ,
                uName,
                dirty : true,
                elements,
                update,
                setValue(value){
                    changeIcon(value == true);  // meant to be == not ===
                    return this;
                },
                getvalue(){
                    return this.checked;
                },
                setState,
                checked : options.checked,
                onchanged : options.onchanged ? options.onchanged : null,
                destroy,
                options,
                height : CONTROL_HEIGHT + 1,
            }
            if (options.dialog !== undefined) {options.dialog.addControl(control)}        
            return control;
        }
        return {create : createControl}
    }())
/*    import {GUICSSInjector} from "http://localhost/MarksHome/GitHub/GrooverGUI/src/CSSInject.js";
    GUICSSInjector().add(`*/
    CSSInjector.add(`
    /***********************************************************************************************************************
    * checkBox                                                       
    ***********************************************************************************************************************/
    .checkBox {
        top : 1px;
    }
    .checkBoxContainer{
        float: right;
        color : white;
        position: absolute;    
        top : 0px;
        right : 17px;
        text-align : left;
        display: flex;
        -webkit-touch-callout: none;

        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;       
    }
    .checkBoxImage {
        cursor : pointer;
        position: absolute; 
       /* left : ${ICON_WIDTH}px;*/
        top : -7px;
    }
    `);
//    return checkBox;
//}