
(function () {
    'use strict';

    if (window.KPNetworkTestLoaded) return;
    window.KPNetworkTestLoaded = true;

    var pages = [];
    var current = 0;
    var overlay;

    function render() {
        if (!overlay) return;

        overlay.innerHTML = '';

        var header = document.createElement('div');
        header.textContent = 'KP NETWORK TEST 1.1';
        header.style.cssText = 'font-size:24px;margin-bottom:15px;';

        var content = document.createElement('pre');
        content.textContent = pages[current] || 'Ожидание...';
        content.style.cssText =
            'flex:1;white-space:pre-wrap;overflow-wrap:anywhere;' +
            'font-size:17px;line-height:1.5;margin:0;' +
            'color:white;overflow:hidden;';

        var controls = document.createElement('div');
        controls.style.cssText =
            'display:flex;gap:15px;margin-top:15px;';

        function button(label, action, disabled) {
            var b = document.createElement('button');
            b.textContent = label;
            b.disabled = !!disabled;
            b.style.cssText =
                'flex:1;padding:15px;font-size:19px;';
            b.onclick = action;
            controls.appendChild(b);
            return b;
        }

        button('НАЗАД', function () {
            current = Math.max(0, current - 1);
            render();
        }, current === 0);

        var next = button(
            current === pages.length - 1 ? 'ЗАКРЫТЬ' : 'ДАЛЕЕ',
            function () {
                if (current < pages.length - 1) {
                    current++;
                    render();
                } else {
                    close();
                }
            }
        );

        var counter = document.createElement('div');
        counter.textContent =
            'Страница ' + (current + 1) + ' / ' + pages.length;
        counter.style.cssText =
            'font-size:15px;text-align:center;margin-top:12px;';

        overlay.appendChild(header);
        overlay.appendChild(content);
        overlay.appendChild(controls);
        overlay.appendChild(counter);

        next.focus();
    }

    function close() {
        document.removeEventListener('keydown', keyHandler, true);
        if (overlay) overlay.remove();
        overlay = null;
    }

    function keyHandler(e) {
        if (!overlay) return;

        if (e.key === 'Escape' || e.key === 'Backspace' ||
            e.keyCode === 4 || e.keyCode === 27) {
            e.preventDefault();
            e.stopImmediatePropagation();
            close();
        }
    }

    function addPage(title, url, status, data) {
        var text = title + '\n\n';
        text += 'URL: ' + url + '\n\n';
        text += 'Результат: ' + status + '\n\n';

        if (data !== undefined) {
            text += 'Ответ:\n';

            if (typeof data === 'string') {
                text += data.substring(0, 1800);
            } else {
                try {
                    text += JSON.stringify(data, null, 2)
                        .substring(0, 1800);
                } catch (e) {
                    text += String(data);
                }
            }
        }

        pages.push(text);
        current = pages.length - 1;
        render();
    }

    function test(url, title, next) {
        var req = new Lampa.Reguest();
        req.timeout(20000);

        var completed = false;

        function finish(status, data) {
            if (completed) return;
            completed = true;
            addPage(title, url, status, data);
            if (next) next();
        }

        try {
            req.native(
                url,
                function (data) {
                    finish('SUCCESS', data);
                },
                function (error) {
                    finish('ERROR', error);
                },
                false,
                { dataType: 'text' }
            );
        } catch (e) {
            finish('EXCEPTION', e.message);
        }
    }

    function runTests() {
        pages = [];
        current = 0;

        overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;z-index:2147483647;' +
            'inset:0;background:#151515;color:white;' +
            'padding:25px;box-sizing:border-box;' +
            'display:flex;flex-direction:column;';

        document.body.appendChild(overlay);
        document.addEventListener('keydown', keyHandler, true);

        pages.push('Запускаем проверку HTTPBin...');
        render();

        test(
            'https://httpbin.org/json',
            'ТЕСТ 1. HTTPBIN',
            function () {
                test(
                    'https://www.kinopoisk.ru/',
                    'ТЕСТ 2. KINOPOISK',
                    function () {
                        pages.push(
                            'ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ\n\n' +
                            'Передай мне результаты обеих проверок.'
                        );
                        render();
                    }
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
            '<div class="menu__text">KP Network Test 1.1</div>' +
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
