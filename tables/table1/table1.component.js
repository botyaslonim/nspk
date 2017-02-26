"use strict";

angular.
   module("table1").
   component("table1", {
      templateUrl: "tables/table1/table1.template.html",
      controller: ["$http", "$scope", "$routeParams", "$timeout", "$window", "$q", "popup", "sort", "requests",
      	function Table1Controller($http, $scope, $routeParams, $timeout, $window, $q, popup, sort, requests) {

           	var self = this,
               files = [],  // id отправляемых файлов
               props = {}, // объект со значениями сортировок (верх-низ) по каждому из столбцов
               sortClasses = {}, // классы для визуального отображения сортировки
               checkedAll = false, // флаг отметки всех пунктов
               activeItems = 0; // число элементов, которые можно отметить

            // до загрузки данных не показываем заголовки таблицы
            self.table = null;
   	         
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

            // выбор файла для отправки 
            self.chooseFile = function(fileName, num) {                        
               // вызов из шаблона                       
               if (fileName && num != "undefined") {                    
                  if (files.length == 0) {                 
                     files.push(fileName);               
                  } else {
                     var count;                     
                     for (var i=0; i < files.length; i++) {                        
                        if (files[i] == fileName) {       
                           count = i;
                           break;
                        }
                     }                               
                     if (typeof count != "undefined") {                                    
                        files.splice(count, 1);
                        self.table[num].ifChecked = false;
                     } else {
                        files.push(fileName);
                        self.table[num].ifChecked = true;                         
                     }                     
                  }   
               }                              
               // если доступных для отметки пунктов нет
               if (activeItems == 0) {
                  self.chooseAllText = "";
                  checkedAll = false;
               // если все пункты отмечены
               } else if (files.length == activeItems) {
                  self.chooseAllText = "снять все отметки";
                  checkedAll = true;
               } else {
                  self.chooseAllText = "отметить всё";
                  checkedAll = false;
               }                                          
            }

            // отметить/снять все пункты
            self.chooseAll = function() {             
               files = [];
               if (checkedAll) {                 
                  for (var i=0; i < self.table.length; i++) {                     
                     self.table[i].ifChecked = false;                   
                  }                   
                  self.chooseAllText = "отметить всё";
                  checkedAll = false;                 
               } else {                  
                  for (var i=0; i < self.table.length; i++) {                     
                     if (self.table[i].error.length == 0) {
                        files.push(self.table[i].fileName);
                        self.table[i].ifChecked = true;
                     }                                       
                  }  
                  self.chooseAllText = "снять все отметки";
                  checkedAll = true;                 
               }                          
            }

            self.chooseAllText = "отметить всё";

            // возврашает состояние "файлы выбраны/нет"
            self.getIfChosen = function() {
               if (files.length > 0) {
                  return false 
               } else {
                  return true
               }
            }            

            // отправка списка выбранных файлов
            self.sendFiles = function() {
               var _files = files.map(function(num){
                  return {
                     fileName: num
                  }
               })                            
               // показывает предупреждение, если загрузка задерживается            
               var timer = popup.longTime();                                                       
               $http.post(requests.table1post, _files).then(
                  // success
                  function(response) {                      
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload(); 
                     $timeout.cancel(timer);                      
                     files = [];
                     self.getData();
                     var data = response.data,
                        html = "",                        
                        filesErrors = 0, // считаеем, сколько всего файлов с ошибками
                        isMultiple = false, // ошибок в загружаемом файле более 1
                        errorFile = ""; // содержимое файла ошибки                   

                     for (var i in data) {
                        // есть ошибки
                        if (data[i].error.length > 0) {
                           filesErrors++;                       
                           // ошибок больше одной
                           if (data[i].errorList.length > 1) {
                              isMultiple = true;
                              html += "<div class='row danger'><div class='col-md-12'><p class='alert alert-danger'><strong>Ошибки при загрузке файла " + data[i].fileName + ":</strong><br/>";                    
                              errorFile += "\r\nОшибки при загрузке файла " + data[i].fileName + ":\r\n\r\n";                         
                              for (var j=0; j < data[i].errorList.length; j++) {
                                 html += j + 1 + ") " + data[i].errorList[j] + "<br/>";
                                 errorFile += j + 1 + ") " + data[i].errorList[j] + "\r\n";
                              }
                              errorFile += "\r\n";
                              html += "</p></div></div>"; 
                           // одна ошибка
                           } else {
                              html += "<div class='row'><div class='col-md-12'><p class='alert alert-danger'><strong>Ошибка при загрузке файла " + data[i].fileName + ":</strong><br/>" + data[i].error + "</p></div></div>";
                              errorFile += "\r\nОшибка при загрузке файла " + data[i].fileName + ":\r\n\r\n" + data[i].error + "\r\n\r\n"; 
                           }
                        // ошибок нет
                        } else {
                           html += "<div class='row danger'><div class='col-md-12'><p class='alert alert-success'>Файл " + data[i].fileName + " успешно загружен</p></div></div>"
                        }                                                
                     }

                     // вывод и сохранение ошибок в файл
                     var _f = "файла",
                        _e = "ошибку",
                        _s = false;                       
                     if (data.length > 1) _f = "файлов";
                     if (filesErrors > 1 || isMultiple) _e = "ошибки";
                     if (filesErrors > 0) _s = true;
                     popup.show({title: "Результат загрузки " + _f, size: "small", save: _s,  saveTitle: "Сохранить " + _e + " в файл"}); 
                     $scope.$root.popupSaveButtonFormat = "text";  
                 
                     // есть ошибки, выводим их в файл
                     if (filesErrors > 0) {
                        var _err = popup.saveError(errorFile)
                        $scope.$root.documentText = _err.errorText;   
                        // сохранение ошибок одного файла
                        if (filesErrors == 1) {
                           $scope.$root.documentName = "upload-error_" + _err.year + "-" + _err.month + "-" + _err.date + "--" + _err.hours + "-" + _err.minutes + "_" + data[i].fileName.slice(0, data[i].fileName.indexOf("."));
                        // сохранение ошибок нескольких файлов
                        } else if (filesErrors > 1) {
                           $scope.$root.documentName = "upload-error_" + _err.year + "-" + _err.month + "-" + _err.date + "--" + _err.hours + "-" + _err.minutes + "_multiple-files";
                        }
                     }                    

                     // вывод результатов загрузки                     
                     $scope.$root.popupInner = function() {return html};                      
                  },
                  // error
                  function(response) {              
                     $timeout.cancel(timer);    
                     popup.error(response);
                  }
               )
            }

            var longTime, timeIsOut, renewFolder, isDestroy = false, canceler = $q.defer();          
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
               $http.get(requests.table1get, {timeout: canceler.promise}).then(
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
                     activeItems = 0;
                     // смотрим, какие файлы были выбраны в прошлой итерации, и отмечаем их снова               
                     for (var i=0; i < self.table.length; i++) {
                        // запоминаем число элементов, пригодных для работы
                        if (self.table[i].error.length == 0) activeItems++;                     
                        for (var j=0; j < files.length; j++) {                    
                           if (self.table[i].fileName == files[j] && self.table[i].error.length == 0) self.table[i].ifChecked = true;
                        }                        
                     } 
                     // валидируем ссылку "отметить всё/снять все отметки"
                     self.chooseFile();
                     // выключаем прошлый цикл опроса сервера
                     $timeout.cancel(renewFolder);
                     // через 5 секунд делаем обновление папки
                     renew();
                  },
                  // error
                  function(response) {                    
                     // выключаем таймеры неуспешной загрузки
                     $timeout.cancel(longTime);     
                     $timeout.cancel(timeIsOut);
                     self.isLongTime = false; 
                     self.isTimeout = false;                                         
                     if (!isDestroy) popup.error(response);
                  } 
               )
            }
           
            self.getData();             

            function renew() {
               renewFolder = $timeout(function(){
                  self.getData();
               }, 5000)
            }            

            $scope.$on(
               "$destroy",
               function(event) {       
                  // прерываем выполнение запросов, чтобы исключить вызовы по цепочке после перехода на другой экран
                  isDestroy = true;
                  canceler.resolve(); 
                  $timeout.cancel(longTime);     
                  $timeout.cancel(timeIsOut);
                  $timeout.cancel(renewFolder);
                  $scope.$root.popupSaveButtonFormat = false;
               }
            )        
           
         }
      ]
  });
