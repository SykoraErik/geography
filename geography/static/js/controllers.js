(function() {
  'use strict';
  /* Controllers */
  angular.module('blindMaps.controllers', [])

  .controller('AppCtrl', ['$scope', '$rootScope', 'user', 'pageTitle', 'configService',
      function($scope, $rootScope, user, pageTitle, configService) {
    $rootScope.configService = configService;
    
    $rootScope.initTitle = function (title) {
      $rootScope.initialTitle = title;
      $rootScope.title = title;
    };
    
    $rootScope.$on("$routeChangeStart", function(event, next) {
      $rootScope.title = pageTitle(next) + $rootScope.initialTitle;
    });
    
    var updateUser = function(data) {
      $rootScope.user = data;
    };
    
    $scope.initLanguageCode = function (code) {
      $rootScope.LANGUAGE_CODE = code;
    };

    $scope.initUser = function (data) {
      $rootScope.user = user.initUser(data);
    };

    $rootScope.logout = function() {
      $rootScope.user = user.logout(updateUser);
    };

  }])

  .controller('AppView', ['$scope', '$routeParams', '$filter', 'flashcardService', 'mapTitle',
      function($scope, $routeParams, $filter, flashcardService, mapTitle) {
    $scope.part = $routeParams.part;
    var user = $routeParams.user || '';
    $scope.typeCategories = [{
      types: ['state']
      }
    ]; // flashcardService.getCategories($scope.part);
    

    var filter = {
      'part' : $scope.part,
    };
    flashcardService.getFlashcards(filter).
      success(function(data){
        console.log(data.data);
        updatePlaces(data.data);
      }).
      error(function(){
        $scope.error = true;
      });

    $scope.placeClick = function(place) {
      $scope.imageController.highlightItem(place.code);
    };
    
    $scope.updateMap = function(type) {
      type.hidden = !type.hidden; 
      $scope.imageController.updateItems($scope.placesTypes);
    };
    
    $scope.updateCat = function(category) {
      var newHidden = !category.hidden;
      angular.forEach($scope.typeCategories, function(type) {
        type.hidden = true;
      });
      angular.forEach($scope.placesTypes, function(type) {
        type.hidden = true;
      });
      category.hidden = newHidden;
      updatePlaces($scope.placesTypes);
    };

    function updatePlaces(data) {
      $scope.placesTypes = data;
      angular.forEach($scope.typeCategories, function(category) {
        var filteredTypes = $filter('isTypeCategory')($scope.placesTypes, category);
        angular.forEach(filteredTypes, function(type) {
          type.hidden = category.hidden;
        });
      });
      $scope.imageController.updateItems($scope.placesTypes);
      $scope.name = mapTitle($scope.part, user);
    }
  }])

  .controller('AppPractice', ['$scope', '$routeParams', '$timeout', '$filter',
      'practiceService', 'user', 'events', 'colors', 'places', '$', 'highlighted', 'categoryService',
      function($scope, $routeParams, $timeout, $filter,
      practiceService, user, events, colors, places, $, highlighted, categoryService) {
    $scope.part = $routeParams.part;
    $scope.placeType = $routeParams.place_type;
    $scope.progress = 0;
    
    places.practicing($scope.part, $scope.placeType);

    $scope.highlight = function() {
      var active = $scope.question;
      $scope.layer = $scope.imageController.getLayerContaining(active.description);
      $scope.imageController.highLightLayer($scope.layer);
      $scope.imageController.placeToFront(active.description);
      if ($filter('isPickNameOfType')($scope.question)) {
        $scope.imageController.highlightItem(active.description, colors.NEUTRAL);
      }
      if ($filter('isFindOnMapType')($scope.question) && active.options) {
        var codes = active.options.map(function(option) {
          return option.code;
        });
        highlighted.setHighlighted(codes);
        $scope.imageController.highlightItems(codes, colors.NEUTRAL);
      }
    };

    $scope.checkAnswer = function(selected) {
      var asked = $scope.question.description;
      highlightAnswer(asked, selected);
      $scope.question.answered_code = selected;
      // $scope.progress = 
      practiceService.saveAnswerToCurrentFC(42, 1000);//TODO real params
      user.addAnswer(asked == selected);
      if (asked == selected) {
        $timeout(function() {
          $scope.next();
        }, 700);
      } else {
        $scope.canNext = true;
      }
    };

    $scope.next = function() {
      if ($scope.progress < 100) {
        practiceService.getFlashcard().then(function(q) {
          console.log(q);
          setQuestion(q);
        }, function(){
          $scope.error = true;
        });
      } else {
        setupSummary();
      }
    };

    function highlightAnswer (asked, selected) {
      if ($filter('isFindOnMapType')($scope.question)) {
        $scope.imageController.highlightItem(asked, colors.GOOD);
      }
      $scope.imageController.highlightItem(selected, asked == selected ? colors.GOOD : colors.BAD);
      if ($filter('isPickNameOfType')($scope.question) && $scope.question.options) {
        highlightOptions(selected);
      }
    }

    function setupSummary() {
      $scope.question.slideOut = true;
      $scope.layer = undefined;
      // prevents additional points gain. issue #38
      $scope.summary = practiceService.summary();
      $scope.showSummary = true;
      $scope.imageController.clearHighlights();
      $scope.imageController.hideLayers();
      $scope.imageController.showSummaryTooltips($scope.summary.questions);
      angular.forEach($scope.summary.questions, function(q) {
        var correct = q.description == q.answered_code;
        $scope.imageController.showLayerContaining(q.description);
        $scope.imageController.highlightItem(q.description, correct ? colors.GOOD : colors.BAD, 1);
      });
      $("html, body").animate({ scrollTop: "0px" });
      events.emit('questionSetFinished', user.getUser().answered_count);
    }

    function setQuestion(active) {
      if ($scope.question) {
        $scope.question.slideOut = true;
      }
      $scope.question = active;
      $scope.questions.push(active);
      $scope.imageController.clearHighlights();
      $scope.highlight();
      $scope.canNext = false;
    }

    function highlightOptions(selected) {
      $scope.question.options.map(function(o) {
        o.correct = o.code == $scope.question.description;
        o.selected = o.code == selected;
        o.disabled = true;
        return o;
      });
    }

    function isInActiveLayer(code) {
      console.log($scope.layer);
      return $scope.layer == $scope.imageController.getLayerContaining(code);
    }
    
    $scope.mapCallback = function() {
      practiceService.initSet('common');
      var cat = categoryService.getCategory($scope.part);
      var filter = {
        // categories : [cat.id],
        // TODO identifier missing in categoreis
        contexts : [$routeParams.part],
      };
      if ($routeParams.place_type) {
        filter.types = [$routeParams.place_type];
      }
      practiceService.setFilter(filter);
      practiceService.getFlashcard().then(function(q) {
        $scope.questions = [];
        console.log(q);
        setQuestion(q);
      }, function(){
        $scope.error = true;
      });
      $scope.imageController.onClick(function(code) {
        if ($filter('isFindOnMapType')($scope.question) && 
            !$scope.canNext && 
            $filter('isAllowedOption')($scope.question, code) &&
            isInActiveLayer(code)) {
          $scope.checkAnswer(code);
          $scope.$apply();
        }
      });
    };
  }])

  .controller('AppOverview', ['$scope', 'places', '$http', '$routeParams',
      function($scope, places, $http, $routeParams) {

    var mapSkills = {};

    $scope.user = $routeParams.user || '';
    $scope.places = places;
    $http.get('/mapskill/' + $scope.user).success(function(data){
      angular.forEach(data, function(p){
        mapSkills[p.code] = mapSkills[p.code] || {};
        mapSkills[p.code][p.type] = p;
      });
      $scope.mapSkillsLoaded = true;
    });
    places.getOverview().success(function(data){
      $scope.mapCategories = data;
    });

    $scope.mapSkills = function(code, type) {
      if (!$scope.mapSkillsLoaded) {
        return;
      }
      var defalut = {
        count : 0
      };
      if (!type) {
        return avgSkills(mapSkills[code]);
      }
      return (mapSkills[code] && mapSkills[code][type]) || defalut;
    };
    
    function avgSkills(skills) {
      var learned = 0;
      var practiced = 0;
      for (var i in skills){
        var p = skills[i];
        learned += p.learned;
        practiced += p.practiced;
      }
      var avg = {
        learned : learned,
        practiced : practiced,
      };
      return avg;
    }
  }])

  .controller('AppConfused', ['$scope', '$http',
      function($scope, $http){
    $http.get('/confused/').success(function(data){
      angular.forEach(data, function(p){
        p.wrongRatio = p.mistake_count / p.asked_count;
      });
      $scope.confused = data;
      $scope.loaded = true;
    }).error(function(){
      $scope.loaded = true;
      $scope.error = true;
    });
  }])
  
  .controller('ReloadController', ['$window', function($window){
    $window.location.reload();
  }]);
}());