function validConf(cur) {
    if (cur["config"] && cur.config["addon"] && cur.config["author"] && cur.config["version"]) {
        return true;
    } else {
        return false;
    }
}

async function fetchKOML(name) {
    try {
        let resp = await fetch(`addons/${name}/config.koml`);
        if (!resp.ok) throw 0;
        let text = await resp.text();
        return text
    } catch {
        return null;
    }
}

function get() {
    try {
        return JSON.parse(localStorage.getItem('addons')) || [];
    } catch {
        return [];
    }
}

function save(arr) {
    localStorage.setItem('addons', JSON.stringify(arr));
}

async function fetchDirs() {
    let url = 'https://api.github.com/repos/DKopalXYZ/bluestone/contents/addons';
    try {
        let resp = await fetch(url);
        if (!resp.ok) throw 0;
        let data = await resp.json();
        let dirs = data.filter(x => x.type === 'dir').map(x => x.name);
        return dirs;
    } catch {
        return [];
    }
}

async function displayAll() {
    let el = document.getElementById('addons');
    el.textContent = 'Loading addons...';
    let cur = get();
    let dirs = await fetchDirs();
    el.innerHTML = '';
    if (dirs.length === 0) {
        el.textContent = 'No addons found.';
        return;
    }
    let list = [];
    for (let name of dirs) {
        let val = KOMLParse(await fetchKOML(name));
        if (val && validConf(val)) list.push({ name, val });
    }
    list.sort((a, b) => a.val.config.addon.toLowerCase().localeCompare(b.val.config.addon.toLowerCase()));
    for (let g of list) {
        let name = g.name, val = g.val;

        let card = document.createElement('div');
        card.className = 'card';

        let t = document.createElement('h3');
        t.textContent = val.config.addon || name;
        card.appendChild(t);

        let a = document.createElement('p');
        a.textContent = 'Author: ' + (val.config.author || 'Unknown');
        card.appendChild(a);

        let v = document.createElement('p');
        v.textContent = 'Version: ' + (val.config.version || 'N/A');
        card.appendChild(v);

        let i = document.createElement('p');
        i.textContent = 'ID: ' + g.name || 'N/A';
        card.appendChild(i);

        let s = document.createElement('div');
        let isOn = cur.includes(name);
        s.className = 'status-icon ' + (isOn ? 'installed' : 'not-installed');
        s.textContent = isOn ? 'O' : 'X';
        card.appendChild(s);
        
        card.addEventListener('click', () => {
            let arr = get();
            if (arr.includes(name)) {
                arr.splice(arr.indexOf(name), 1);
                s.textContent = 'X';
                s.classList.remove('installed');
                s.classList.add('not-installed');
            } else {
                arr.push(name);
                s.textContent = 'O';
                s.classList.remove('not-installed');
                s.classList.add('installed');
            }
            save(arr);
        });
        el.appendChild(card);
    }
};

displayAll();
