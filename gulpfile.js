
var gulp = require('gulp')
  , nodemon = require('gulp-nodemon')

// nodemon
gulp.task('nodemon', function () {
  nodemon({ script: 'web.js', ext: 'html js', ignore: ['ignored.js'] })
    .on('restart', function () {
      console.log('restarted!')
    })
})

gulp.task('default', ['nodemon'])
