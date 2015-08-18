'use strict';

/* Controllers */

angular.module('musicAlbumApp.controllers', ['ui.bootstrap']).
controller('SearchCtrl', ['$scope', 'searchService', function($scope, searchService) {
    $scope.maxSize = 5;
    $scope.currentPage = 1;
    $scope.pageSizes = [{
      count: 5,
      label: '5 ' + $scope.translation.SEARCH_PAGE_RESULT
    }, {
      count: 10,
      label: '10 ' + $scope.translation.SEARCH_PAGE_RESULT
    }, {
      count: 20,
      label: '20 ' + $scope.translation.SEARCH_PAGE_RESULT
    }, {
      count: 50,
      label: '50 ' + $scope.translation.SEARCH_PAGE_RESULT
    }];
    $scope.pageSize = $scope.pageSizes[1]; // 10

    $scope.selectPage = function(page) {
      $scope.fullTextSearch($scope.searchText, page);
    };

    $scope.fullTextSearch = function(search, page) {
      $scope.currentPage = page;
      var from = ($scope.currentPage - 1) * $scope.pageSize.count;
      console.log('Form content: ' + JSON.stringify(search));
      searchService.fullTextSearch(from, $scope.pageSize.count, search.artist, search.album, search.label, search.year).then(
        function(resp) {
          for(let hit of resp.hits.hits){
            console.log("adding node id");
            hit._source.nodeId = searchService.getMusicnodesId(hit._source.album.artist.name, hit._source.album.name);
            console.log("node id added");
          }
          console.log("finished querying");
          $scope.searchResp = resp;
          console.log("Response available");
          console.log(resp);
          $scope.totalItems = resp.hits.total;
        }
      );
    };

    $scope.isAvailableResults = function() {
      console.log("Available called, result: ");
      console.log($scope.searchResp ? true : false);
      console.log("SearchResp:" + JSON.stringify($scope.searchRes));
      return $scope.searchResp ? true : false;
    };

    $scope.isAtLeastOneResult = function() {
      if (!$scope.isAvailableResults()) {
        return false;
      }
      console.log('Total count: ' + $scope.searchResp.hits.total);
      return $scope.searchResp.hits.total > 0;
    };

    $scope.autocomplete = function(text) {
      return searchService.autocomplete(text).then(function(res) {
        var albums = [];
        angular.forEach(res.hits.hits, function(hit) {
          albums.push(hit.fields['album.artist.name'] + ' - ' + hit.fields['album.name'] + ' (' + hit.fields['album.year'] + ')');
        });
        $scope.autocompleteResp = albums;
        return albums;
      });
    };

    $scope.rangeGreaterThanZero = function(range) {
      return range.count > 0;
    };

    $scope.musicnodeId = function(text) {

    }
  }])
  .controller('InfoCtrl', ['$scope', function($scope) {
    $scope.demoUrl = 'http://angular-musicbrainz.javaetmoi.com/';
    $scope.demoSourceUrl = 'https://github.com/arey/angular-musicbrainz';
    $scope.blogArticleUrl = 'http://javaetmoi.com/2014/02/developper-industrialiser-web-app-recherche-angularjs';
  }]);
