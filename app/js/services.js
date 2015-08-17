'use strict';

/* Services */

angular.module('musicAlbumApp.services', ['ngResource'])
  .value('version', '1.0')
  // elasticsearch.angular.js creates an elasticsearch
  // module, which provides an esFactory
  .service('es', ['esFactory', function(esFactory) {
    return esFactory({
      hosts: [
        // you may use localhost:9200 with a local Elasticsearch cluster
        'localhost:3000/esapi'
      ],
      log: 'trace',
      sniffOnStart: false
    });
  }])
  .factory('searchService', ['es', '$resource', function(es, $resource) {
    return {
      'fullTextSearch': function(from, size, text) {
        return es.search({
          index: 'musicrelease',
          type: 'release',
          body: {
            'from': from,
            'size': size,
            'query': {
              'multi_match': {
                'query': text,
                'fuzziness': 1.1,
                'slop': 2,
                'type': 'most_fields',
                'fields': ['album.artist.name', 'name']
              }
            },
            'facets': {
              'artist_type': {
                'terms': {
                  'field': 'album.artist.type_id'
                },
                'nested': 'album.artist'
              },
              'album_rating': {
                'histogram': {
                  'key_field': 'album.rating.score',
                  'interval': 21
                },
                'nested': 'album.rating'
              },
              'album_year': {
                'range': {
                  'field': 'album.year',
                  'ranges': [{
                    'to': 1970
                  }, {
                    'from': 1970,
                    'to': 1980
                  }, {
                    'from': 1980,
                    'to': 1990
                  }, {
                    'from': 1990,
                    'to': 1995
                  }, {
                    'from': 1995,
                    'to': 2000
                  }, {
                    'from': 2000,
                    'to': 2005
                  }, {
                    'from': 2005,
                    'to': 2010
                  }, {
                    'from': 2010,
                    'to': 2011
                  }, {
                    'from': 2011,
                    'to': 2012
                  }, {
                    'from': 2012,
                    'to': 2013
                  }, {
                    'from': 2013,
                    'to': 2014
                  }, {
                    'from': 2014,
                    'to': 2015
                  }, {
                    'from': 2015
                  }]
                },
                'nested': 'album'
              }
            }
          }
        });
      },

      'autocomplete': function(text) {
        return es.search({
          index: 'musicrelease',
          type: 'release',
          body: {
            'fields': [
              'album.artist.name',
              'id',
              'album.name',
              'album.year'
            ],
            'query': {
              'query_string': {
                'fields': [
                  'name',
                  'album.artist.name',
                  'name.start'
                ],
                'query': text,
                'use_dis_max': false,
                'auto_generate_phrase_queries': true,
                'default_operator': 'OR'
              }
            },
            'highlight': {
              'number_of_fragments': 0,
              'pre_tags': [
                '<b>'
              ],
              'post_tags': [
                '</b>'
              ],
              'fields': {
                'album.artist.name': {},
                'name.start': {},
                'album.year.string': {}
              }
            }
          }
        });
      },
      'getMusicnodesId': function(artist, album) {
        var url = "/player/api/v1/node?method=createalbumnode&apikey=g353qi2015836n17053308p_55cc6a80f61e46c34d000430&artist=" + encodeURI(artist) + "&album=" + encodeURI(album);
        return $resource(url).get().$promise;
      }
    };
  }])
  .value('userLanguage', {
    getFirstLanguageRange: function(acceptLang) {
      if (acceptLang === undefined) {
        return undefined;
      }
      var languages = acceptLang.split(',');
      var firstLangRangeMaybeQuota = languages[0];
      var firstLangRange = firstLangRangeMaybeQuota.split(';');
      if (firstLangRange) {
        return firstLangRange[0];
      }
      return firstLangRangeMaybeQuota;
    },
    getLanguage: function(languageRange) {
      var extractPartsReg = /^([\w\*]*)(-(\w*))?.*$/i;

      var match = languageRange.trim().match(extractPartsReg);

      if (!match) {
        return undefined;
      }
      // parse language
      var parseLangReg = /^([a-z]{2}|\*)$/i;
      var lang = match[1];
      if (lang) {
        var langMatch = lang.match(parseLangReg);
        if (langMatch) {
          return langMatch[0].toLowerCase();
        }
      }
      return undefined;
    }
  }).service('translation', ['$resource', function($resource) {
    this.getTranslation = function($scope, language) {
      var languageFilePath = 'i18n/app-locale_' + language + '.json';
      $resource(languageFilePath).get(function(data) {
        $scope.translation = data;
      });
    };
  }]);
