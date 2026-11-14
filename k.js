
function diagnose() {
    var L = window.Lampa;
    var report = [];

    function add(title, value) {
        report.push('=== ' + title + ' ===\n' + value);
    }

    add('Версия', '0.4');

    add('Среда', [
        'User Agent: ' + navigator.userAgent,
        'Lampa: ' + typeof L,
        'jQuery: ' + typeof window.$,
        'Fetch: ' + typeof fetch,
        'XHR: ' + typeof XMLHttpRequest,
        'LocalStorage: ' + typeof localStorage
    ].join('\n'));

    add('Lampa modules', L ? Object.keys(L).join(', ') : 'Нет Lampa');
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
        'position:fixed!important;z-index:2147483647!important;' +
        'top:0!important;left:0!important;width:100%!important;' +
        'height:100%!important;background:rgba(0,0,0,.96)!important;' +
        'color:white!important;padding:25px!important;' +
        'box-sizing:border-box!important;overflow:hidden!important;' +
        'pointer-events:auto!important;display:flex!important;' +
        'flex-direction:column!important;';

    var close = document.createElement('button');
    close.textContent = 'ЗАКРЫТЬ';
    close.tabIndex = 0;
    close.style.cssText =
        'font-size:22px;padding:15px 30px;flex-shrink:0;' +
        'margin-bottom:15px;';

    var pre = document.createElement('pre');
    pre.textContent = report.join('\n\n');
    pre.style.cssText =
        'flex:1;overflow-y:auto!important;overflow-x:hidden;' +
        'white-space:pre-wrap;overflow-wrap:anywhere;' +
        'font-size:16px;line-height:1.5;margin:0;' +
        'color:white;pointer-events:auto;';

    overlay.appendChild(close);
    overlay.appendChild(pre);
    document.body.appendChild(overlay);

    function stop(e) {
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }

    function remove() {
        document.removeEventListener('keydown', keyHandler, true);
        overlay.remove();
    }

    function keyHandler(e) {
        var key = e.key;
        var code = e.keyCode;

        if (
            key === 'Escape' ||
            key === 'Backspace' ||
            code === 4 ||
            code === 27 ||
            code === 8
        ) {
            e.preventDefault();
            stop(e);
            remove();
            return;
        }

        if (
            key === 'ArrowDown' ||
            key === 'ArrowUp' ||
            key === 'PageDown' ||
            key === 'PageUp'
        ) {
            e.preventDefault();
            stop(e);

            pre.scrollTop +=
                key === 'ArrowDown' ? 100 :
                key === 'ArrowUp' ? -100 :
                key === 'PageDown' ? 400 : -400;

            return;
        }

        if (key === 'Enter' || code === 23 || code === 66) {
            e.preventDefault();
            stop(e);

            if (document.activeElement === close) {
                remove();
            }

            return;
        }

        stop(e);
    }

    document.addEventListener('keydown', keyHandler, true);

    close.onclick = remove;

    overlay.addEventListener('wheel', function(e) {
        e.stopPropagation();
        pre.scrollTop += e.deltaY;
    }, { passive: true });

    overlay.addEventListener('touchmove', function(e) {
        e.stopPropagation();
    }, { passive: true });

    close.focus();

    window.KPSyncReport = {
        text: report.join('\n\n'),
        close: remove
    };
}
