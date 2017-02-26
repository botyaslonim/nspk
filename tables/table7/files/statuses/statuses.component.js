"use strict";

angular.
   module("statuses").
   component("statuses", {
      templateUrl: "tables/table7/files/statuses/statuses.template.html",
      controller: ["$http", "$scope", "$routeParams", "$timeout", "$window", "popup", "parseDoc", "sort", "ids", "requests",
      	function StatusesController($http, $scope, $routeParams, $timeout, $window, popup, parseDoc, sort, ids, requests) {

           	var self = this,
               props = {}, // объект со значениями сортировок (верх-низ) по каждому из столбцов
               sortClasses = {}, // классы для визуального отображения сортировки           
               item = {},
               newComment = ""; // сделано в отдельной переменной, а не status.comment, чтобы не вешать браузер при перерисовке после каждого введённого символа

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
          
            self.changeStatusInit = function(id) {   
               // в зависимости от registerMode выводим разные наборы доступных для установки статусов
               var statuses = [[2,"Оплачено"], [4,"Исключено"]];
               popup.show({title: "Поменять статус", size: "middle", save: true});              
               for (var i=0; i < self.table.length; i++) {                  
                  if (id == self.table[i].id) {
                     item.id = id;                     
                     //item.status = self.table[i].registerControlStatus;   
                     item.status = 2; // по умолчанию, любой статус меняется на "Оплачено", если не выбрано "Исключено"                   
                     item.comment = self.table[i].comment;
                     break;
                  }
               }                 
               /*// в statuses меняем местами статусы так, чтобы выбранный был самый первый                  
               var _s = 0,
                  _status = "",
                  _statusId,
                  _first = "",
                  _firstId;
               for (var j=0; j < statuses.length; j++) {
                  _firstId = statuses[0][0];   
                  _first = statuses[0][1];                            
                  if (statuses[j][0] == item.status) {                    
                     _s = j;
                     _statusId = statuses[j][0];
                     _status = statuses[j][1];
                     break;
                  }                  
               }                          
               statuses[0][0] = _statusId;
               statuses[0][1] = _status;
               statuses[_s][0] = _firstId;  
               statuses[_s][1] = _first;  */

               // список селектов статусов с учётом выбранного       
               var op = "";   
               for (var z=0; z < statuses.length; z++) {                
                  if (z == 0) {
                     $scope.$root.selectedOption = statuses[z][0];                     
                     op += "<option value='" + statuses[z][0] + "' selected='selected'>" + statuses[z][1] + "</option>";
                  } else {
                     op += "<option value='" + statuses[z][0] + "'>" + statuses[z][1] + "</option>";
                  }           
               }               

               // содержимое попапа для замены статуса позиции
               $scope.$root.popupInner = function(){ return "<div class='row'><form class='col-md-12'><table class='table table-bordered table-hover'><tr><th class='col-md-4'>Статус</th><th class='col-md-8'>Комментарий</th></tr><tr><td><select ng-change='$root.changeStatus($root.selectedOption)' ng-model='$root.selectedOption' class='form-control' convert-to-number>" + op + "</select></td><td><div class='form-group' ng-class='{hasError: $root.changeStatusRequire}'><input type='text' ng-model='$root.changeStatusItem' ng-change='$root.changeStatusComment()' value='" + item.comment + "' class='form-control col-md-12' /></div></td></tr></table></form></div>"};                 
               // возможные варианты статусов для замены
               $scope.$root.popupStatuses = statuses;
               $scope.$root.changeStatusItem = item.comment;     
               $scope.$root.popupSaveButtonAction = self.saveAction;          
               $scope.$root.changeStatus = function(id) { 
                  item.status = parseInt(id);                
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

            // сохраняем изменённый статус и/или комментарий
            self.saveAction = function() {     
               // показывает предупреждение, если загрузка задерживается            
               var timer = popup.longTime({onlyLoader:true});            
               $http.post(requests.table7editStatus, {id: item.id, status: item.status, comment: newComment}).then(
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
            
            // нужно показывать предупреждение, если хотя бы на одну нетто позицию уже пришёл RegMode3
            self.ifRegMode3 = false;

            self.getData = function() {
               // страница долго грузится
               self.isLongTime = false; 
               // страница не загрузилась, попробовать ещё раз
               self.isTimeout = false;              
               // показываем предупреждение, если загрузка задерживается    
               var longtime = $timeout(function(){
                  self.isLongTime = true;
               }, $scope.$root.isLongTimer);    
               // предлагаем загрузить ещё раз, если с первого раза не удалось
               var timeisout = $timeout(function() {
                  self.isLongTime = false;
                  self.isTimeout = true;
               }, $scope.$root.isTimeoutTimer);           
               $http.get(requests.table7statusesGet, {params: {id: ids.pos}}).then(
                  // success
                  function(response) {   
                     // сессия протухла и сервер редиректит запрос на форму логина, тогда просто перезагружаем страницу, сервер сам редиректит на форму логина
                     if (response.data.length > 0 && response.data.indexOf("<html>") > -1) $window.location.reload();   
                     // выключаем таймеры неуспешной загрузки
                     $timeout.cancel(longtime);     
                     $timeout.cancel(timeisout);
                     self.isLongTime = false; 
                     self.isTimeout = false;                  
                     self.table = response.data.registerList;
                     self.ed230FileName = response.data.ed230FileName;
                     self.status = response.data.status;                  
                     // последовательность номеров статусов не совпадает с требуемой сортировкой, поэтому для сортировки делаем собственный признак
                     for (var i=0; i < self.table.length; i++) {
                        var s = self.table[i].registerControlStatus, 
                           ns = null;                                    
                        if (s == 0) {
                           ns = 1
                        } else if (s == 1) {
                           ns = 0
                        // нет статуса
                        } else if (!s) {
                           ns = 101
                        } else {
                           ns = s
                        }                     
                        self.table[i]._registerControlStatus = ns;
                     }                
                     self.orderProp = "-_registerControlStatus"                                  
                     if (response.data.maxRegisterMode == "3") self.ifRegMode3 = true;
                  },
                  // error
                  function(response) {
                     // выключаем таймеры неуспешной загрузки
                     $timeout.cancel(longtime);     
                     $timeout.cancel(timeisout);
                     self.isLongTime = false; 
                     self.isTimeout = false;   
                     popup.error(response);
                  } 
               )            
            }
            
            // открытие вкладки
            self.getData();
         }
      ]
   })
   
