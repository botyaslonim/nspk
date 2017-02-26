"use strict";

angular.
   module("table3").
   component("table3", {
      templateUrl: "tables/table3/table3.template.html",
      controller: ["$http", "$scope", "$routeParams", "$timeout", "$window", "popup", "parseDoc", "sort", "header", "requests",
      	function Table3Controller($http, $scope, $routeParams, $timeout, $window, popup, parseDoc, sort, header, requests) {

           	var self = this,
               props = {}, // объект со значениями сортировок (верх-низ) по каждому из столбцов
               sortClasses = {}, // классы для визуального отображения сортировки
               paramsDates = ["", ""], // даты в выбранном периоде
               nowDate = new Date().toISOString().substring(0, 10), // сегодняшняя дата
               getDate = {
                  startDate: nowDate
               }, 
               currentDoc = {},  // объект, куда записывается редактируемый ED230 до сохранения всех изменений
               currentDocCopy = {},  // копия объекта, записывается редактируемый ED230, кроме удалённых позиций; нужно для возврата к редактированию после проверки сервером
               ed230posQuant = 0, // количество позиций в файле ED230
               ed230nettoC = 0, // нетто кредитовых позиций в файле ED230
               ed230nettoD = 0, // нетто дебитовых позиций в файле ED230
               cachedHeader = "", // сохраняемая шапка формы редактирования ED230
               item = {},
               newComment = "";

            // до загрузки данных не показываем заголовки таблицы
            self.table = null;

            // модели
            self.statusChanging = {}; 
   	         
            // сортировки      
            self.sort = function(prop) {               
               var _s = sort.sort(props, prop);
               sortClasses = _s.sortClasses;              
               this.orderProp = _s.orderProp;    
            }     
            // геттер класса визуального отображения сортировки
            self.sortClass = function(prop) {
               return sortClasses[prop]
            }    

            // просмотр документа
            self.getDocument = function(id, name) {   
               // показывает предупреждение, если загрузка задерживается            
               var timer = popup.longTime();                                                              
               $http.get(requests.table3getXml, {params: {id: id}}).then(
                  // success
                  function(response) { 
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload(); 
                     $timeout.cancel(timer);                      
                     var doc = response.data;
                     $scope.$root.documentText = doc;               
                     $scope.$root.documentName = name;              
                     popup.show({title: "Содержимое документа", save: true});                      
                     parseDoc.parse(doc);                
                  },
                  // error
                  function(response) {                    
                     $timeout.cancel(timer);    
                     popup.error(response);
                  }
               )                        
            }            

            // редактирование полей документа
            $scope.$root.ed230save = function() {
               // редактирование разрешено только для роли администратора
               if ($scope.$root.userRole != "ADMIN") return;
               // показывает предупреждение, если загрузка задерживается            
               var timer = popup.longTime();  
               $http.post(requests.table3editDocument, currentDoc).then( 
                  // success
                  function(response) { 
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload(); 
                     $timeout.cancel(timer);                  
                     var error = response.data.errorList,
                        html = "<div class='row'><div class='col-md-12'><h4>Возникли ошибки при редактировании файла " + currentDoc.fileName + "</h4></div></div><div class='row'><div class='col-md-12'><p class='alert alert-danger'>";                
                     if (error.length > 0) {                        
                        popup.show({title: "Результат редактирования", size: "medium", save: true, saveTitle: "Сохранить ошибки в файл"}); 
                        var _err = "Ошибки при редактировании файла " + currentDoc.fileName + "\r\n\r\n";      
                        for (var i=0; i < error.length; i++) {
                           html += i + 1 + ") " + error[i] + "<br/>";
                           _err += i + 1 + ") " + error[i] + "\r\n";
                        }                            
                        _err = popup.saveError(_err);                  
                        $scope.$root.documentText = _err.errorText;               
                        $scope.$root.documentName = "edit-error_" + _err.year + "-" + _err.month + "-" + _err.date + "--" + _err.hours + "-" + _err.minutes + "_" + currentDoc.fileName.slice(0, currentDoc.fileName.indexOf(".")); 
                        $scope.$root.popupSaveButtonFormat = "text";                       
                        /*if (error == "ERROR") {
                           _err = "Ошибка"
                        } else if (error == "NOBIK") {
                           _err = "В файле ED230 отсутствует значение БИК"
                        } else if (error == "BIKERROR") {
                           _err = "В файле ED230 указано неизвестное (согласно справочнику x3x) значение TRANSFER_BIC для нетто-позиции"
                        } else if (error == "NETTOERROR") {
                           _err = "Нулевая нетто-позиция в файле ED230"
                        } else if (error == "DATEFORMATERROR") {
                           _err = "Поля BeginProcessingDate и/или EndProcessingDate не соответствует формату yyyy-MM-dd"
                        } else if (error == "SUMMERROR") {
                           _err = "Сумма позиций с признаком Дебета не равна сумме позиций с признаком Кредита"
                        } else if (error == "ITEMIDERROR") {
                           _err = "Значение RegisterItemID не уникально (уже использовалось ранее)"
                        } else {
                           _err = "Ошибка"
                        }*/
                        html += "<br/>Изменения не сохранены!</p></div></div><div class='row'><div class='col-md-6'><a href='' class='btn btn-success' ng-click='$root.ed230errorReturn()'>Вернуться к редактированию файла</a></div><div class='col-md-6 text-right'><a href='' class='btn btn-danger' ng-click='$root.popupClose()'>Отменить изменения</a></div>"
                     } else {
                        popup.show({title: "Результат редактирования", size: "small", save: false}); 
                        html += "<p class='alert alert-success'>Изменения успешно сохранены</p>";
                        self.getData();
                     }
                     html += "</div></div>";          
                     $scope.$root.popupInner = function() {return html};               
                  },
                  // error
                  function(response) {                    
                     $timeout.cancel(timer);    
                     popup.error(response);
                  }                  
               )
            }  

            // возвращаемся к редактированию документа после публикации текста ошибки при сохранении
            $scope.$root.ed230errorReturn = function() {
               popup.hide(true);
               popup.show({title: "Редактирование ED230", save: false, closeTitle: "Отмена"});
               // восстанавливаем удалённые элементы для повторного редактирования             
               currentDoc = JSON.parse(JSON.stringify(currentDocCopy));          
               self.build(true);    
            }


            // удаление позиции путём отметки в чекбоксе в ряду этой позиции
            $scope.$root.ed230positionDelete = function(num) {             
               delete currentDoc.ed230ItemDtoList[num]; 
               var o = [];              
               for (var i=0; i < currentDoc.ed230ItemDtoList.length; i++) {
                  if (currentDoc.ed230ItemDtoList[i]) o.push(currentDoc.ed230ItemDtoList[i])
               }              
               currentDoc.ed230ItemDtoList = o;  
               // удаляем признак "отмечено" для удаляемой позиции; признак присваивается позициям в порядке следования
               $scope.$root.ed230rowDelete[num] = false;                         
               self.build(false);
            }

            // добавление позиции
            $scope.$root.ed230positionAdd = function() {             
               currentDoc.ed230ItemDtoList.push({bic: "0", dc: "D", registerItemId: "0", sum: "0"});
               currentDocCopy.ed230ItemDtoList.push({bic: "0", dc: "D", registerItemId: "0", sum: "0"});
               self.build(false);
            }
           

            $scope.$root.ed230changeCell = function(i, p2) {  
               // меняем модель конкретной ячейки
               var item = "ed230ChangingCell" + i + p2;
               $scope.$root[item] = true;                   
            }

            // сохраняем изменения, сделанные при редактировании
            $scope.$root.ed230changeSave = function(id, param, value) {  
               // проверка значений перед сохранением
               var c = "selectedValue" + id + param;
               // пустые значения
               if (value == "") {                
                  $scope.$root[c] = "Введите значение!";
                  return false
               } else {
                  var patt1 = /[0-9.,]/g,
                     patt2 = /[0-9]/g;
                  var onlyNumber = function(c) {                                    
                     $scope.$root[c] = "Только число!";                 
                  }
                  if (param == "sum") {   
                     if (!value.match(patt1)) {
                        onlyNumber(c);  
                        return false
                     }                                        
                     if (value.match(patt1).length != value.length) {
                        onlyNumber(c);  
                        return false
                     }
                     // приводим к единому виду значения сумм
                     value = self.normalizeSum(value);  
                  // БИК только числа               
                  } else if (param == "bic") {
                     if (!value.match(patt2)) {
                        onlyNumber(c);  
                        return false
                     }                                        
                     if (value.match(patt2).length != value.length) {
                        onlyNumber(c);  
                        return false
                     }
                  // номер позиции только числа
                  } else if (param == "registerItemId") {                
                     if (!value.match(patt2)) {
                        onlyNumber(c);  
                        return false
                     }                                        
                     if (value.match(patt2).length != value.length) {
                        onlyNumber(c);  
                        return false
                     }
                  }                
               }                 
               // заносим изменения в объект со значениями полей данного ED230                     
               currentDoc.ed230ItemDtoList[id][param] = value;   
               currentDocCopy.ed230ItemDtoList[id][param] = value;   
               // закрываем ячейку
               var item = "ed230ChangingCell" + id + param;
               $scope.$root[item] = false;                       
               // и перерисовываем таблицу с новым значением
               self.build(false);

            }
 
            // отменяем изменения, сделанные при редактировании
            $scope.$root.ed230changeReject = function(i, p2) {         
               // меняем модель конкретной ячейки
               var item = "ed230ChangingCell" + i + p2;
               $scope.$root[item] = false;             
               // восстанавливаем старое значение в ячейке
               var c = "selectedValue" + i + p2;
               $scope.$root[c] = currentDoc.ed230ItemDtoList[i][p2]
            }

            // обновление данных в шапке
            $scope.$root.ed230reload = function() {
               self.build(true);
            }

            // редактирование дат ED230
            $scope.$root.changeED230DateOpen = function(input) {
               // запрещаем ввод символов с клавиатуры
               $scope.$root.keyboardBlock(true);  
               if (input == "begin") {                
                  $scope.$root.changeBeginProcessingDate = true
               }
               if (input == "end") {                
                  $scope.$root.changeEndProcessingDate = true
               }               
            }
            $scope.$root.changeED230DateSelect = function(input, date) {
               // отменяем запрет ввода символов с клавиатуры
               $scope.$root.keyboardBlock(false);  
               if (input == "begin") {
                  $scope.$root.changeBeginProcessingDate = false
                  currentDoc.beginProcessingDate = date;   
                  currentDocCopy.beginProcessingDate = date;            
               }
               if (input == "end") {
                  $scope.$root.changeEndProcessingDate = false
                  currentDoc.endProcessingDate = date;
                  currentDocCopy.endProcessingDate = date;  
               }
               self.build(true); 
            }


            // редактирование документа
            self.editDocument = function(id) {
               // показывает предупреждение, если загрузка задерживается            
               var timer = popup.longTime();                                                       
               $http.get(requests.table3getFile, {params: {id: id}}).then(
                  // success
                  function(response) { 
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload(); 
                     $timeout.cancel(timer);                      
                     var doc = response.data;                    
                     currentDoc = JSON.parse(JSON.stringify(doc));                    
                     currentDocCopy = JSON.parse(JSON.stringify(doc));                                         
                     popup.show({title: "Редактирование ED230", save: false, closeTitle: "Отмена"});  
                     self.build(true);                   
                  },
                  // error
                  function(response) {                    
                     $timeout.cancel(timer);    
                     popup.error(response);
                  }
               )               
            }

            // построение документа
            self.build = function(isHeader) {                   
               // isHeader показывает, перерисовывать шапку или нет  
               var html = self.showED230(currentDoc, isHeader);                           
               $scope.$root.popupInner = function() {return html}   
            }

            // нормализация вида сумм в ячейках
            self.normalizeSum = function(value) {              
               // заменяем запятую на точку                       
               var commar = value.indexOf(",");
               if (commar > -1) value = value.slice(0, commar) + "." + value.slice(commar+1);         
               var dot = value.indexOf(".");
               // добавляем нули, если нужно
               if (dot > -1) {
                  var l = value.slice(dot).length;               
                  if (l == 1) value += "00";
                  if (l == 2) value += "0";
                  // отрезаем лишнее
                  if (l > 3) value = value.substr(0, value.length-(l-3));            
                  // добавляем точку и нули
               } else {
                  value +=  ".00"
               }    
               return value;           
            }

           self.showED230 = function(currentDoc, isHeader) {           
               var html = "",
                  credit = 0,
                  debit = 0;
               ed230posQuant = 0;
               ed230nettoD = 0;
               ed230nettoC = 0;

               // фабрика для отрисовки ячеек
               var cellDraw = function(param, i, p2) {             
                  var _html = "";
                  // у каждой ячейки своя модель значения
                  var item = "selectedValue" + i + p2;              
                  $scope.$root[item] = param;
                  if (p2 == "dc") {
                     _html = "<div class='ed230cell-top' ng-class='$root.ed230ChangingCell" + i + p2 + " ? \"hidden\" : \"\"'>" + param + " <a href='' class='small' ng-click='$root.ed230changeCell(" + i + ", \"" + p2 + "\")'>изменить</a></div><div class='ed230cell-bottom' ng-class='$root.ed230ChangingCell" + i + p2 + " ? \"\" : \"hidden\"'><form><select ng-model='$root.selectedValue" + i + p2 + "'><option>C</option><option>D</option></select></form> <a href='' class='btn btn-default btn-xs mlr5 second-button' ng-click='$root.ed230changeSave(" + i + ", \"" + p2 + "\", selectedValue" + i + p2 + ")'>Сохранить</a><a class='btn btn-default btn-xs mlr5 second-button' ng-click='$root.ed230changeReject(" + i + ", \"" + p2 + "\")'>Отменить</a></div>"                  
                  } else {   
                     // нормализация вида суммы в ячейке 
                     if (p2 == "sum") param = self.normalizeSum(param);             
                     _html = "<div class='ed230cell-top' ng-class='$root.ed230ChangingCell" + i + p2 + " ? \"hidden\" : \"\"'>" + param + " <a href='' class='small' ng-click='$root.ed230changeCell(" + i + ", \"" + p2 + "\")'>изменить</a></div><div class='ed230cell-bottom' ng-class='$root.ed230ChangingCell" + i + p2 + " ? \"\" : \"hidden\"'><div class='cell-input row'><div class='col-md-offset-1 col-md-10'><form><input ng-model='$root.selectedValue" + i + p2 + "' ng-class='($root.selectedValue" + i + p2 + " == \"Введите значение!\") ||  ($root.selectedValue" + i + p2 + " == \"Только число!\")? \"alert-danger\" : \"\" ' type='text' length='20' value='' class='form-control' /></form><a class='btn btn-default btn-xs mlr5 second-button' ng-click='$root.ed230changeSave(" + i + ", \"" + p2 + "\", selectedValue" + i + p2 + ")'>Сохранить</a><a class='btn btn-default btn-xs mlr5 second-button' ng-click='$root.ed230changeReject(" + i + ", \"" + p2 + "\")'>Отменить</a></div></div></div>"
                  }                
                  return _html;
               }               

               var tableSrc = currentDoc.ed230ItemDtoList,
                  tableSrcLength = tableSrc.length;  
               var table = "<table class='table table-bordered table-hover'><thead><tr><th>Удалить позицию</th><th>Нетто-позиция</th><th>БИК участника</th><th>Признак дебита/кредита</th><th>Уникальный № позиции</th></tr></thead><tbody>";
               // объект для модели данных чекбоксов
               $scope.$root.ed230rowDelete = {};  
               for (var i=0; i < tableSrcLength; i++) {  
                  // сбрасывем ранее отмеченные позиции, все чекбоксы в состоянии "не отмечено"
                  $scope.$root.ed230rowDelete[i] = false;
                  // количество позиций
                  ed230posQuant++;    
                  // записываем нетто-позиции дебет и кредит  
                  var sum = tableSrc[i].sum,
                     dc = tableSrc[i].dc;                                            
                  if (dc == "D") {
                     ed230nettoD += parseFloat(sum)
                  } else if (dc == "C") {
                     ed230nettoC += parseFloat(sum)
                  } else {

                  }

                  table += "<tr><td><form><input type='checkbox' ng-model='$root.ed230rowDelete[" + i + "]' ng-init='cheked=false'/> <a href='' class='small' ng-if='$root.ed230rowDelete[" + i + "]' ng-click='$root.ed230positionDelete(" + i + ")'>удалить</a></form></td><td>" + cellDraw(sum, i, "sum") + "</td><td>" + cellDraw(tableSrc[i].bic, i, "bic") + "</td><td>" + cellDraw(dc, i, "dc") + "</td><td>" + cellDraw(tableSrc[i].registerItemId, i, "registerItemId") + "</td></tr>"
               }                  
               table += "<tr><td colspan='5' class='text-center'><a href='' class='btn btn-default' ng-click='$root.ed230positionAdd()'>Добавить позицию</a></td></tbody></table>";

               
               // пересчитывать данные в шапке
               if (isHeader) {               
                  // шапка с данными
               var title = "<div class='row'><div class='col-md-12'><h4>Редактирование файла <span class='text-danger'>" + currentDoc.fileName + "</span></h4></div></div>",
                  content = "<div class='row'><div class='col-md-6'>Номер ЭС в течение опердня: " + currentDoc.edNo + "</div><div class='col-md-6'>Дата генерации файла ED230: " + currentDoc.createDate + "</div></div><div class='row'><div class='col-md-6' ng-class='$root.changeBeginProcessingDate ? \"hidden\" : \"\"'>Начало периода обработки реестра: " + currentDoc.beginProcessingDate + " <a href='' class='small' ng-click='$root.changeED230DateOpen(\"begin\")'>изменить</a></div><div class='col-md-6 text-warning' ng-class='$root.changeBeginProcessingDate ? \"\" : \"hidden\"'><div class='col-md-6 small'>начало периода обработки реестра </div><div class='col-md-6'><datepicker date-format='yyyy-MM-dd' selector='form-control'><div class='input-group'><input class='form-control' ng-change='$root.changeED230DateSelect(\"begin\", $root.selectedBeginProcessingDate)' ng-model='$root.selectedBeginProcessingDate' placeholder='Новая дата' /><span class='input-group-addon'><i class=''></i></span></div></datepicker></div></div><div class='col-md-6' ng-class='$root.changeEndProcessingDate ? \"hidden\" : \"\"'>Конец периода обработки реестра: " + currentDoc.endProcessingDate + " <a href='' class='small' ng-click='$root.changeED230DateOpen(\"end\")'>изменить</a></div><div class='col-md-6 text-warning' ng-class='$root.changeEndProcessingDate ? \"\" : \"hidden\"'><div class='col-md-6 small'>конец периода обработки реестра </div><div class='col-md-6'><datepicker date-format='yyyy-MM-dd' selector='form-control'><div class='input-group'><input class='form-control' ng-change='$root.changeED230DateSelect(\"end\", $root.selectedEndProcessingDate)' ng-model='$root.selectedEndProcessingDate' placeholder='Новая дата' /><span class='input-group-addon'><i class=''></i></span></div></datepicker></div></div></div><div class='row'><div class='col-md-6'>Нетто кредитовых позиций по реестру: " + ed230nettoC.toFixed(2) + "</div><div class='col-md-6'>Нетто дебетовых позиций по реестру: " + ed230nettoD.toFixed(2) + "</div></div><div class='row'><div class='col-md-6'>Количество записей реестра: " + ed230posQuant + "</div><div class='col-md-6'>Номер реестра в течение дня: " + currentDoc.registerNo + " </div></div><div class='row'><div class='col-md-6'>Код системы обработки: " + currentDoc.clearingSystemCode + "</div><div class='col-md-6'>Автор/Исполнитель: " + currentDoc.author + "</div></div>",
                  aside = "<div class='row'><div class='col-md-12 text-center'><a class='btn btn-success' href='' ng-click='$root.ed230save(" + currentDoc.id +")' role='button'>Сохранить</a><div class='small'>Сохранить в БД и переформатировать XML-файл</div></div></div><div class='row'><div class='col-md-12 text-center'><a class='btn btn-info second-button' href='' ng-click='$root.ed230reload()' role='button'>Обновить данные</a></div></div>", 
                  _header = title + "<div class='row mtb1'><div class='col-md-9'>" + content + "</div><div class='col-md-3'>" + aside + "</div></div>";   
                  cachedHeader = _header;            

               // либо поменять только содержимое таблицы
               } else {                  
                  // шапка берётся из кэша
                  _header = cachedHeader;                
               }
               html = "<div class='container-fluid'>" + _header + table + "</div>";
               return html;
            }

            // изменение статуса позиции
            self.changeStatusInit = function(id) {            
               var statuses = ["OK", "ERROR"];
               popup.show({title: "Поменять статус", size: "middle", save: true});              
               for (var i=0; i < self.table.length; i++) {                  
                  if (id == self.table[i].id) {
                     item.id = id;                     
                     item.status = self.table[i].status;                                  
                     item.comment = self.table[i].comment;
                     break;
                  }
               }    
               // в statuses меняем местами статусы так, чтобы выбранный был самый первый                  
               var _s = 0,
                  _status = "",
                  _statusId,
                  _first = "",
                  _firstId;
               for (var j=0; j < statuses.length; j++) {      
                  _first = statuses[0];                            
                  if (statuses[j] == item.status) {                    
                     _s = j;                    
                     _status = statuses[j];
                     break;
                  }                  
               }     
               statuses[0] = _status;               
               statuses[_s] = _first;             
               // список селектов статусов с учётом выбранного       
               var op = "";   
               for (var z=0; z < statuses.length; z++) {                
                  if (z == 0) {
                     $scope.$root.selectedOption = statuses[z];                     
                     op += "<option value='" + statuses[z] + "' selected='selected'>" + statuses[z] + "</option>";
                  } else {
                     op += "<option value='" + statuses[z] + "'>" + statuses[z] + "</option>";
                  }    
               }              

               // содержимое попапа для замены статуса позиции
               $scope.$root.popupInner = function(){ return "<div class='row'><form class='col-md-12'><table class='table table-bordered table-hover'><tr><th class='col-md-4'>Статус</th><th class='col-md-8'>Комментарий</th></tr><tr><td><select ng-change='$root.changeStatus($root.selectedOption)' ng-model='$root.selectedOption' class='form-control'>" + op + "</select></td><td><div class='form-group' ng-class='{hasError: $root.changeStatusRequire}'><input type='text' ng-model='$root.changeStatusItem' ng-change='$root.changeStatusComment()' value='" + item.comment + "' class='form-control col-md-12' /></div></td></tr></table></form></div>"};                 
               // возможные варианты статусов для замены
               $scope.$root.popupStatuses = statuses;
               $scope.$root.changeStatusItem = item.comment;     
               $scope.$root.popupSaveButtonAction = self.saveED230Status;          
               $scope.$root.changeStatus = function(status) {            
                  item.status = status;                
                  $scope.$root.changeStatusComment();   
               }   
               $scope.$root.changeStatusComment = function() {
                  newComment = $scope.$root.changeStatusItem;  
                  var commentIsCorrect = false,
                     re = /[a-zA-Zа-яА-Я]/i; 
                  if (re.test(newComment)) commentIsCorrect = true;
                  (newComment.length > 5 && commentIsCorrect) ? ($scope.$root.isSavePopupActive = false, $scope.$root.changeStatusRequire = false) : ($scope.$root.isSavePopupActive = true, $scope.$root.changeStatusRequire = true);     
               }

               // инициализация проверки комментария к статусу
               $scope.$root.changeStatusComment();                   
            }     

            self.saveED230Status = function() {      
               // показывает предупреждение, если загрузка задерживается            
               var timer = popup.longTime({onlyLoader:true});        
               $http.post(requests.table3editStatus, {id: item.id, status: item.status, comment: newComment}).then(
                  // success
                  function(response) {  
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload(); 
                     $timeout.cancel(timer);                      
                     // сервер ответил, что ошибка
                     if (response.data.error.length > 0) {
                        response.statusText = response.data.error;
                        popup.error(response);
                     } else {
                        popup.hide();    
                        self.getData();  
                     }                    
                  },
                  // error
                  function(response) {
                     $timeout.cancel(timer);                    
                     popup.error(response);
                  }                                     
               )
            } 



            // выбор даты
            self.buttons = header.dates();
            self.buttonAction = function(id) {
               if (id == 1) {
                  var action = header.buttonAction(id);
                  getDate = action.date;                  
                  self.buttons = action.buttons;                  
                  self.getData();
               } else if (id == 2) {
                  header.buttonAction(id)
               } else if (id == 3) {
                  header.buttonAction(id)                             
               }
            }    
            self.header = header;   
            $scope.$root.changeDate = function(date, params) {              
               var header = self.header,          
                  cd = header.changeDate(date, params, self.buttons, paramsDates);     
               if (cd) {     
                  // сброс значения в поле одной даты
                  $scope.$root.selectedDate = "";
                  self.buttons = cd.buttons;
                  getDate = cd.date;
                  paramsDates = cd.dates;                           
                  // если совершён выбор второй даты для периода времени
                  if (getDate.startDate) {
                     self.getData();     
                     // сброс значений в полях ввода                     
                     $scope.$root.selectedStart = "";
                     $scope.$root.selectedEnd = "";
                  }
               }
            }
            $scope.$root.selectedDate = "";
            $scope.$root.selectedStart = "";
            $scope.$root.selectedEnd = "";
            $scope.$root.selectedBeginProcessingDate = "";
            $scope.$root.selectedEndProcessingDate = "";
            $scope.$root.changeBeginProcessingDate = false;
            $scope.$root.changeEndProcessingDate = false;
            $scope.$root.choosePeriodAlert = false;

            var longTime, timeIsOut;             
            self.getData = function() {        
               // страница долго грузится
               self.isLongTime = false; 
               // страница не загрузилась, попробовать ещё раз
               self.isTimeout = false;             
               // показываем предупреждение, если загрузка задерживается    
               longTime = $timeout(function(){
                  self.isLongTime = true;
               }, $scope.$root.isLongTimer);    
               // предлагаем загрузить ещё раз, если с первого раза не удалось
               timeIsOut = $timeout(function() {
                  self.isLongTime = false;
                  self.isTimeout = true;
               }, $scope.$root.isTimeoutTimer);                       
               $http.get(requests.table3get, {params: getDate}).then(
                  // success
                  function(response) {                        
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload(); 
                     // выключаем таймеры неуспешной загрузки
                     $timeout.cancel(longTime);     
                     $timeout.cancel(timeIsOut);
                     self.isLongTime = false; 
                     self.isTimeout = false;                    
                     self.table = response.data;
                     self.orderProp = "-error";          
                  },
                  // error
                  function(response) {
                     // выключаем таймеры неуспешной загрузки
                     $timeout.cancel(longTime);     
                     $timeout.cancel(timeIsOut);
                     self.isLongTime = false; 
                     self.isTimeout = false;        
                     popup.error(response);
                  } 
               )
            }
           
            // для этого экрана инициализация широкого шаблона
            $scope.$root.templateClass = "wide";

            self.buttons.currentDay.disabled = 1;  // по умолчанию открываем за текущий день
            self.getData();            

         }
      ]
   });
