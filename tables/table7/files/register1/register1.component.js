"use strict";

angular.
   module("register1").
   component("register1", {
      templateUrl: "tables/table7/files/register1/register1.template.html",
      controller: ["$http", "$scope", "$routeParams", "$timeout", "$window", "popup", "parseDoc", "sort", "header", "ids", "requests",
      	function Register1Controller($http, $scope, $routeParams, $timeout, $window, popup, parseDoc, sort, header, ids, requests) {

           	var self = this,    
               props = {}, // объект со значениями сортировок (верх-низ) по каждому из столбцов
               sortClasses = {}; // классы для визуального отображения сортировки  

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
               $http.get(requests.table7register1get, {params: {id: ids.registerId, ed231Id: ids.ed231Id, registerMode: ids.registerMode}}).then(
                  // success
                  function(response) {   
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload();   
                     // выключаем таймеры неуспешной загрузки
                     $timeout.cancel(longTime);     
                     $timeout.cancel(timeIsOut);
                     self.isLongTime = false; 
                     self.isTimeout = false;                  
                     self.table = response.data.registerList;
                     self.ed230FileName = response.data.ed230FileName;
                     self.status = response.data.status;    
                     self.absentStatus = response.data.absentStatus;         
                     // последовательность номеров статусов не совпадает с требуемой сортировкой, поэтому для сортировки делаем собственный признак
                     for (var i=0; i < self.table.length; i++) {
                        var s = self.table[i].registerControlStatus, 
                           ns = null;                  
                        if (s == 0) {
                           ns = 1
                        } else if (s == 1) {
                           ns = 0;
                        // нет статуса
                        } else if (!s) {
                           ns = 101
                        } else {
                           ns = s
                        }      
                        self.table[i]._registerControlStatus = ns;
                     }                
                     self.orderProp = "-_registerControlStatus"
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
