"use strict";

angular.
   module("files").
   component("files", {
      templateUrl: "tables/table7/files/files.template.html",
      controller: ["$http", "$scope", "$routeParams", "$timeout", "$window", "popup", "parseDoc", "sort", "header", "ids", "requests",
      	function FilesController($http, $scope, $routeParams, $timeout, $window, popup, parseDoc, sort, header, ids, requests) {

           	var self = this;
            self.reg = {};   

            // до загрузки данных не показываем заголовки таблицы
            self.table = null;       

            // просмотр актуальных статусов позиций
            self.getStatuses = function() {
               $window.location.hash = '!/table/7/files/statuses'
            }

            // просмотр выбранного Register Mode
            self.getRegister = function() {        
               ids.registerId = ids.pos;  
               ids.registerMode = self.reg.mode; 
               ids.ed231Id = self.reg.modeid[1];                            
               $window.location.hash = '!/table/7/files/register' + self.reg.mode;
            }

            self.chooseRegister = function(id, mode) {
               if (self.reg.modeid && mode === self.reg.modeid[0] && id === self.reg.modeid[1]) {              
                  delete self.reg.modeid;                  
               } else {               
                  self.reg.modeid = [mode, id];
               }                
               // в зависимости от Register Mode выдаём разные шаблоны
               self.reg.mode = mode     
            }           
            self.getIfReg = function() {               
               if (self.reg.modeid) {
                  return false
               } else {
                  return true
               }
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
               $http.get(requests.table7filesGet, {params: {id : ids.pos}}).then(
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
