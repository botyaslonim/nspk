"use strict";

angular.
   module("nspk").
   config(["$locationProvider", "$routeProvider",
      function config($locationProvider, $routeProvider) {
         $locationProvider.hashPrefix('!');
         $routeProvider.           
            when("/table/1", {
               template: "<table1></table1>"
            }).
            when("/table/2", {
               template: "<table2></table2>"
            }).
            when("/table/3", {
               template: "<table3></table3>"
            }).
            when("/table/4", {
               template: "<table4></table4>"
            }).
            when("/table/5", {
               template: "<table5></table5>"
            }).
            when("/table/6", {
               template: "<table6></table6>"
            }).
            when("/table/7", {
               template: "<table7></table7>"
            }).
            when("/table/7/files", {
               template: "<files></files>"
            }).
            when("/table/7/files/register1", {
               template: "<register1></register1>"
            }).
            when("/table/7/files/register2", {
               template: "<register2></register2>"
            }).
            when("/table/7/files/register3", {
               template: "<register3></register3>"
            }).
             when("/table/7/files/statuses", {
               template: "<statuses></statuses>"
            }).
            otherwise("/table/1");
      }
  ]);