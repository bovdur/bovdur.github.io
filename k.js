
(function () {
    'use strict';

    if (window.KPSyncScreenDiagnostic) return;
    window.KPSyncScreenDiagnostic = true;

    function methods(obj) {
        if (!obj) return 'Недоступно';

        var result = [];
        var current = obj;

        try {
            while (current && current !== Object.prototype) {
                Object.getOwnPropertyNames(current).forEach(function (name) {
                    if (result.indexOf(name) === -1) {
                        result.push(name);
                    }
                });
                current = Object.getPrototypeOf(current);
            }
        } catch (e) {
            result.push('ERROR: ' + e.message);
        }

        return result.sort().join(', ');
    }

    function diagnose() {
        var L = window.Lampa;
        var report = [];

        function add(title, value) {
            report.push('=== ' + title + ' ===\n' + value);
        }

        add('Версия диагностики', '0.3');

        add('Среда', [
            'User Agent: ' + navigator.userAgent,
            'Lampa: ' + typeof L,
            'jQuery: ' + typeof window.$,
            'Fetch: ' + typeof fetch,
            'XHR: ' + typeof XMLHttpRequest,
            'LocalStorage: ' + typeof localStorage
        ].join('\n'));

        add('Lampa modules', L ?
            Object.keys(L).join(', ') : 'Lampa не найден');

        add('Reguest', L ? methods(L.Reguest) : 'Нет Lampa');

        if (L && L.Reguest) {
            try {
                add('Reguest instance', methods(new L.Reguest()));
            } catch (e) {
                add('Reguest constructor error', e.message);
            }
        }

        add('Storage', L ? methods(L.Storage) : 'Нет Lampa');
        add('Listener', L ? methods(L.Listener) : 'Нет Lampa');
        add('Modal', L ? methods(L.Modal) : 'Нет Lampa');
        add('Noty', L ? methods(L.Noty) : 'Нет Lampa');

        add('Глобальные ошибки', window.__kpErrors.join('\n') || 'Нет');

        var text = report.join('\n\n');

        var old = document.getElementById('kp-sync-report');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'kp-sync-report';

        overlay.style.cssText =
            'position:fixed;z-index:999999;top:3%;left:3%;' +
            'width:94%;height:94%;background:#151515;color:#fff;' +
            'padding:20px;box-sizing:border-box;overflow:auto;' +
            'font-size:17px;font-family:monospace;';

        var close = document.createElement('button');
        close.textContent = 'ЗАКРЫТЬ';
        close.style.cssText =
            'font-size:20px;padding:12px 30px;margin-bottom:15px;';

        close.onclick = function () {
            overlay.remove();
        };

        var pre = document.createElement('pre');
        pre.textContent = text;
        pre.style.cssText =
            'white-space:pre-wrap;overflow-wrap:anywhere;' +
            'font-size:14px;line-height:1.5;';

        overlay.appendChild(close);
        overlay.appendChild(pre);
        document.body.appendChild(overlay);
    }

    window.__kpErrors = [];

    window.addEventListener('error', function (e) {
        window.__kpErrors.push(
            'ERROR: ' + e.message + ' | ' + e.filename + ':' + e.lineno
        );
    });

    window.addEventListener('unhandledrejection', function (e) {
        window.__kpErrors.push(
            'PROMISE: ' + String(e.reason)
        );
    });

    function init() {
        try {
            var menu = $('.menu .menu__list').eq(0);

            if (!menu.length) return;

            var item = $('<li class="menu__item selector">' +
                '<div class="menu__ico">KP</div>' +
                '<div class="menu__text">KP Diagnostic 0.3</div>' +
                '</li>');

            item.on('hover:enter', diagnose);
            menu.append(item);

        } catch (e) {
            console.error('[KP Sync]', e);
        }
    }

    if (window.appready) {
        init();
    } else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();
