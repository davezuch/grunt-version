/*
 * grunt-version
 * https://github.com/whoadave/grunt-version
 *
 * Copyright (c) 2014 David Zuch
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('version', 'Inject version number into build files for cache-busting and version-specific code.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
          version: '0.1.0',
          versionFromFile: false,
          globalNamespace: false,
          globalNamespaceProp: 'version',
          resourceDefinitions: [{
            tag: 'script',
            prop: 'src'
          }, {
            tag: 'link',
            prop: 'href'
          }]
        }),
        version = getVersion();

    grunt.log.writeln('Version set to: ' + version);

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {

      var src;
      // Iterate over each file in group.
      f.src.forEach(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
        } else {
          grunt.log.writeln('Processing file: "' + filepath + '"');
          src = processFile(filepath);
        }
      });

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });

    // Read file and split into array of lines
    function splitFile(filepath) {
      return grunt.util.normalizelf(grunt.file.read(filepath)).split(grunt.util.linefeed);
    }

    // Process the given file and output to destination
    function processFile(filepath) {
      // If globalNamespace is true, grab regexp
      var nsr = options.globalNamespace && buildNamespaceRegExp(),
          lines = splitFile(filepath);

      // Iterate over and run regexp on each line then concat back together
      return lines.map(function(l) {
        // Iterate over and run regexp for each resource type
        options.resourceDefinitions.forEach(function(def) {
          var rgx = buildRegExp(def);
          l = l.replace(rgx, '$1?v=' + version + '$2');
        });

        if(nsr) {
          l = l.replace(/<script>\/\/version<\/script>/, nsr);
        }
        return l;
      }).join(grunt.util.linefeed);
    }

    // Build a regular expresssion based off of a resource definition (options.resourceDefinitions)
    function buildRegExp(def) {
      return new RegExp('(<' + def.tag + ' .*' + def.prop + '="[^"]+)(".*>(</' + def.tag + '>)?)');
    }

    // Generate replace value to inject version as property in global namespaced object
    function buildNamespaceRegExp() {
      var g = options.globalNamespace,
          p = options.globalNamespaceProp;

      return '<script>window.#G = window.#G || {}; #G.#P = #V</script>'
            .replace(/#G/g, g)
            .replace(/#P/, p)
            .replace(/#V/, version);
    }

    // If options.versionFromFile is true, read version from file
    function getVersion() {
      return options.versionFromFile ? splitFile(options.version)[0] : options.version;
    }
  });

};
