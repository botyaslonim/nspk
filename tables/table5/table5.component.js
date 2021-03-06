"use strict";

angular.
   module("table5").
   component("table5", {
      templateUrl: "tables/table5/table5.template.html",
      controller: ["$http", "$scope", "$routeParams", "$timeout", "$window", "$q", "popup", "sort", "header", "requests",
      	function Table5Controller($http, $scope, $routeParams, $timeout, $window, $q, popup, sort, header, requests) {

           	var self = this,
               files = [],  // имена отправляемых файлов
               props = {}, // объект со значениями сортировок (верх-низ) по каждому из столбцов
               sortClasses = {}, // классы для визуального отображения сортировки
               paramsDates = ["", ""], // даты в выбранном периоде
               nowDate = new Date().toISOString().substring(0, 10), // сегодняшняя дата
               getDate = {
                  startDate: nowDate                 
               },
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
                     files[0] = fileName
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
                     if (self.table[i].status.length == 0) {
                        files.push(self.table[i].fileName);
                        self.table[i].ifChecked = true;
                     }                                       
                  }  
                  self.chooseAllText = "снять все отметки";
                  checkedAll = true;                 
               }                          
            }

            self.chooseAllText = "отметить всё";

            // отправка файлов           
            self.sendFiles = function() {
               var _files = files.map(function(num){
                  return {
                     fileName: num
                  }
               })                 

               // показывает предупреждение, если загрузка задерживается            
               var timer = popup.longTime();                                                          
               $http.post(requests.table5post, _files).then(
                  // success
                  function(response) { 
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload(); 
                     $timeout.cancel(timer);                     
                     popup.show({title: "Результат загрузки", size: "small"});            
                     files = [];
                     self.getData();
                     var data = response.data,
                        html = "<table class='table'><tbody>";
                     for (var i in data) {
                        if (data[i].error.length > 0) {
                           html += "<tr class='danger'><td>Файл " + data[i].fileName + " не загружен. Ошибка: " + data[i].error + "</td></tr>"
                        } else {
                           html += "<tr class='success'><td>Файл " + data[i].fileName + " успешно загружен</td></tr>"
                        }
                     }
                     html += "</tbody></table>";
                     $scope.$root.popupInner = function() {return html}                
                  },
                  // error
                  function(response) {                  
                     $timeout.cancel(timer);    
                     popup.error(response);
                  }
               )              
            }

            // возврашает состояние "файлы выбраны/нет"
            self.getIfChosen = function() {
               if (files.length > 0) {
                  return false 
               } else {
                  return true
               }
            }     

            // выбор даты
            self.buttons = header.dates();
            self.buttonAction = function(id) {
               $timeout.cancel(renewFolder);
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
                     $timeout.cancel(renewFolder);
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
            $scope.$root.choosePeriodAlert = false;
            
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
               $http.get(requests.table5get, {params: getDate, timeout: canceler.promise}).then(
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
                     self.orderProp = "status";
                     activeItems = 0;
                     // смотрим, какие файлы были выбраны в прошлой итерации, и отмечаем их снова               
                     for (var i=0; i < self.table.length; i++) {
                        // запоминаем число элементов, пригодных для работы
                        if (self.table[i].status.length == 0) activeItems++;
                        for (var j=0; j < files.length; j++) {                    
                           if (self.table[i].fileName == files[j]) self.table[i].ifChecked = true;
                        }
                     }
                     // валидируем ссылку "отметить всё/снять все отметки"
                     self.chooseFile();
                     // выключаем прошлый цикл опроса сервера
                     $timeout.cancel(renewFolder);
                     // включаем новый цикл опроса сервера
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

            self.buttons.currentDay.disabled = 1;  // по умолчанию открываем за текущий день    
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
               }
            )  

         }
      ]
  });
