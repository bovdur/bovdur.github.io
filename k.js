
(function () {
    'use strict';

    var SERVER = 'http://192.168.1.17:8787/health';
    var ICON = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v16H4z"/></svg>';

    function openTest() {
        Lampa.Modal.open({
            title: 'KP Sync: проверка сервера',
            html: '<div id="kp-sync-result" style="padding:20px;color:#fff;font-size:18px;">Проверяем соединение...</div>',
            size: 'large'
        });

        fetch(SERVER, { method: 'GET', cache: 'no-store' })
            .then(function (response) {
                return response.text().then(function (body) {
                    var el = document.getElementById('kp-sync-result');
                    if (el) {
                        el.textContent = 'HTTP: ' + response.status + '\n\n' + body;
                    }
                });
            })
            .catch(function (error) {
                var el = document.getElementById('kp-sync-result');
                if (el) {
                    el.textContent = 'Ошибка запроса:\n' + String(error);
                }
            });
    }

    function init() {
        if (window.kp_sync_test_ready) return;
        window.kp_sync_test_ready = true;

        if (!Lampa.Menu || !Lampa.Menu.addButton) {
            console.log('KP Sync: Lampa.Menu.addButton unavailable');
            return;
        }

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
