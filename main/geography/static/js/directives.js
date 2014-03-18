(function() {
  'use strict';
  /* Directives */
  angular.module('blindMaps.directives', [])

  .directive('placeLabel', function() {
    return {
      restrict : 'A',
      template : '<i class="flag-{{place.code}}"></i> {{place.name}}',
      compile : function(element) {
        element.addClass('label');
        element.addClass('label-default');
      }
    };
  })

  .directive('blindMap', function(mapControler, places, singleWindowResizeFn, getMapResizeFunction, $parse) {
    return {
      restrict : 'E',
      template : '<div class="map-container">' +
                 '<img class="version" src="static/img/beta.png" alt="Beta verze"/>' +
                  '<div id="map-holder">' +
                      '<div class="loading-indicator" ng-show="loading"></div>' +
                  '</div>' +
                  '<h1 ng-bind="name"></h1>' +
                  '<div class="btn-group-vertical map-switch" data-toggle="buttons" ng-show="!practice" >' +
                    '<a class="btn btn-default atooltip" href="#/view/{{part}}/"' +
                        'ng-class="\'/view/\'+part+\'/\'|isActive"' +
                        'placement="right"' +
                        'title="Moje znalosti">' +
                      '<i class="glyphicon glyphicon-user"></i>' +
                    '</a>' +
                    '<a class="btn btn-default atooltip" href="#/view/{{part}}/average"' +
                        'ng-class="\'/view/\'+part+\'/average\'|isActive"' +
                        'placement="right"' +
                        'title="Průměrný nový uživatel">' +
                      '<i class="glyphicon glyphicon-globe"></i> ' +
                    '</a>' +
                  '</div>' +
                  '<div class="zoom-buttons"></div>'+
                '</div>',
      link : function($scope, elem, attrs) {
        $scope.loading = true;
        $scope.name = places.getName($scope.part);
        $scope.practice = !attrs.showTooltips;
        var showTooltips = attrs.showTooltips !== undefined;

        var map = mapControler($scope.part, showTooltips, elem, function(m) {
          $scope.loading = false;
          var resize = getMapResizeFunction(m, elem, $scope.practice);
          singleWindowResizeFn(resize);
          resize();
          $scope.$eval(attrs.callback);
          $scope.$digest();
        });
        var model = $parse(attrs.map);
        //Set scope variable for the map
        model.assign($scope, map);
      },
      replace : true
    };
  })

  .directive('zoomButtons', function() {
    return {
      restrict : 'C',
      template : '<div class="btn-group zoom-btn" ng-show="!loading">' +
                    '<a class="btn btn-default" id="zoom-out">' +
                      '<i class="glyphicon glyphicon-minus"></i></a>' +
                    '<a class="btn btn-default" id="zoom-in">' +
                      '<i class="glyphicon glyphicon-plus"></i></a>' +
                  '</div>'
    };
  })

  .directive('email', function() {
    return {
      restrict : 'C',
      compile : function(elem) {
        var emailAddress = elem.html();
        emailAddress = emailAddress.replace('{zavinac}', '@');
        emailAddress = '<a href="mailto:' + emailAddress + 
  '">' + emailAddress + 
  '</a>';
        elem.html(emailAddress);
      }
    };
  })

  .directive('atooltip', function() {
    return {
      restrict : 'C',
      link : function($scope, elem, attrs) {
        elem.tooltip({ 'placement' : attrs.placement || 'bottom' });
      }
    };
  })

  .directive('dropLogin', function() {
    return {
      restrict : 'C',
      compile : function(elem) {
        elem.bind('click', function() {
          elem.tooltip('destroy');
          elem.parent().find('.tooltip').remove();
        });
      }
    };
  })

  .directive('points', function($timeout, events) {
    return {
      scope : true,
      restrict : 'C',
      link : function($scope, elem) {
        events.on('userUpdated', function(user) {
          $scope.user = user;
          if (user.points == 1) {
            $timeout(function() {
              elem.tooltip('show');
            }, 0);
          }
        });
      }
    };
  })

  .directive('dropLogin', function($timeout, events) {
    return {
      restrict : 'C',
      link : function($scope, elem) {
        events.on('questionSetFinished', function(points) {
          if (10 < points && points <= 20) {
            $timeout(function() {
              elem.tooltip('show');
            }, 0);
          }
        });
      }
    };
  });
}());