
(function () {
    'use strict';

    var SERVER = 'http://192.168.1.17:8787/health';
    var overlay = null;

    var ICON = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>';

    function closeTest() {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
        document.removeEventListener('keydown', onKey);
    }

    function onKey(event) {
        if (event.key === 'Escape' || event.keyCode === 4 || event.keyCode === 27) {
            closeTest();
        }
    }

    function openTest() {
        closeTest();

        overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;z-index:999999;' +
            'background:rgba(0,0,0,.92);display:flex;' +
            'align-items:center;justify-content:center;padding:30px;';

        var panel = document.createElement('div');
        panel.style.cssText =
            'background:#20242b;color:white;padding:30px;' +
            'width:90%;max-width:850px;border-radius:12px;' +
            'font-size:22px;box-sizing:border-box;';

        var title = document.createElement('div');
        title.textContent = 'KP Sync: проверка Orange Pi';
        title.style.cssText = 'font-size:28px;font-weight:bold;margin-bottom:25px;';

        var result = document.createElement('pre');
        result.textContent = 'Проверяем соединение с сервером...';
        result.style.cssText =
            'white-space:pre-wrap;overflow-wrap:anywhere;' +
            'font-size:19px;min-height:100px;';

        var close = document.createElement('button');
        close.textContent = 'Закрыть';
        close.style.cssText =
            'font-size:22px;padding:12px 30px;margin-top:20px;' +
            'background:#444;color:white;border:0;border-radius:6px;';

        close.onclick = closeTest;

        panel.appendChild(title);
        panel.appendChild(result);
        panel.appendChild(close);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        close.focus();
        document.addEventListener('keydown', onKey);

        fetch(SERVER, {
            method: 'GET',
            cache: 'no-store'
        })
        .then(function (response) {
            return response.text().then(function (body) {
                result.textContent =
                    'РЕЗУЛЬТАТ: ' + (response.ok ? 'УСПЕХ' : 'ОШИБКА') +
                    '\nHTTP: ' + response.status +
                    '\n\nОтвет сервера:\n' + body;
            });
        })
        .catch(function (error) {
            result.textContent =
                'ОШИБКА СОЕДИНЕНИЯ\n\n' +
                String(error) +
                '\n\nПроверь доступность сервера и ограничения HTTP в WebView.';
        });
    }

    function init() {
        if (window.kp_sync_test_ready) return;
        window.kp_sync_test_ready = true;

        Lampa.Menu.addButton(ICON, 'KP Sync Test', openTest);
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') init();
        });
    }
})();
