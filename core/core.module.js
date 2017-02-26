angular.module("core", [])    
	.service("popup", ["$document", "$rootScope", "$timeout", function($document, $rootScope, $timeout){      	
		return{
			show: function(props) {
            //$rootScope.popupInner = function() {return "<div></div>"}; 
            if (!props || typeof props != "object") props = {};   
            // заглавие окна          
            props.title ? $("#modal-title").text(props.title).show() : $("#modal-title").text("").hide();
            // кнопка "Сохранить"           
            props.save ? $("#modal-save").show(): $("#modal-save").hide(); 
            // название кнопки "Сохранить"
            props.saveTitle ? $rootScope.popupSaveButtonText = props.saveTitle: $rootScope.popupSaveButtonText = "Сохранить";
            // кнопка "Закрыть"
            props.closeTitle ? $("#modal-closebtn").text(props.closeTitle) :  $("#modal-closebtn").text("Закрыть");
            // запрет ввода с клавиатуры
            props.keyboardBlock ? $rootScope.keyboardBlock(true) : $rootScope.keyboardBlock(false);
            // размер          
            var cont = $("#modal-dialog");
            if (props.size) {            
               if (props.size == "small") {
                  $(cont).addClass("small-size").removeClass("large-size").removeClass("middle-size");
               } else if (props.size == "middle") {
                  $(cont).addClass("middle-size").removeClass("large-size").removeClass("small-size");
               }
            } else {        
               $(cont).addClass("large-size").removeClass("small-size").removeClass("middle-size");
            }
            $("#modal").fadeIn(100, this.size);
			},
			hide: function(param) {           
            if (param) {
               $("#modal").hide();      
            } else {               
               $("#modal").fadeOut(200);                  
            }
            $("#modal-body").css("height", "auto").removeClass('oy');		 
            // очистка по умолчанию
            $rootScope.documentText = "";              
            $rootScope.documentName = "";       
            // разблокировка клавиатуры по умолчанию
            $rootScope.keyboardBlock(false);   
            $rootScope.popupInner = function() {return "<div></div>"}              
			},
         // прокрутка внутреннего контейнера всплывающего окна
         size : function() {
            w = $(window).height(),
               cont = $("#modal-dialog"),               
               header = $("#modal-header").height() + parseInt($("#modal-header").css("padding-top")) + parseInt($("#modal-header").css("padding-bottom")),
               body = $("#modal-body"),
               body_h = $("#modal-body").height(),
               footer = $("#modal-footer").height() + parseInt($("#modal-footer").css("padding-top")) + parseInt($("#modal-footer").css("padding-bottom"));           
            if (w < (header + body_h + footer + 60)) {
               $(body).height(w - header - footer - 100).addClass('oy');
            } else {
               $(body).css("height", "auto").removeClass('oy');
            }
         },
         // сообщение об ожидании загрузки
         longTime : function(params) {     
            var _popup = {title: "Результат загрузки", size: "small", text: "<div class='text-center'><img src='img/loading.gif' />  Идёт загрузка</div>"};
            if (params) {
               if (params.onlyLoader) _popup = {title: "Результат загрузки", size: "small", text: "<div class='text-center'><img src='img/loading.gif' /></div>"};
            }                                     
            return ($timeout(function() { 
               var self = this;             
               // здесь использовать $rootScope вместо this, т.к. есть текст
               $rootScope.popupShow(_popup);        
               self.isLongTime = true;              
            }, 2000))
         },
         // ошибка
         error : function(response) {       
            // здесь использовать $rootScope вместо this, т.к. есть текст
            var statusText = response.statusText;
            if (statusText.length > 0) statusText = " " + statusText;
            $rootScope.popupShow({title: "Ошибка!", size: "small", text: "<div class='alert alert-danger'>Сервер недоступен!" + statusText + "</div>"});            
         },  
         // запись ошибки в файл с временем записи
         saveError : function(err) {
            var _d = new Date(),
               _seconds = _d.getSeconds(),
               _minutes = _d.getMinutes(),
               _hours = _d.getHours(),
               _date = _d.getDate(),
               _month = _d.getMonth() + 1;
            if (_seconds < 10) _seconds = "0"+ _seconds;
            if (_minutes < 10) _minutes = "0" + _minutes;
            if (_hours < 10) _hours = "0"+ _hours;
            if (_date < 10) _date = "0" + _date;
            if (_month < 10) _month = "0" + _month;
            err += "\r\n" + _hours + ":" + _minutes + ":" + _seconds + "  " + _date + "." + _month + "." + _d.getFullYear();  
            return {
               errorText: err,
               seconds: _seconds,
               minutes: _minutes,
               hours: _hours,
               date: _date,
               month: _month,
               year: _d.getFullYear()
            }
         }

		}
	}])
   .service("header", ["$rootScope", "popup", function($rootScope, popup){
      return{
         dates: function() {
            return {
               currentDay: {
                  bootstrapClass: "btn btn-default",
                  disabled: 0,
                  view: "",
                  text: "Текущий операционный день",
                  id: 1
               },
               chooseDay: {
                  bootstrapClass: "btn btn-default",
                  disabled: 0,
                  view: "",
                  text: "Задать день",
                  id: 2
               },
               choosePeriod: {
                  bootstrapClass: "btn btn-default",
                  disabled: 0,
                  view: "",
                  text: "Задать период",
                  id: 3
               }
            }
         },
         buttonAction: function(id, paramsDates) {
            var getDate = {},
               buttons = this.dates();
            if (id == 1) {
               getDate.startDate = new Date().toISOString().substring(0, 10);           
               buttons.currentDay.disabled = 1;                 
            } else if (id == 2) {
               popup.show({title: "Выбрать день", size: "small", keyboardBlock: true});       
               this.chooseDay();
            } else if (id == 3) {
               popup.show({title: "Выбрать период", size: "small", keyboardBlock: true});                
               this.choosePeriod();                  
            }
            return ({date: getDate, buttons: buttons})
         },
         chooseDay: function() {
            var html = "<div class='row'><div class='col-md-offset-3 col-md-6'><datepicker date-format='yyyy-MM-dd' selector='form-control'><div class='input-group'><input class='form-control' ng-change='$root.changeDate(selectedDate)' ng-model='$root.selectedDate' placeholder='Выберите дату' type='text' /><span class='input-group-addon'><i class=''></i></span></div></datepicker></div></div>";      
            $rootScope.popupInner = function() {return html}         
         },
         choosePeriod: function() {           
            var html = "<div class='row'><div class='col-md-5'><datepicker date-format='yyyy-MM-dd' selector='form-control'><div class='input-group'><input class='form-control' ng-change='$root.changeDate($root.selectedStart, \"start\")' ng-model='$root.selectedStart' placeholder='Начало периода' type='text' /><span class='input-group-addon'><i class=''></i></span></div></datepicker></div><div class='col-md-offset-2 col-md-5'><datepicker date-format='yyyy-MM-dd' selector='form-control'><div class='input-group'><input class='form-control' ng-change='$root.changeDate($root.selectedEnd, \"end\")' ng-model='$root.selectedEnd' placeholder='Конец периода' type='text' /><span class='input-group-addon'><i class=''></i></span></div></datepicker></div></div><div class='row' ng-class='!$root.choosePeriodAlert ? \"hidden\" : \"\" '><div class='col-md-12 text-center'><div class='text-danger'>Вторая дата должна быть позже первой!</div></div></div>";      
            $rootScope.popupInner = function() {return html};          
         },         
         changeDate: function(date, params, buttons, paramsDates) {  
            var getDate = {};              
            // период                     
            if (params) {                          
               if (params == "start") paramsDates[0] = date;
               if (params == "end") paramsDates[1] = date;                 
               // обе даты выбраны
               if (paramsDates[0].length > 0 && paramsDates[1].length > 0) {
                  var start  = parseInt(paramsDates[0].slice(0,4) + paramsDates[0].slice(5,7) + paramsDates[0].slice(8,10)),
                     end  = parseInt(paramsDates[1].slice(0,4) + paramsDates[1].slice(5,7) + paramsDates[1].slice(8,10));              
                  if (start > end) {
                     $rootScope.choosePeriodAlert = true;
                     return false;
                  }
                  $rootScope.choosePeriodAlert = false;    
                  getDate = {
                     startDate: paramsDates[0],
                     endDate: paramsDates[1]
                  };
                  buttons = this.dates();
                  // выделение кнопки
                  buttons.choosePeriod.view = "active";
                  buttons.choosePeriod.text = "C " + paramsDates[0] + " по " + paramsDates[1];     
                  // сбрасываем сохранённые значения
                  if (paramsDates[0].length > 0 && paramsDates[1].length > 0) paramsDates = ["", ""];                      
                  popup.hide();                 
               }
            // одна дата
            } else {          
               getDate = {
                  startDate: date                  
               };          
               // сброс кнопок
               buttons = this.dates();
               // выделение кнопки
               buttons.chooseDay.view = "active";
               buttons.chooseDay.text = date;                  
               popup.hide();
            }
            return {
               buttons: buttons,
               date: getDate,
               dates: paramsDates
            }
         },
         isActive: function(location) {
            return location === $location.path();
         }
      }
   }])
   .service("sort", function(){
      return{
         sort: function(props, prop) {
            var sortClasses = {},
               orderProp;
            if (typeof props[prop] === "undefined") {
               props[prop] = [];
               props[prop][0] = true;
               props[prop][1] = "asc";
               sortClasses[prop] = "asc";
            } else {                 
               props[prop][0] = !props[prop][0];   
               (props[prop][1] == "asc") ? props[prop][1] = "desc" : props[prop][1] = "asc";  
            } 
            sortClasses[prop] = props[prop][1];
            orderProp = (props[prop][0] ? "" : "-") + prop;  
            return ({sortClasses: sortClasses, orderProp: orderProp})
         }
      }
   })
	.service("parseDoc", ["$rootScope", "popup", function($rootScope, popup){
		return{
			parse: function(doc){                
				
	         var parseXml = function(xmlStr) {   
               if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {             
                  var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                  xmlDoc.async = "false";
                  xmlDoc.loadXML(xmlStr);
                  return xmlDoc;    
               } else if (typeof window.DOMParser != "undefined") {
                  // IE выпадает в ошибку, и дальнейшая работа прерывается, поэтому сразу обрабатываем  и выводим содержимое
                  try {
                     return (new window.DOMParser() ).parseFromString(xmlStr, "text/xml"); 
                  } catch(e) {                     
                     $rootScope.popupInner = function() {return doPlain(doc)};
                     throw new Error("XML parse error");                    
                  }                   
               } else {
                  throw new Error("No XML parser found");
               }
            }            

            var xmlDoc = parseXml(doc),
               tree = "",   // дерево узлов XML  
               heading = "",  // заголовок XML
               lastNode = "",    
               step = 1;             

            // если xml, рисуем шапку, либо отображаем сообщение об ошибке
            var ifXml = function(doc) {               
               if (doc.slice(0,5) == "<?xml") {               
                  var n = doc.indexOf(">");                
                  heading = "<span class='xml-tag'> &lt; </span>" + doc.slice(1,n) + " ><br/>";      
                  return true                         
               } else {               
                  return false
               }
            }              

            // флаг наличия ошибочного узла в XML
            var parseError = false;
            var build = function(xmlDoc) { 
               // нужно для отрисовки тегов с содержимым типа <tag>text</tag>, без отступов
               var _step = 1;              
               // выкидываем текстовые узлы из набора
               var nodes = [];
               for (var k=0; k < xmlDoc.childNodes.length; k++) {                   
                  if (xmlDoc.childNodes[k].nodeName.indexOf("#text") > -1) continue;                   
                  if (xmlDoc.childNodes[k].nodeName == "parsererror") {                                         
                     parseError = true;
                     return false 
                  } else {
                     nodes.push(xmlDoc.childNodes[k])
                  }           
               }             
               var doSpaces = function() {
                  var spaces = "";
                  for (var z=1; z < step; z++) {                  
                     spaces = spaces + "&nbsp;&nbsp;&nbsp;";   
                  }
                  return spaces;
               }
               for (var j=0; j < nodes.length; j++) {               
                  var el = nodes[j],
                  	spaces = doSpaces(),
                     t = $(el).text(); // здесь есть проблемы с innerHTML в IE, поэтому используем jQuery                                                        
                  tree = tree + spaces + "<span class='xml-tag'> &lt; </span>" + el.nodeName;     
                  if (el.attributes) {
                  	for (var i=0; i < el.attributes.length; i++) {     
                    	 	tree = tree + " <span class='xml-attr-name'>" + el.attributes[i].nodeName + "=</span><span class='xml-attr'>\"" + el.attributes[i].value + "\"</span>"
                  	}
                  }                     
                  if (el.childNodes.length > 0) {                   
                     if (el.childNodes.length == 1 && t && t.length > 0) {                     
                        tree = tree + " >" + t;
                        _step = step;
                        step = 0;
                        build(el);
                        spaces = doSpaces();
                        tree = tree + spaces + "<span class='xml-tag'>&lt;/</span>" + el.nodeName + "><br/>";      
                        step = _step;       
                     } else {
                        tree = tree + " ><br/>";
                        step++;              
                        build(el);
                        spaces = doSpaces();
                        tree = tree + spaces + "<span class='xml-tag'>&lt;/</span>" + el.nodeName + "><br/>";    
                     }                     
                  } else {                                  
                     if (t && t.length > 0) {                       
                        tree = tree + " >" + t + "<br/>"
                     }
                     tree = tree + "<span class='xml-tag'> /></span><br/>";
                  }           
                  if (j == (nodes.length - 1)) {step--;}             
               }                  
            }

            // пробуем построить дерево, при ошибке процесс будет прерван, влаг parseError станет true           
            build(xmlDoc);              
            // может выводить либо дерево XML, либо содержимое не-XML
            // не-XML          
            if (!ifXml(doc)) {               
               $rootScope.popupInner = function() {return doPlain(doc)} 
            // правильный XML
            } else if (ifXml(doc) && !parseError) {             
               $rootScope.popupInner = function() {return heading + tree}
            // XML с ошибкой
            } else {              
               $rootScope.popupInner = function() {return doPlain(doc)}
               //doError();
            }  

            // делаем вывод документа как есть
            function doPlain(doc) {            
               var _doc = doc.replace(/</g, " &lt; ");
               _doc = _doc.replace(/>/g, " &gt; ");              
               return _doc
            }

            function doError() {
               popup.show({title: "Ошибка!", size: "small", save: false}); 
               $rootScope.popupInner = function() {return ("<div class='alert alert-danger'>Файл не является корректным XML-документом</div>")}            
            }             
			}         
		}
		
	}]) 
   .service("ids", function(){
      return {
         pos: "",
         id: ""
      }
   })
   .service("requests", function(){
      return { 
         /*getCurrentUser : "/x3x/api/getCurrentUser",       
         table1get : "/x3x/api/prepareInputFiles",         
         table1post : "/x3x/api/prepareInputFiles",
         table2get : "/x3x/api/getLoadedFiles",
         table2getFile : "/x3x/api/getInputFile",
         table3get : "/x3x/api/getLoadedED230",
         table3getFile : "/x3x/api/getED230",
         table3getXml : "/x3x/api/getED230Xml",
         table3editDocument : "/x3x/api/updateED230",
         table3editStatus : "/x3x/api/setStatusED230",
         table4get : "/x3x/api/exportED230",
         table4post : "/x3x/api/exportED230",
         table5get : "/x3x/api/inputCbrFiles",
         table5post : "/x3x/api/inputCbrFiles",
         table6get : "/x3x/api/getCbrLoadedFile",
         table6getFile : "/x3x/api/getED231Xml",
         table7get : "/x3x/api/getED230Control",
         table7filesGet : "/x3x/api/getED231Files",
         table7register1get : "/x3x/api/getED231RegisterList",
         table7register2get : "/x3x/api/getED231RegisterList",
         table7register3get : "/x3x/api/getED231RegisterList",
         table7statusesGet : "/x3x/api/getED231RegisterList",
         table7editStatus : "/x3x/api/updateED231RegisterStatus"*/ 
         getCurrentUser : "data/getCurrentUser.json",       
         table1get : "data/prepareInputFiles.json",         
         table1post : "data/prepareInputFilesPost.json",
         table2get : "data/getLoadedFiles.json",
         table2getFile : "data/getInputFile.xml",
         table3get : "data/getLoadedED230.json",
         table3getFile : "data/getED230.json",
         table3getXml : "data/getED230.xml",
         table3editDocument : "data/updateED230.json",
         table3editStatus : "data/setStatusED230.json",
         table4get : "data/exportED230.json",
         table4post : "data/exportED230Post.json",
         table5get : "data/inputCbrFiles.json",
         table5post : "data/inputCbrFilesPost.json",
         table6get : "data/getCbrLoadedFile.json",
         table6getFile : "data/getED231.xml",
         table7get : "data/getED230Control.json",
         table7filesGet : "data/getED231Files.json",
         table7register1get : "data/getED231RegisterList1.json",
         table7register2get : "data/getED231RegisterList2.json",
         table7register3get : "data/getED231RegisterList3.json",
         table7statusesGet : "data/getED231RegisterList.json",
         table7editStatus : "data/updateED231RegisterStatus.json"         
      }
   });