
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      dev: {
        src: 'src/js/app.settings.dev.js',
        dest: 'public/js/app.settings.js'
      },
      prod: {
        src: 'src/js/app.settings.prod.js',
        dest: 'public/js/app.settings.js'
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('dev', ['copy:dev']);
  grunt.registerTask('prod', ['copy:prod']);
  grunt.registerTask('default', ['copy:dev']);
}