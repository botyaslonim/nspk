"use strict";

angular.
   module("table7").
   component("table7", {
      templateUrl: "tables/table7/table7.template.html",
      controller: ["$http", "$scope", "$routeParams", "$timeout", "$window", "popup", "parseDoc", "sort", "header", "ids", "requests",
      	function Table7Controller($http, $scope, $routeParams, $timeout, $window, popup, parseDoc, sort, header, ids, requests) {

           	var self = this,
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

            // запоминаем id позиции для навигации в breadcrumbs
            self.saveId = function(id) {              
               ids.pos = id;
               // тут же запоминаем даты для возвращения по навигации
               ids.dates7 = getDate;
            }

            // если был совершён из следующей страницы по кнопке "Назад"
            if (ids.dates7) {                  
               getDate = ids.dates7;
               // сброс кнопок
               self.buttons = header.dates();
               // был выбран отрезок
               if (getDate.endDate) {                     
                  self.buttons.choosePeriod.view = "active";
                  self.buttons.choosePeriod.text = "C " + getDate.startDate + " по " + getDate.endDate;
               // была выбрана одна дата
               } else {
                  self.buttons.chooseDay.view = "active";
                  self.buttons.chooseDay.text = getDate.startDate;
               }     
            // по умолчанию открываем за текущий день             
            } else {
               self.buttons.currentDay.disabled = 1;  
            }

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
               $http.get(requests.table7get, {params: getDate}).then(
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
                     self.orderProp = "-error"
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
          
            self.getData();           

         }
      ]
  });
