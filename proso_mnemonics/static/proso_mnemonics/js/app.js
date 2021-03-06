(function() {
  'use strict';
  /* Controllers */
  angular.module('proso.mnemonics', ['ui.bootstrap'])

  .value('gettext', gettext)

  .directive('mnemonic', ['gettext', '$http', function (gettext, $http) {
    
    var mnemonics = {};
    $http.get('/proso_mnemonics/').success(function(data) {
      for (var i = 0; i < data.mnemonics.length; i++) {
        var m = data.mnemonics[i];
        mnemonics[m.code] = m.text;
      }
    });

    return {
      restrict: 'A',
      template: '<div ng-show="mnemonics[code]" class="alert alert-info">' +
                  '<i class="glyphicon glyphicon-info-sign"></i> ' +
                  '<strong>' + gettext('Tip na zapamatování:') + ' </strong>' +
                  '{{mnemonics[code]}}' +
                '<div>',
      link: function ($scope, element, attrs) {
        $scope.mnemonics = mnemonics;
        $scope.code = attrs.mnemonic;
      }
    };
  }]);

})();

