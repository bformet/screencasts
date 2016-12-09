// An Angular.js app that displays code examples.
// Create by Curran Kelleher July 2014
// Updated April 2015
var app = angular.module('exampleViewerApp', ['ngRoute']);

// Set up routes.
app.config(function($routeProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'example-list.html',
      controller: 'ExampleListCtrl'
    }).
    when('/:exampleNumber', {
      templateUrl: 'example-detail.html',
      controller: 'ExampleDetailCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
});

// This service works with slides.json.
app.factory('examples', function($http){

  function getData(callback){
    $http({
      method: 'GET',
      url: '../slides.json',
      cache: true
    }).success(callback);
  }

  return {

    // examples.list(callback) lists all examples.
    list: getData,

    // examples.find gets details about one specific example.
    find: function(exampleNumber, callback){
      getData(function(data) {
        var index = parseInt(exampleNumber) - 1;
        callback(data[index]);
      });
    }
  };
});

// This service works with project.json.
app.factory('project', function($http){
  return {
    getData: function (callback){
      $http({
        method: 'GET',
        url: '../project.json',
        cache: true
      }).success(callback);
    }
  };
});

// Responsible for navigating based on key events.
app.controller('MainCtrl', function ($scope, $document, $location, examples){

  // Show the iframe running the example code by default.
  // This can be toggled by pressing "p".
  $scope.showIFrame = true;

  examples.list(function(examples){

    // These are key codes from key down events.
    var LEFT = 37,
        RIGHT = 39,
        PAGEUP = 33,
        PAGEDOWN = 34,
        BACKSPACE = 8,
        ESC = 27,
        P = 80;

    $scope.onKeydown = function(e) {

      if (e.srcElement.type === 'textarea') {
        //disable keyboard navigation from code text editor
        return;
      }

      // Use left and right arrows for navigation
      var path = $location.path(),
          // The example number
          n;

      if(path.length > 1) {
        // Extract the example number from the path.
        n = parseInt(path.substr(1), 10);
      }
      else {
        n = ''
      }

      // Increment or decrement the example number.
      switch(e.keyCode) {
        case ESC:
          n = '';
          break;

        case RIGHT:
        case PAGEDOWN:
          if (n < examples.length)  n++;
          break;

        case LEFT:
        case PAGEUP:
          if (n == 1)  n = '';
          if (n > 1)  n--;
          break;

        case BACKSPACE:
          n = 1;
          break;
      }
      
      // Navigate to the previous or next example.
      $location.path('/' + n);

      // Use the "p" key to toggle visibility of the iframe.
      if(e.keyCode === P){
        $scope.showIFrame = !$scope.showIFrame;
      }
    };
  });
});

app.controller('ExampleListCtrl', function ($scope, examples, project){
  examples.list(function(examples) {
    $scope.examples = examples;
  });
  // project.getData(function(project){
  //   $scope.title = project.title;
  //   $scope.date = project.date;
  //   $scope.author = project.author;
  //   $scope.authorLink = project.authorLink;
  // });
});

app.controller('ExampleDetailCtrl',
  function ($scope, $routeParams, $http, $sce, examples){
  examples.find($routeParams.exampleNumber, function(example) {
    $scope.example = example;
    if (example.iframe === true) {
      $scope.iframe = '../examples/' + example.files[0];
    } else {
      $scope.iframe = example.iframe
    }
    if (example.slide) {
      $http.get('../slides/' + example.slide).success(function(data) {
        // Remove first line, as it appears elsewhere on the page (called 'message').
        var md = data.split('\n').splice(1).join('\n');
        $scope.slide = $sce.trustAsHtml(marked(md));
      });
    }
    $scope.getFileName = function(file) {
      return file.split('/').pop();
    }
  });

  // Postponed feature - dynamic code changing
  $scope.$on('htmlChange', function (event, data){
    $scope.iFrameSrcDoc = $sce.trustAsHtml(data.replace('</head>', `  <base href="http://localhost:8000/introToD3/examples/${$scope.example.files[0]}">
      </head>`));
  });
});

/**
 * The `file` directive loads the content of an 
 * example source code file into a CodeMirror instance
 * for syntax-highlighted presentation.
 */
app.directive('file', function(){
  return {
    scope: { file: '=', example: '=' },
    restrict: 'A',
    controller: function($scope, $http){
      var path = [
        '../examples',
        $scope.file
      ].join('/');
      $http.get(path).success(function(data) {
        if(typeof(data) === 'object'){
          // un-parse auto-parsed JSON files for presentation as text
          data = JSON.stringify(data, null, 2);
        } else {
          // Remove trailing newlines from code presentation
          data = data.trim();
        }
        $scope.content = data;
      });
    },
    link : function(scope, element, attrs) {
      var textArea = element[0],
          ext = scope.file.substr(scope.file.lastIndexOf("."));
      var editor = CodeMirror.fromTextArea(textArea, {
        mode: {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.json': 'text/javascript',
          '.css': 'text/css'
        }[ext],
        lineNumbers: true,
        theme: 'paraiso-dark',
        viewportMargin: Infinity
      });
      // Postponed feature - dynamic code changing
      editor.on('changes', function (instance, changeObj){
        // Propagate the event up the scope tree.
        // http://toddmotto.com/all-about-angulars-emit-broadcast-on-publish-subscribing/
        if(scope.file.split('/').pop() === 'index.html'){
          scope.$emit('htmlChange', editor.getValue());
        }
      });
      scope.$watch('content', function(data){
        if(data) {
          editor.setValue(data);
        }
      });
    }
  };
});

// Display video from the camera on the video element.
// Example code from http://www.html5rocks.com/en/tutorials/getusermedia/intro/
// navigator.getUserMedia  = navigator.getUserMedia ||
//                           navigator.webkitGetUserMedia ||
//                           navigator.mozGetUserMedia ||
//                           navigator.msGetUserMedia;

// navigator.getUserMedia({ video: true }, function (localMediaStream) {
//   var video = document.querySelector('video');
//   video.src = window.URL.createObjectURL(localMediaStream);
// }, function (e) {
//   console.log("Error " + e);
// });
