
(function () {
    'use strict';

    var PREFIX = '[KP Sync Diagnostic]';

    if (window.kpSyncDiagnosticLoaded) {
        console.log(PREFIX, 'Already loaded');
        return;
    }

    window.kpSyncDiagnosticLoaded = true;

    function log(title, data) {
        console.log(PREFIX, title, data || '');
    }

    function getMethods(obj) {
        if (!obj) return [];

        var result = [];

        try {
            var current = obj;

            while (current && current !== Object.prototype) {
                Object.getOwnPropertyNames(current).forEach(function (name) {
                    if (result.indexOf(name) === -1) {
                        result.push(name);
                    }
                });

                current = Object.getPrototypeOf(current);
            }
        } catch (e) {}

        return result.sort();
    }

    function diagnose() {
        log('========== START ==========');

        log('Environment', {
            appready: !!window.appready,
            Lampa: typeof window.Lampa,
            jQuery: typeof window.$,
            fetch: typeof window.fetch,
            XMLHttpRequest: typeof window.XMLHttpRequest,
            Promise: typeof window.Promise,
            localStorage: typeof window.localStorage
        });

        if (!window.Lampa) {
            log('ERROR', 'Lampa object not found');
            return;
        }

        log('Lampa modules', {
            Reguest: typeof Lampa.Reguest,
            Storage: typeof Lampa.Storage,
            Listener: typeof Lampa.Listener,
            Noty: typeof Lampa.Noty,
            Template: typeof Lampa.Template
        });

        log('Reguest methods', getMethods(Lampa.Reguest));

        if (Lampa.Reguest) {
            try {
                var request = new Lampa.Reguest();
                log('Reguest instance methods', getMethods(request));
            } catch (e) {
                log('Reguest constructor error', e.message);
            }
        }

        log('Storage methods', getMethods(Lampa.Storage));

        log('Listener methods', getMethods(Lampa.Listener));

        log('========== FINISHED ==========');

        if (Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('KP Sync: диагностика завершена. Смотри консоль.');
        }
    }

    function addMenu() {
        try {
            if (!window.$) {
                log('ERROR', 'jQuery not found');
                return;
            }

            var menu = $('.menu .menu__list').eq(0);

            if (!menu.length) {
                log('ERROR', 'Lampa menu not found');
                return;
            }

            var button = $('<li class="menu__item selector">' +
                '<div class="menu__ico"><span>KP</span></div>' +
                '<div class="menu__text">KP Sync Diagnostic</div>' +
                '</li>');

            button.on('hover:enter', diagnose);
            menu.append(button);

            log('Menu item added');

        } catch (e) {
            log('MENU ERROR', {
                message: e.message,
                stack: e.stack
            });
        }
    }

    function init() {
        try {
            log('Plugin initialized');

            if (window.appready) {
                addMenu();
            } else {
                Lampa.Listener.follow('app', function (event) {
                    if (event.type === 'ready') {
                        addMenu();
                    }
                });
            }

        } catch (e) {
            log('INIT ERROR', {
                message: e.message,
                stack: e.stack
            });
        }
    }

    window.KPSyncDiagnostic = {
        run: diagnose
    };

    init();

})();
