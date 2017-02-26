"use strict";

angular.
   module("table4").
   component("table4", {
      templateUrl: "tables/table4/table4.template.html",
      controller: ["$http", "$scope", "$routeParams", "$timeout", "$window", "popup", "sort", "header", "requests",
      	function Table4Controller($http, $scope, $routeParams, $timeout, $window, popup, sort, header, requests) {

           	var self = this,
               files = [],  // id отправляемых файлов
               props = {}, // объект со значениями сортировок (верх-низ) по каждому из столбцов
               sortClasses = {}, // классы для визуального отображения сортировки
               paramsDates = ["", ""], // даты в выбранном периоде
               nowDate = new Date().toISOString().substring(0, 10), // сегодняшняя дата
               getDate = {
                  startDate: nowDate                 
               }; 

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
            self.chooseFile = function(id) {
               id = parseInt(id, 10);
               if (files.length == 0) {
                  files[0] = id
               } else {
                  var count;
                  for (var i=0; i < files.length; i++) {                        
                     if (files[i] == id) {       
                        count = i;
                        break;
                     }
                  }                               
                  if (typeof count != "undefined") {                                    
                     files.splice(count, 1)
                  } else {
                     files.push(id)
                  }
               }              
            }

            // возврашает состояние "файлы выбраны/нет"
            self.getIfChosen = function() {
               if (files.length > 0) {
                  return false 
               } else {
                  return true
               }
            }

            // отправка файлов
            self.sendFiles = function() {
               var _files = files.map(function(num){
                  return {
                     id: num
                  }
               })  
             
               // показывает предупреждение, если загрузка задерживается            
               var timer = popup.longTime();                                                             
               $http.post(requests.table4post, _files).then(
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
               $http.get(requests.table4get, {params: getDate}).then(                 
                  // success
                  function(response) {                   
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload(); 
                     // выключаем таймеры неуспешной загрузки
                     $timeout.cancel(longTime);     
                     $timeout.cancel(timeIsOut);
                     self.isLongTime = false; 
                     self.isTimeout = false;                  
                     self.table = response.data.exportResponseList;
                     self.status = response.data.status;
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
                       
            self.buttons.currentDay.disabled = 1;  // по умолчанию открываем за текущий день
            self.getData();
         }
      ]
  });
