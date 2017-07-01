/*export dataGUI = {
    import {GUIMain} from "http://localhost/MarksHome/GitHub/GrooverGUI/src/GUI.js";
    const GUI = GUIMain();*/
    
    const dataGUI = {
        reserved : ["name","onclose","onchanged","onbeforeclose","onafterupdate","dialogState"],
        
        createDialog(data,extras){
            var keys = Object.keys(data).filter(name=>name[0] !== "_" && dataGUI.reserved.indexOf(name) === -1);
            var name = data.name ? data.name : "dialog";
            var ui = dialog.create(name,{
                state : data.dialogState, 
                onbeforeclose : data.onbeforeclose,
                onchanged : data.onchanged,
                onclosed : data.onclose,
                onafterupdate : data.onafterupdate,
                container : "#GUI-container",   
                data : data,
                
            });
            data._controls = ui.controls;
            data._dialog = ui;        
            var commonState = {};
            if(data.dialogState && data.dialogState.commonState){
                commonState = data.dialogState.commonState;
                data.dialogState.commonState = undefined;
            }
            ui.building = true;
            keys.forEach(key=>{
                const setUpKeyboardBinding = (data,info) => {
                    ["", "Left", "Mid", "Right"].forEach(but=>{
                        if( typeof data["key" + but] === "string"){
                            var keyMods;
                            if (typeof data["keyMod" + but] === "string") { keyMods = data["keyMod" + but].split(",") }
                            info["keyboardShortcut"+but] = GUI.events.getKeyName(data["key" + but], keyMods) ;
                            if (info.help) {
                                if (keyMods) {  info.help += "\n[" + keyMods.join("") + "" + data["key" + but] + "]" }
                                else { info.help += "\n[" + data["key" + but] + "]" }
                            }
                        }    
                    });
                    if (data.keyboardPreventDefault) { info.keyboardPreventDefault = data.keyboardPreventDefault }
                }                    
                var type;
                var  info;
                type = typeof data[key];
                info = Object.assign({},commonState,{
                    type,
                    dialog : ui,
                    name : key,
                    displayName : GUI.utilities.nameToReadable(key),
                    help : data["_"+key] && data["_"+key].help ? data["_"+key].help : "",
                    property : key,
                    data : data,
                });
                if (type === "string") {
                    if(data[key].indexOf("##") === 0){
                        var dat = data[key].substr(2);
                        var setting = dat.split(",");
                        if (!isNaN(setting[0].trim())){
                            var dat = data[key].substr(2);
                            info.type = "slider";
                            data[key] = Number(setting.shift().trim());
                            info.min = Number(setting.shift().trim());
                            info.max = Number(setting.shift().trim());
                            info.step = Number(setting.shift().trim());
                            if(setting[0].trim().toLowerCase() === "ticks"){
                                setting.shift();
                                info.showTicks = true;
                            }
                                
                            info.help = setting.join(",");
                        } else if(setting[0].trim() === "true" || setting[0].trim() === "false"){
                            info.type = "checkBox";
                            info.images = {
                                    on : "#SpriteSheet,checkBoxDefault,1",
                                    off : "#SpriteSheet,checkBoxDefault,0",
                                };
                            data[key] = info.checked = setting.shift().trim() === "true";
                            info.help =  setting.join(",").trim();
                        }
                    } else if (data[key].indexOf("**") === 0) {
                        var dat = data[key].substr(2);
                        var setting = dat.split("**");
                        data[key] = setting[0];  // the value can be empty
                        info.placeholder = setting[1] ? setting[1] : "Enter text";
                        info.help = setting[2] ? setting[2] : "";
                        info.type = "stringInput";
                    } else if (data[key].indexOf("==") === 0) {
                        
                        var dat = data[key].substr(2);
                        var setting = dat.split(",");
                        //data[key] = setting[0];  // the value can be empty
                        info.displayName = data[key] = setting.shift();
                        info.height = setting.shift();
                        if(setting[0][0] === "#"){
                            info.background = setting.shift();
                        }
                        info.help = setting.length ? setting.join(",") : "";
                        info.type = "separator";
                    } else {
                        return;
                    }
                } else if (type === "number") {
                    info.type = "slider";
                } else if (type === "boolean") {
                    info.type = "checkBox";
                    info.images = {
                            on : "#SpriteSheet,checkBoxDefault,1",
                            off : "#SpriteSheet,checkBoxDefault,0",
                        };
                    info.checked = data[key];
                    help = data["_"+key] && data["_"+key].help ? data["_"+key].help : "";
                    
                }else if (Array.isArray(data[key])) {
                    if (typeof data[key][0] === "boolean"){
                        /* not sure if I will do this one */
                    }else {
                        if(data[key].length < 3){
                            info.type = "toggleString";      
                            info.states = data[key];
                        }else{
                            info.items = data[key];
                            info.type = "selection";
                        }
                    }
                }else if(type === "object"){
                    var subKeys = Object.keys(data[key]).filter(subKey=>subKey[0] !== "_");
                    if(subKeys.length > 0){
                        if(typeof data[key][subKeys[0]] === "boolean"){
                            info.type = "checkBox";
                            info.images = {
                                on : "#SpriteSheet,checkBoxDefault,1",
                                off : "#SpriteSheet,checkBoxDefault,0",
                            };
                            name = subKey;
                            info.checked = data[key][subKey];
                            info.help = GUI.utilities.nameToReadable(subKey);
                        }else if(typeof data[key][subKeys[0]] === "function"){
                            info.type = "buttons";
                            info.buttons = [];
                            subKeys.forEach(subKey => {
                                var helpKey = "";
                                var subInfo;

                                info.buttons.push(subInfo = {
                                    name : subKey,
                                    displayName : GUI.utilities.nameToReadable(subKey),
                                    asIcon : typeof data[key]["_"+subKey] === "object" &&  data[key]["_"+subKey].icon ? data[key]["_"+subKey].icon : undefined,
                                    onclick : data[key][subKey].bind(data),
                                    fireOnMouseDown : typeof data[key]["_"+subKey] === "object" &&  data[key]["_"+subKey].fireOnMouseDown ? true : false,
                                    help : (typeof data[key]["_"+subKey] === "object" && data[key]["_"+subKey].help ? data[key]["_"+subKey].help : GUI.utilities.nameToReadable(subKey)),
                                });
                                if(typeof data[key]["_"+subKey] === "object"  && typeof data[key]["_"+subKey].key === "string"){
                                    setUpKeyboardBinding(data[key]["_"+subKey],subInfo);
                                }
                                
                            });
                            
                        }
                    }
                }else if(type === "function"){
                    info.buttons = [{
                        name : key,
                        displayName : info.displayName,
                        onclick : data[key].bind(data),
                    }]
                    info.type = "buttons";
                }
                if(data["_"+key] !== null && !Array.isArray(data["_"+key]) && typeof data["_"+key] === "object"){
                    info = Object.assign(info,data["_"+key]);  
                    setUpKeyboardBinding(data["_"+key],info);
                    
                }
                
                if(info.type === "slider"){
                    GUI.UIs.slider.create(key,info);
                }else if(info.type === "iconGroup"){
                    GUI.UIs.iconGroup.create(key,info);
                }else if(info.type === "checkBox"){
                    GUI.UIs.checkBox.create(key,info);                    
                }else if(info.type === "toggleString"){
                    GUI.UIs.toggleString.create(key,info);
                }else if(info.type === "stringInput"){
                    GUI.UIs.stringInput.create(key,info);   
                }else if(info.type === "separator"){
                    GUI.UIs.separator.create(key,info);   
                }else if(info.type === "selection"){
                    GUI.UIs.selection.create(key,info);
                }else if(info.type === "buttons"){
                    GUI.UIs.buttons.create(key,info);
                }
            });
            if(extras !== undefined){
                if(extras.toLowerCase() === "okcancel" || extras.toLowerCase() === "cancelok"){
                    var butts = [{
                            name : "cancel",
                            displayName : "Cancel",
                            onclick(event){
                                ui.close(event);
                            }
                        },{
                            name : "ok",
                            displayName : "OK",
                            onclick(event){
                                ui.close(event);                            
                            }
                        }
                    ];
                }
                if(extras.toLowerCase() === "ok"){
                    var butts = [{
                            name : "ok",
                            displayName : "OK",
                            onclick(event){ui.close(event)}
                        }
                    ];
                }
                GUI.UIs.buttons.create("confirmExit",{name:name,dialog:ui,buttons:butts});
            }

            ui.buildComplete();        
            return ui;
        }  
    }
    GUI.dataGUI = dataGUI;
    GUI.start();
/*    return dataGUI;
}*/