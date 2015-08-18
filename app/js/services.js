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
  .factory('searchService', ['es', '$resource', '$q',function(es, $resource, $q) {
    return {
      'fullTextSearch': function(from, size, artist_text, album_text, label_text, year) {
        var should = [];
        console.log('Params: ' + artist_text + " " + album_text + " " + label_text + " " + year);
        if (artist_text && artist_text != "") {
          should.push({
            'nested': {
              'path': 'album.artist',
              'query': {
                'match': {
                  'album.artist.name.start': {
                    'query': artist_text,
                    'operator': 'AND',
                    'fuzziness': 'AUTO'
                  }
                }
              }
            }
          });
        }
        if (album_text && album_text != "") {
          should.push({
            'nested': {
              'path': 'album',
              'query': {
                'match': {
                  'album.name.start': {
                    'query': label_text,
                    'operator': 'AND',
                    'fuzziness': 'AUTO'
                  }
                }
              }
            }
          });
        }
        if (label_text && label_text != "") {
          should.push({
            'nested': {
              'path': 'label',
              'query': {
                'match': {
                  'label.name.start': {
                    'query': label_text,
                    'operator': 'AND',
                    'fuzziness': 'AUTO'
                  }
                }
              }
            }
          });
        }
        if (year && year != "") {
          should.push({
            'nested': {
              'path': 'album',
              'query': {
                'match': {
                  'album.year': {
                    'query': parseInt(year)
                  }
                }
              }
            }
          });
        }

        return es.search({
          index: 'musicrelease',
          type: 'release',
          body: {
            'from': from,
            'size': size,
            'query': {
              'bool': {
                'should': should,
                'minimum_should_match': should.length,
                'boost': 1.0
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
              'name',
              'album.year'
            ],
            'query': {
              'multi_match': {
                'query': text,
                'fuzziness': 1.1,
                'slop': 2,
                'type': 'most_fields',
                'fields': ['name']
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
        var deferredObject = $q.defer();
        var url = "/player/api/v1/node?method=createalbumnode&apikey=g353qi2015836n17053308p_55cc6a80f61e46c34d000430&artist=" + encodeURI(artist) + "&album=" + encodeURI(album);
        $resource(url).get().$promise.then(function(res) {
          console.log("Musicnodes Status: " + res.status);
          if (res.status === 'ok') {
            console.log("nodeId: " + res.node.id);
            var value = res.node.id;
            deferredObject.resolve(value);
          } else {
            deferredObject.resolve(null);
          }
        }, function(res) {
          deferredObject.resolve(null);
        });
        return deferredObject.promise;
      }
    }
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
