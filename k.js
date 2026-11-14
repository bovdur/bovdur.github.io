
(function () {
    'use strict';

    if (window.KPNetworkTestLoaded) return;
    window.KPNetworkTestLoaded = true;

    function showReport(text) {
        var old = document.getElementById('kp-net-report');
        if (old) old.remove();

        var box = document.createElement('div');
        box.id = 'kp-net-report';

        box.style.cssText =
            'position:fixed;z-index:999999;inset:0;' +
            'background:#151515;color:white;padding:25px;' +
            'display:flex;flex-direction:column;';

        var close = document.createElement('button');
        close.textContent = 'ЗАКРЫТЬ';
        close.style.cssText = 'padding:15px;font-size:22px;';

        var pre = document.createElement('pre');
        pre.textContent = text;
        pre.style.cssText =
            'overflow:auto;white-space:pre-wrap;' +
            'font-size:16px;line-height:1.5;flex:1;';

        box.appendChild(close);
        box.appendChild(pre);
        document.body.appendChild(box);

        function remove() {
            document.removeEventListener('keydown', keys, true);
            box.remove();
        }

        function keys(e) {
            if (['Escape', 'Backspace'].indexOf(e.key) >= 0 ||
                e.keyCode === 4) {
                e.preventDefault();
                e.stopImmediatePropagation();
                remove();
            }
        }

        document.addEventListener('keydown', keys, true);
        close.onclick = remove;
        close.focus();
    }

    function runTests() {
        var results = [
            'KP NETWORK TEST 1.0',
            'Проверка нативного HTTP Lampa',
            '==============================',
            ''
        ];

        showReport('Запуск тестов...\nПодожди завершения запросов.');

        function finish() {
            showReport(results.join('\n'));
        }

        function test(url, name, next) {
            results.push('Проверка: ' + name);
            results.push('URL: ' + url);

            var req = new Lampa.Reguest();
            req.timeout(20000);

            var done = false;

            function complete(status, data) {
                if (done) return;
                done = true;

                results.push('Результат: ' + status);

                if (data !== undefined) {
                    var output;

                    try {
                        output = typeof data === 'string'
                            ? data
                            : JSON.stringify(data);
                    } catch (e) {
                        output = String(data);
                    }

                    results.push(
                        'Ответ: ' + String(output).substring(0, 600)
                    );
                }

                results.push('');
                next();
            }

            try {
                req.native(
                    url,
                    function (data) {
                        complete('SUCCESS', data);
                    },
                    function (error) {
                        var message;

                        try {
                            message = JSON.stringify(error);
                        } catch (e) {
                            message = String(error);
                        }

                        complete('ERROR', message);
                    },
                    false,
                    { dataType: 'text' }
                );
            } catch (e) {
                complete('EXCEPTION', e.message);
            }
        }

        test(
            'https://httpbin.org/json',
            'Контрольный сервер HTTPBin',
            function () {
                test(
                    'https://www.kinopoisk.ru/',
                    'Сайт Кинопоиска',
                    finish
                );
            }
        );
    }

    function init() {
        var menu = $('.menu .menu__list').eq(0);

        if (!menu.length || $('#kp-network-test').length) return;

        var item = $(
            '<li id="kp-network-test" class="menu__item selector">' +
            '<div class="menu__ico">KP</div>' +
            '<div class="menu__text">KP Network Test</div>' +
            '</li>'
        );

        item.on('hover:enter', runTests);
        menu.append(item);
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();
