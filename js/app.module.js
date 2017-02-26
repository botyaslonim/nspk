"use strict";

angular.module("nspk", [
	"ngRoute",
	"core",  
	"720kb.datepicker",	
	"table1",
	"table2",
	"table3",
	"table4",
	"table5",
	"table6",
	"table7",
	"files",
	"register1",
	"register2",
	"register3",
	"statuses"
], 
// компиляция содержимого попапа
function($compileProvider) {  
  	$compileProvider.directive("compile", function($compile) {   
    	return function(scope, element, attrs) {       	
	      scope.$watch(
	        	function(scope) {	   	        		    
	          	return scope.$eval(scope.$root.popupInner);
	         },
	        	function(value) {		        		
		         element.html(value);		             
		         $compile(element.contents())(scope);
	        	}
	      )
    	}
  	})
}).controller("main", function($http, $scope, $rootScope, $location, $compile, $locale, $document, $window, $q, popup, requests) { 

	var self = this;

	// русская локализация для календаря		
	$locale.DATETIME_FORMATS.MONTH[0] = "Январь";
	$locale.DATETIME_FORMATS.MONTH[1] = "Февраль";
	$locale.DATETIME_FORMATS.MONTH[2] = "Март";
	$locale.DATETIME_FORMATS.MONTH[3] = "Апрель";
	$locale.DATETIME_FORMATS.MONTH[4] = "Май";
	$locale.DATETIME_FORMATS.MONTH[5] = "Июнь";
	$locale.DATETIME_FORMATS.MONTH[6] = "Июль";
	$locale.DATETIME_FORMATS.MONTH[7] = "Август";
	$locale.DATETIME_FORMATS.MONTH[8] = "Сентябрь";
	$locale.DATETIME_FORMATS.MONTH[9] = "Октябрь";
	$locale.DATETIME_FORMATS.MONTH[10] = "Ноябрь";
	$locale.DATETIME_FORMATS.MONTH[11] = "Декабрь";
	$locale.DATETIME_FORMATS.FIRSTDAYOFWEEK = 0;
	$locale.DATETIME_FORMATS.SHORTDAY[0] = "Вс";
	$locale.DATETIME_FORMATS.SHORTDAY[1] = "Пн";
	$locale.DATETIME_FORMATS.SHORTDAY[2] = "Вт";
	$locale.DATETIME_FORMATS.SHORTDAY[3] = "Ср";
	$locale.DATETIME_FORMATS.SHORTDAY[4] = "Чт";
	$locale.DATETIME_FORMATS.SHORTDAY[5] = "Пт";
	$locale.DATETIME_FORMATS.SHORTDAY[6] = "Сб";	


	// навигация основого меню
	$scope.isActive = function(location) {  
		var a = $location.path();   
		if (location != "/table/7") {
			return location === a;   
		} else {
			if (a === "/table/7" || a === "/table/7/files" || a === "/table/7/files/register1" || a === "/table/7/files/register2" || a === "/table/7/files/register3" || a === "/table/7/files/statuses") {
				return true
			} else {
				return false
			}
		}
	}

	// кнопка "Сохранить" попапа
	$scope.isSaveActive = function() {	
		return $scope.$root.isSavePopupActive;
	}	

	// попап
	$scope.$root.popupShow = function(){
		// смотреть в core
		var params = {};
		if (arguments) {			
			for (var i in arguments[0]) {			
				params[i] = arguments[0][i]
			}			
		}
		if (params.text) {		
			$scope.$root.popupInner = function() {return params.text}
		}
		popup.show(params); 		
	}
	$scope.$root.popupClose = function(){
		// смотреть в core
		popup.hide(); 			
	}

	// выход пользователя
	$scope.$root.logout = function() {
		$http.get("/x3x/j_spring_security_logout").then(function(response) { 
      	$scope.$root.userName = "";
        	console.log("Вышел")
      })
	}

	// получение имени пользователя
	$http.get(requests.getCurrentUser).then(function(response) {            
      $scope.$root.userName = response.data.userName;
      $scope.$root.userRole = response.data.userRole;
   });

   // блокировка ввода с клавиатуры
   $scope.$root.keyboardBlock = function(param) {
   	if (param) {    		
   		$(document).on("keydown", $scope.$root.keyboardBlockF)   	
   	} else {   		
   		$(document).off("keydown", $scope.$root.keyboardBlockF)   	
   	
   	}   	
   }
   $scope.$root.keyboardBlockF = function(event) {   	
   	event.preventDefault();   	
   	return false
   }


	// дефолтные значения
	$scope.$root.isSavePopupActive = false;
	$scope.$root.popupSaveButtonFormat = "xml";

	// кнопка Сохранить во всплывающем окне
	$scope.$root.popupSaveButtonAction = function() {
		var text = $scope.$root.documentText,
			filename = $scope.$root.documentName;
		// определяем кодировку исходного документа
		var a1 = text.indexOf("encoding"),
			a2 = text.slice(a1+10);
		// если кодировка не обнаружена, то UTF-8
		if (a1 == -1) {
			var encoding = "UTF-8";	
		} else {
			a1 = a2.indexOf("\"");
			var encoding = a2.slice(0,a1);	
		}			
		// тип документа
		var type = ""; 
		if (!$scope.$root.popupSaveButtonFormat || $scope.$root.popupSaveButtonFormat == "xml") {
			type = "text/xml";
		} else if ($scope.$root.popupSaveButtonFormat == "text") {
			type = "text";
		}
		// IE	
		if (document.documentMode) {
			var blob = new Blob([text],{type: type + ";charset=" + encoding + ";"});
			navigator.msSaveBlob(blob, filename + ".txt")
		// нормальные браузеры
		} else {
			var pom = document.createElement("a");
		   pom.setAttribute("href", "data:" + type + ";charset=" + encoding + "," + encodeURIComponent(text));
		   pom.setAttribute("download", filename);			   
		   if (document.createEvent) {
		      var event = document.createEvent("MouseEvents");	        
		      event.initEvent("click", true, true);	      
		      pom.dispatchEvent(event);
		   } else {
		      pom.click();
		   }
		}		
	}

	// перезагрузка страницы
	$scope.$root.reload = function() {
		location.reload();
	}

	// изменение урла
	$scope.$watch(function() {
	    return location.hash
	}, function (value) {
		// на третьем экране широкий шаблон
	   if (value == "#!/table/3") {
			$scope.$root.templateWide = "wide"
		// сбрасываем ширину шаблона
		} else {
			$scope.$root.templateClass = ""			
		}	
	});

	// стандартное название кнопки "Сохранить" попапа
	$scope.$root.popupSaveButtonText = "Сохранить";
	// имя пользователя
	$scope.$root.userName = "";
	// роль пользователя - ADMIN, OPERATOR
	$scope.$root.userRole = "";
	// таймер для сообщения о задержке загрузки
	$scope.$root.isLongTimer = 3000;
	// таймер для сообщения о невозможности загрузки
	$scope.$root.isTimeoutTimer = 10000;
	// инициализация попапа
	$scope.$root.popupInner = function() {return ""}; 
	// ширина основного шаблона, по умолчанию берётся из bootstrap
	$scope.$root.templateClass = "";
	// текущий день
	var _d = new Date(),
		_dd = _d.getDate(),
		_dm = _d.getMonth() + 1,
		_dy = _d.getFullYear();
	if (_dd < 10) _dd = "0"+ _dd;
	if (_dm < 10) _dm = "0" + _dm;
	$scope.$root.currentDay  = _dd + "." + _dm + "." + _dy;

});