
(function () {
    'use strict';

    var VERSION = '0.5';

    if (window.KPSyncDiagnosticLoaded) return;
    window.KPSyncDiagnosticLoaded = true;

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

        add('Версия', VERSION);

        add('Среда', [
            'User Agent: ' + navigator.userAgent,
            'Lampa: ' + typeof L,
            'jQuery: ' + typeof window.$,
            'Fetch: ' + typeof window.fetch,
            'XHR: ' + typeof window.XMLHttpRequest,
            'LocalStorage: ' + typeof window.localStorage
        ].join('\n'));

        add('Lampa modules',
            L ? Object.keys(L).join(', ') : 'Lampa не найдена');

        add('Reguest', L ? methods(L.Reguest) : 'Нет Lampa');

        if (L && L.Reguest) {
            try {
                add('Reguest instance', methods(new L.Reguest()));
            } catch (e) {
                add('Reguest error', e.message);
            }
        }

        add('Storage', L ? methods(L.Storage) : 'Нет Lampa');
        add('Listener', L ? methods(L.Listener) : 'Нет Lampa');
        add('Modal', L ? methods(L.Modal) : 'Нет Lampa');
        add('Noty', L ? methods(L.Noty) : 'Нет Lampa');
        add('Ошибки', window.__kpErrors.join('\n') || 'Нет');

        var old = document.getElementById('kp-sync-report');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'kp-sync-report';
        overlay.tabIndex = -1;

        overlay.style.cssText =
            'position:fixed;z-index:2147483647;' +
            'top:0;left:0;width:100%;height:100%;' +
            'background:#151515;color:white;' +
            'padding:25px;box-sizing:border-box;' +
            'display:flex;flex-direction:column;overflow:hidden;';

        var close = document.createElement('button');
        close.textContent = 'ЗАКРЫТЬ';
        close.style.cssText =
            'font-size:22px;padding:15px 30px;' +
            'margin-bottom:15px;flex-shrink:0;';

        var pre = document.createElement('pre');
        pre.textContent = report.join('\n\n');
        pre.style.cssText =
            'flex:1;overflow:hidden;white-space:pre-wrap;' +
            'overflow-wrap:anywhere;font-size:16px;' +
            'line-height:1.5;margin:0;color:white;';

        overlay.appendChild(close);
        overlay.appendChild(pre);
        document.body.appendChild(overlay);

        function remove() {
            document.removeEventListener('keydown', keyHandler, true);
            overlay.remove();
        }

        function keyHandler(e) {
            var key = e.key;
            var code = e.keyCode;

            if (
                key === 'Escape' || key === 'Backspace' ||
                code === 4 || code === 27 || code === 8
            ) {
                e.preventDefault();
                e.stopImmediatePropagation();
                remove();
                return;
            }

            if (
                key === 'ArrowDown' || key === 'ArrowUp' ||
                key === 'PageDown' || key === 'PageUp'
            ) {
                e.preventDefault();
                e.stopImmediatePropagation();

                pre.scrollTop +=
                    key === 'ArrowDown' ? 100 :
                    key === 'ArrowUp' ? -100 :
                    key === 'PageDown' ? 400 : -400;

                return;
            }

            if (key === 'Enter' || code === 23 || code === 66) {
                e.preventDefault();
                e.stopImmediatePropagation();

                if (document.activeElement === close) remove();
            }
        }

        document.addEventListener('keydown', keyHandler, true);

        close.onclick = remove;
        close.focus();

        window.KPSyncReport = {
            text: report.join('\n\n'),
            close: remove
        };
    }

    window.__kpErrors = [];

    window.addEventListener('error', function (e) {
        window.__kpErrors.push(
            e.message + ' (' + e.filename + ':' + e.lineno + ')'
        );
    });

    window.addEventListener('unhandledrejection', function (e) {
        window.__kpErrors.push('Promise: ' + String(e.reason));
    });

    function init() {
        try {
            if (!window.$ || !window.Lampa) return;

            var menu = $('.menu .menu__list').eq(0);

            if (!menu.length) {
                console.error('[KP Sync] Menu not found');
                return;
            }

            if ($('#kp-sync-menu').length) return;

            var item = $(
                '<li id="kp-sync-menu" class="menu__item selector">' +
                '<div class="menu__ico">KP</div>' +
                '<div class="menu__text">KP Diagnostic ' +
                VERSION + '</div></li>'
            );

            item.on('hover:enter', diagnose);
            menu.append(item);

            console.log('[KP Sync] Initialized', VERSION);

        } catch (e) {
            console.error('[KP Sync] Init error', e);
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
