
(function () {
    'use strict';

    var API = 'http://192.168.1.17:8787/api/watchlist';
    var overlay = null;
    var allItems = [];
    var currentFilter = 'all';
    var loading = false;
    var previousFocus = null;

    var ICON = '<svg width="239" height="239" viewBox="0 0 239 239" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M215 121.415l-99.297-6.644 90.943 36.334a106.416 106.416 0 0 0 8.354-29.69z"/><path fill="currentColor" d="M194.608 171.609C174.933 197.942 143.441 215 107.948 215 48.33 215 0 166.871 0 107.5 0 48.13 48.33 0 107.948 0c35.559 0 67.102 17.122 86.77 43.539l-90.181 48.07L162.57 32.25h-32.169L90.892 86.862V32.25H64.77v150.5h26.123v-54.524l39.509 54.524h32.169l-56.526-57.493 88.564 46.352z"/><path fill="currentColor" d="M206.646 63.895l-90.308 36.076L215 93.583a106.396 106.396 0 0 0-8.354-29.688z"/></svg>';
    var STYLE_ID = 'kp-sync-style-v2';

    function addStyles() {
        var oldStyle = document.getElementById(STYLE_ID);
        if (oldStyle) oldStyle.remove();

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #kp-sync-overlay {
                position:fixed;
                inset:0;
                z-index:999999;
                background:rgba(8,10,14,.98);
                color:#fff;
                display:flex;
                flex-direction:column;
                font-family:Arial,sans-serif;
                box-sizing:border-box;
                padding:24px 34px 30px;
            }

            #kp-sync-overlay * {
                box-sizing:border-box;
            }

            #kp-sync-overlay .kp-head {
                display:flex;
                align-items:center;
                gap:22px;
                flex-wrap:wrap;
                margin-bottom:20px;
            }

            #kp-sync-overlay .kp-title {
                font-size:30px;
                font-weight:700;
                margin-right:auto;
            }

            #kp-sync-overlay .kp-count {
                font-size:17px;
                opacity:.7;
            }

            #kp-sync-overlay .kp-actions {
                display:flex;
                gap:10px;
            }

            #kp-sync-overlay button {
                font:inherit;
                color:#fff;
                background:#303640;
                border:2px solid transparent;
                border-radius:7px;
                padding:10px 17px;
                font-size:18px;
                cursor:pointer;
            }

            #kp-sync-overlay button:focus {
                outline:none;
                border-color:#fff;
                background:#46515f;
            }

            #kp-sync-overlay .kp-filter.active {
                background:#53677f;
            }

            #kp-sync-overlay .kp-scroll {
                overflow-y:auto;
                min-height:0;
                flex:1;
                padding:4px 5px 20px 2px;
            }

            #kp-sync-overlay .kp-grid {
                display:grid;
                grid-template-columns:repeat(6,minmax(0,1fr));
                gap:20px 15px;
            }

            #kp-sync-overlay .kp-card {
                display:flex;
                flex-direction:column;
                text-align:left;
                padding:0;
                background:transparent;
                border-radius:8px;
                min-width:0;
                overflow:hidden;
            }

            #kp-sync-overlay .kp-card:focus {
                background:#303640;
                transform:scale(1.025);
                z-index:2;
            }

            #kp-sync-overlay .kp-poster {
                width:100%;
                aspect-ratio:2/3;
                object-fit:cover;
                background:#252a32;
                border-radius:7px;
            }

            #kp-sync-overlay .kp-no-poster {
                width:100%;
                aspect-ratio:2/3;
                background:#252a32;
                border-radius:7px;
                display:flex;
                align-items:center;
                justify-content:center;
                text-align:center;
                padding:10px;
                color:#aaa;
                font-size:16px;
            }

            #kp-sync-overlay .kp-name {
                font-size:17px;
                font-weight:600;
                line-height:1.25;
                margin-top:8px;
                display:-webkit-box;
                -webkit-line-clamp:2;
                -webkit-box-orient:vertical;
                overflow:hidden;
            }

            #kp-sync-overlay .kp-meta {
                font-size:14px;
                opacity:.65;
                margin-top:4px;
            }

            #kp-sync-overlay .kp-status {
                font-size:20px;
                opacity:.8;
                padding:35px 5px;
                white-space:pre-wrap;
            }

            #kp-sync-overlay .kp-foot {
                display:flex;
                align-items:center;
                justify-content:space-between;
                padding-top:14px;
                gap:15px;
            }

            #kp-sync-overlay .kp-hint {
                font-size:15px;
                opacity:.55;
            }

            @media(max-width:1100px) {
                #kp-sync-overlay .kp-grid {
                    grid-template-columns:repeat(5,minmax(0,1fr));
                }
            }

            @media(max-width:800px) {
                #kp-sync-overlay .kp-grid {
                    grid-template-columns:repeat(4,minmax(0,1fr));
                }
            }
        `;

        document.head.appendChild(style);
    }

    function closeScreen() {
    if (overlay) {
        overlay.remove();
        overlay = null;
    }

    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onBackKey, true);

    if (previousFocus && document.contains(previousFocus)) {
        previousFocus.focus();
    }

    previousFocus = null;
}

    function focusElement(element) {
        if (!element) return;

        element.focus();

        if (element.scrollIntoView) {
            element.scrollIntoView({
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    function getCards() {
        if (!overlay) return [];
        return Array.prototype.slice.call(
            overlay.querySelectorAll('.kp-card')
        );
    }

    function getFilters() {
        if (!overlay) return [];
        return Array.prototype.slice.call(
            overlay.querySelectorAll('.kp-filter, .kp-refresh')
        );
    }

    function getGridColumns() {
        if (!overlay) return 6;

        var grid = overlay.querySelector('.kp-grid');
        if (!grid) return 6;

        var template = window.getComputedStyle(grid).gridTemplateColumns;
        var columns = template.split(' ').length;

        return columns || 6;
    }

    function navigateGrid(direction) {
        var cards = getCards();
        if (!cards.length) return;

        var active = document.activeElement;
        var index = cards.indexOf(active);

        if (index < 0) {
            focusElement(cards[0]);
            return;
        }

        var columns = getGridColumns();
        var next = index;

        if (direction === 'left') {
            if (index % columns > 0) next = index - 1;
        }

        if (direction === 'right') {
            if (index + 1 < cards.length && index % columns < columns - 1) {
                next = index + 1;
            }
        }

        if (direction === 'up') {
            if (index - columns >= 0) {
                next = index - columns;
            } else {
                var filters = getFilters();
                var activeFilter = overlay.querySelector(
                    '.kp-filter.active'
                );
                focusElement(activeFilter || filters[0]);
                return;
            }
        }

        if (direction === 'down') {
    if (index + columns < cards.length) {
        next = index + columns;
    } else {
        focusElement(overlay.querySelector('.kp-close'));
        return;
    }
}

        focusElement(cards[next]);
    }

    function navigateFilters(direction) {
        var filters = getFilters();
        if (!filters.length) return;

        var index = filters.indexOf(document.activeElement);

        if (index < 0) {
            focusElement(filters[0]);
            return;
        }

        if (direction === 'left') {
            if (index > 0) focusElement(filters[index - 1]);
        }

        if (direction === 'right') {
            if (index < filters.length - 1) {
                focusElement(filters[index + 1]);
            }
        }

        if (direction === 'down') {
            var cards = getCards();
            if (cards.length) focusElement(cards[0]);
        }
    }

function onBackKey(event) {
    if (!overlay) return;

    var key = event.key;
    var code = event.keyCode || event.which;

    if (
        key === 'Escape' ||
        key === 'Backspace' ||
        key === 'BrowserBack' ||
        key === 'GoBack' ||
        key === 'Back' ||
        code === 4 ||
        code === 27 ||
        code === 10009
    ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeScreen();
    }
}
    
    function onKey(event) {
        if (!overlay) return;

        var key = event.key;
        var code = event.keyCode || event.which;

        // Кнопка Back на Android TV
        if (
    key === 'Escape' ||
    key === 'Backspace' ||
    key === 'BrowserBack' ||
    key === 'GoBack' ||
    key === 'Back' ||
    code === 4 ||
    code === 27 ||
    code === 10009
) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeScreen();
    return;
}

        var directions = {
            19: 'up',
            20: 'down',
            21: 'left',
            22: 'right'
        };

        var direction = directions[code];

        if (
            key === 'ArrowUp' ||
            key === 'ArrowDown' ||
            key === 'ArrowLeft' ||
            key === 'ArrowRight'
        ) {
            direction = key.replace('Arrow', '').toLowerCase();
        }

        if (direction) {
            event.preventDefault();
            event.stopPropagation();

            var active = document.activeElement;

            if (active.classList.contains('kp-card')) {
    navigateGrid(direction);
} else if (
    active.classList.contains('kp-filter') ||
    active.classList.contains('kp-refresh')
) {
    navigateFilters(direction);
} else if (active.classList.contains('kp-close')) {
    if (direction === 'up') {
        var cards = getCards();
        if (cards.length) {
            focusElement(cards[cards.length - 1]);
        }
    }
} else if (direction === 'down') {
    var cards = getCards();
    if (cards.length) focusElement(cards[0]);
}

            return;
        }

        // OK / Enter / центральная кнопка пульта
        if (
            key === 'Enter' ||
            key === ' ' ||
            code === 23 ||
            code === 66
        ) {
            var target = document.activeElement;

            if (overlay.contains(target) && target.tagName === 'BUTTON') {
                event.preventDefault();
                event.stopPropagation();
                target.click();
            }
        }
    }

    function openCard(item) {
        var id = String(item.tmdb_id || '');
        if (!id) return;

        var method = item.type === 'Film' ? 'movie' : 'tv';

        var card = {
            id: id,
            source: 'tmdb'
        };

        if (method === 'movie') {
            card.title = item.title || '';
        } else {
            card.name = item.title || '';
        }

        closeScreen();

        Lampa.Activity.push({
            id: id,
            method: method,
            source: 'tmdb',
            component: 'full',
            card: card
        });
    }

    function visibleItems() {
    return allItems.filter(function (item) {
        var type = String(item.type || '').toLowerCase();

        if (currentFilter === 'movies') {
            return type === 'film' || type === 'movie';
        }

        if (currentFilter === 'series') {
            return type === 'tvseries' ||
                   type === 'miniseries' ||
                   type === 'tv' ||
                   type === 'series';
        }

        return true;
    });
}

    function renderGrid() {
        if (!overlay) return;

        var grid = overlay.querySelector('.kp-grid');
        var status = overlay.querySelector('.kp-status');
        var count = overlay.querySelector('.kp-count');

        grid.innerHTML = '';
        status.textContent = '';

        var items = visibleItems();

        count.textContent = items.length + ' из ' + allItems.length;

        items.forEach(function (item) {
            var button = document.createElement('button');

            button.className = 'kp-card';
            button.type = 'button';

            button.setAttribute(
                'aria-label',
                (item.title || 'Без названия') +
                (item.year ? ', ' + item.year : '')
            );

            // Постеры теперь загружаются через локальный прокси Orange Pi
            var posterUrl = item.tmdb_id
                ? API.replace(
                    '/api/watchlist',
                    '/poster/' + encodeURIComponent(item.tmdb_id)
                )
                : '';

            if (posterUrl) {
                var img = document.createElement('img');

                img.className = 'kp-poster';
                img.alt = '';
                img.loading = 'eager';
                img.src = posterUrl;

                img.onerror = function () {
                    var fallback = document.createElement('div');

                    fallback.className = 'kp-no-poster';
                    fallback.textContent = item.title || 'Нет постера';

                    if (img.parentNode) {
                        img.parentNode.replaceChild(fallback, img);
                    }
                };

                button.appendChild(img);
            } else {
                var noPoster = document.createElement('div');

                noPoster.className = 'kp-no-poster';
                noPoster.textContent = item.title || 'Нет постера';

                button.appendChild(noPoster);
            }

            var name = document.createElement('div');

            name.className = 'kp-name';
            name.textContent =
                item.title || item.original_title || 'Без названия';

            button.appendChild(name);

            var meta = document.createElement('div');

            meta.className = 'kp-meta';
            meta.textContent =
                (item.year || 'Год неизвестен') +
                ' · ' +
                (item.type === 'Film' ? 'Фильм' : 'Сериал');

            button.appendChild(meta);

            button.addEventListener('click', function () {
                openCard(item);
            });

            button.addEventListener('focus', function () {
                button.scrollIntoView({
                    block: 'nearest',
                    inline: 'nearest'
                });
            });

            grid.appendChild(button);
        });

        if (!items.length) {
            status.textContent = 'В этом разделе пока ничего нет.';
        }
    }

    function setFilter(filter) {
    currentFilter = filter;

    if (!overlay) return;

    var items = visibleItems();
    var status = overlay.querySelector('.kp-status');
    var count = overlay.querySelector('.kp-count');

    count.textContent = items.length + ' из ' + allItems.length;
    status.textContent = 'Фильтр: ' + filter +
        ' | currentFilter: ' + currentFilter +
        ' | найдено: ' + items.length;

    overlay.querySelectorAll('.kp-filter').forEach(function (button) {
        var active = button.getAttribute('data-filter') === filter;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    renderGrid();

    var first = overlay.querySelector('.kp-card');
    if (first) focusElement(first);
}

    function loadList(force) {
        if (loading || !overlay) return;

        loading = true;

        var status = overlay.querySelector('.kp-status');
        var grid = overlay.querySelector('.kp-grid');

        status.textContent = force
            ? 'Обновляем список...'
            : 'Загружаем список Кинопоиска...';

        grid.innerHTML = '';

        fetch(
            force
                ? API.replace('/api/watchlist', '/api/watchlist/refresh')
                : API,
            {
                method: force ? 'POST' : 'GET',
                cache: 'no-store'
            }
        )
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                return response.json();
            })
            .then(function (data) {
                if (
                    !data ||
                    data.status !== 'ok' ||
                    !Array.isArray(data.items)
                ) {
                    throw new Error('Сервер вернул неожиданный ответ');
                }

                allItems = data.items.filter(function (x) {
                    return x.tmdb_id;
                });

                status.textContent = '';

                renderGrid();

                if (!allItems.length) {
                    status.textContent =
                        'Список пуст или нет сопоставленных карточек TMDB.';
                }

                var first = overlay.querySelector('.kp-card');

                if (first) {
                    focusElement(first);
                }
            })
            .catch(function (error) {
                status.textContent =
                    'Не удалось загрузить список.\n' +
                    String(error) +
                    '\n\nПроверь доступность Orange Pi по адресу 192.168.1.17:8787.';
            })
            .finally(function () {
                loading = false;
            });
    }

    function openScreen() {
    closeScreen();

    previousFocus = document.activeElement;

    addStyles();

        currentFilter = 'all';
        allItems = [];

        overlay = document.createElement('div');
        overlay.id = 'kp-sync-overlay';

        overlay.innerHTML =
            '<div class="kp-head">' +
                '<div class="kp-title">Буду смотреть</div>' +
                '<div class="kp-count">Загрузка...</div>' +
                '<div class="kp-actions">' +
                    '<button type="button" class="kp-filter active" data-filter="all">Все</button>' +
                    '<button type="button" class="kp-filter" data-filter="movies">Фильмы</button>' +
                    '<button type="button" class="kp-filter" data-filter="series">Сериалы</button>' +
                    '<button type="button" class="kp-refresh">Обновить</button>' +
                '</div>' +
            '</div>' +
            '<div class="kp-scroll">' +
                '<div class="kp-grid"></div>' +
                '<div class="kp-status">Загружаем...</div>' +
            '</div>' +
            '<div class="kp-foot">' +
                '<div class="kp-hint">Стрелки: навигация · OK: открыть · Back: закрыть</div>' +
                '<button type="button" class="kp-close">Закрыть</button>' +
            '</div>';

        document.body.appendChild(overlay);

        overlay.querySelectorAll('.kp-filter').forEach(function (button) {
            button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        setFilter(button.getAttribute('data-filter'));
    });
});

        overlay.querySelector('.kp-refresh').addEventListener('click', function () {
            loadList(true);
        });

        overlay.querySelector('.kp-close').addEventListener('click', function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeScreen();
});

        document.addEventListener('keydown', onKey, true);
        window.addEventListener('keyup', onBackKey, true);

        focusElement(overlay.querySelector('.kp-filter.active'));

        loadList(false);
    }

    function init() {
        if (window.kp_sync_watchlist_ready) return;

        if (!window.Lampa || !Lampa.Menu || !Lampa.Menu.addButton) {
            return;
        }

        window.kp_sync_watchlist_ready = true;

        Lampa.Menu.addButton(ICON, 'Кинопоиск', openScreen);
    }

    if (window.appready) {
        init();
    } else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') init();
        });
    } else {
        var attempts = 0;

        var timer = setInterval(function () {
            attempts++;

            if (window.appready) {
                clearInterval(timer);
                init();
            } else if (attempts > 60) {
                clearInterval(timer);
            }
        }, 500);
    }
})();
