(function () {
    'use strict';

    var URL = 'http://192.168.1.17:8787/health';

    function showResult(text) {
        Lampa.Modal.open({
            title: 'KP Sync: проверка сервера',
            html: '<div style="padding:20px;white-space:pre-wrap;word-break:break-word;color:#fff;font-size:18px;">' +
                text +
                '</div>',
            size: 'large'
        });
    }

    function startTest() {
        showResult('Проверяем соединение с Orange Pi...');

        fetch(URL, {
            method: 'GET',
            cache: 'no-store'
        })
        .then(function (response) {
            return response.text().then(function (body) {
                showResult(
                    'HTTP: ' + response.status +
                    '\n\nОтвет сервера:\n' + body
                );
            });
        })
        .catch(function (error) {
            showResult(
                'ОШИБКА СОЕДИНЕНИЯ\n\n' +
                String(error) +
                '\n\nВозможная причина: блокировка HTTP-запросов или недоступность локального адреса.'
            );
        });
    }

    if (window.Lampa) {
        Lampa.Component.add('kp_sync_test', function () {
            return {
                create: function () {
                    startTest();
                }
            };
        });

        startTest();
    }
})();
