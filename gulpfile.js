const { src, dest, parallel, series, watch } = require('gulp');


const uglify = require('gulp-uglify-es').default; //модуль uglify - сжимает файлы
const browserSync = require('browser-sync').create(),
    concat = require('gulp-concat'),
    scss = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cleancss = require('gulp-clean-css'),
    imagemin = require('gulp-imagemin'),
    newer = require('gulp-newer'),
    del = require('del'),
    nunjucks = require('gulp-nunjucks');


function browsersync() {
    browserSync.init({
        server: {
            baseDir: "app/"
        },
        notify: false,  //Откл ошибок
        online: true   //Возможеость работать без сети интернет, но тогда нет параметра External для просмотра на мобильных устройствах
    })
}

function scripts() {
    //Собираем все фалы js в один далее подключаем все файлы с новой строки
    //concat - является отдельным пакетом gulp
    return src([
        'node_modules/jquery/dist/jquery.min.js',
        'app/js/script.js'
    ])
        .pipe(concat('main.min.js')) //main.min.js - название файла в который будет все собираться
        .pipe(uglify()) //uglify - сжимает файлы
        .pipe(dest('app/js/')) //Куда выгружаем
        .pipe(browserSync.stream()) //Слежение без перезагрузки
}

function styles() {
    return src('app/scss/main.scss')
        .pipe(scss())
        .pipe(concat('style.min.css'))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true

        }))
        .pipe(cleancss(({
            level: {
                1:
                    { specialComments: 0 }
            },
            // format: 'beautify'  //выкл мини
        })))
        .pipe(dest('app/css/'))
        .pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}

function htmlPrepare() {
    return src('app/html/*.html')
        .pipe(nunjucks.compile())
        .pipe(dest('app/./'))
        .pipe(browserSync.stream());
}


//start папка для стартовых изображений
//finished папка для минифицированых изображений
function images() {
    return src('app/images/start/**/*')
        .pipe(browserSync.stream())
        .pipe(newer('app/images/finished/'))
        .pipe(imagemin())
        .pipe(dest('app/images/finished/'))
}

function cleanimg() {
    return del('app/images/finished/**/*', { force: true }) // Удаляем всё содержимое папки "app/images/dest/"
}

//Очищаем папку продакшина
function cleandist() {
    return del('dist/**/*', { force: true }) // Удаляем всё содержимое папки "app/images/dest/"
}

//Копируем файли в продакшин
function buildcopy() {
    return src([
        'app/css/**/*.min.css',
        'app/js/**/*.min.js',
        'app/images/finished/**/*',
        'app/**/*.html',
    ], { base: 'app' })
        .pipe(dest('dist'))
}

function startwatch() {
    watch([
        'app/**/*.js',
        '!app/**/*.min.js'  //! - исключаем фалы для watch, данное правило пишется после строки 'app/**/*.js'
    ], scripts)

    // Мониторим файлы препроцессора на изменения
    watch('app/**/scss/**/*', styles);

    // Мониторим файлы HTML на изменения
    watch([
        'app/html/*.html',
        'app/html/utils/*.html',
    ]).on('change', browserSync.reload);

    // Мониторим папку-источник изображений и выполняем images(), если есть изменения
    watch('app/images/start/**/*', images);
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;

// Экспортируем функцию cleanimg() как таск cleanimg
//Для запуска в консоли gulp cleanimg
exports.cleanimg = cleanimg;

//последовательно собирем проект в продакшин (папка dest)
//series - выполняется последовательно
exports.build = series(cleandist, styles, scripts, images, buildcopy);


exports.dev = parallel(htmlPrepare, styles, scripts, browsersync, startwatch, images) //Вотчинг файлов


// if (process.env.NODE_ENV === 'production') {
//     exports.build = series(
//         gulp.series(
//             cleandist,
//             styles,
//             scripts,
//             images,
//             buildcopy
//         )
//     );
// } else {
//     exports.dev = gulp.parallel(
//         gulp.parallel(
//             styles,
//             scripts,
//             browsersync,
//             startwatch,
//             images
//         )
//     );
// }