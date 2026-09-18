/* Progressive enhancement: all document text and navigation work without JS. */
(() => {
    const article = document.querySelector('article');
    if (!article) return;
    const toc = document.querySelector('.reader-toc');
    if (toc && matchMedia('(min-width:1101px)').matches) toc.open = true;
    const menu = document.getElementById('nav-menu');
    const toggle = document.querySelector('.menu-toggle');
    const closeMenu = () => {
        menu?.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
    };
    menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menu?.classList.contains('open')) {
            closeMenu();
            toggle?.focus();
        }
    });
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelector('.theme-toggle')?.setAttribute('aria-label', `Theme: ${currentTheme}. Switch theme`);
    article.querySelectorAll('h2[id], h3[id], h4[id]').forEach(heading => {
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.className = 'reader-permalink';
        link.textContent = '#';
        link.setAttribute('aria-label', `Link to ${heading.textContent.trim()}`);
        heading.append(link);
    });
    const actions = document.createElement('div');
    actions.className = 'reader-actions';
    const print = document.createElement('button');
    print.type = 'button';
    print.textContent = 'Print / Save PDF';
    print.addEventListener('click', () => window.print());
    actions.append(print);
    article.prepend(actions);
    const input = document.getElementById('reader-query');
    if (input) {
        const entries = [...article.querySelectorAll('.term, ul.ix > li, .doc-grid a.doc')];
        // Snapshot searchable text before inserting any UI labels.
        const records = entries.map(element => ({element, text:element.textContent.toLocaleLowerCase()}));
        input.closest('.reader-filter').hidden = false;
        const update = () => {
            const query = input.value.trim().toLocaleLowerCase();
            let found = 0;
            records.forEach(({element, text}) => {
                element.hidden = !text.includes(query);
                if (!element.hidden) found++;
            });
            document.getElementById('reader-results').textContent = `${found} of ${records.length} entries${found ? '' : ' — try another search'}`;
        };
        input.addEventListener('input', update);
        // A direct clause/term link must remain reachable after filtering.
        window.addEventListener('hashchange', () => { input.value = ''; update(); });
        update();
    }
    if ('IntersectionObserver' in window && toc) {
        const links = [...toc.querySelectorAll('a')];
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                links.forEach(link => {
                    if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            }
        }, {rootMargin:'-100px 0px -65% 0px', threshold:0});
        article.querySelectorAll('h2[id]').forEach(heading => observer.observe(heading));
    }
})();
