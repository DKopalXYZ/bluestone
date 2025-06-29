const KOMLVersion = "1.0.1"

function KOMLParse(str) {
    const data = {};
    const lines = str.trim().split("\n");
    let cGroup = null;
    let groupType = null;

    function parseValue(val) {
        val = val.trim();
        if (val === "true") return true;
        if (val === "false") return false;
        if (!isNaN(val)) return Number(val);
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            return val.slice(1, -1);
        }
        return val;
    }

    function assignGroup() {
        if (!cGroup) return;
        const [name, val] = cGroup;
        const parts = name.split(".");
        let current = data;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[parts[parts.length - 1]] = val;
        cGroup = null;
        groupType = null;
    }

    for (let raw of lines) {
        raw = raw.trim();
        if (!raw || raw.startsWith("#")) continue;

        const segments = raw.split(";").map(s => s.trim()).filter(Boolean);
        for (let line of segments) {
            if (!line || line.startsWith("#")) continue;

            if (line.startsWith("{") && line.endsWith("}")) {
                assignGroup();
                cGroup = [line.slice(1, -1), {}];
                groupType = "object";
                continue;
            } else if (line.startsWith("[") && line.endsWith("]")) {
                assignGroup();
                cGroup = [line.slice(1, -1), []];
                groupType = "array";
                continue;
            }

            if (!cGroup) {
                const idx = line.indexOf(":");
                if (idx !== -1) {
                    const key = line.slice(0, idx).trim();
                    const val = line.slice(idx + 1).trim();
                    data[key] = parseValue(val);
                }
            } else {
                if (groupType === "object") {
                    const idx = line.indexOf(":");
                    if (idx !== -1) {
                        const key = line.slice(0, idx).trim();
                        const val = line.slice(idx + 1).trim();
                        cGroup[1][key] = parseValue(val);
                    }
                } else if (groupType === "array") {
                    cGroup[1].push(parseValue(line));
                }
            }
        }
    }

    assignGroup();
    return data;
}

function KOMLStringify(data) {
    const result = [];

    function parseValue(val) {
        if (typeof val === "string") {
            return `"${val}"`;
        } else if (typeof val === "boolean" || typeof val === "number") {
            return String(val);
        }
        return val;
    }

    function Group(path, val) {
        if (Array.isArray(val)) {
            result.push(`[${path}]`);
            for (const item of val) {
                result.push(parseValue(item));
            }
        } else if (typeof val === "object" && val !== null) {
            result.push(`{${path}}`);
            for (const [k, v] of Object.entries(val)) {
                if (
                    typeof v === "string" ||
                    typeof v === "number" ||
                    typeof v === "boolean"
                ) {
                    result.push(`${k}: ${parseValue(v)}`);
                }
            }
        }
    }

    function traverse(obj, path = "") {
        for (const key in obj) {
            const val = obj[key];
            const pPath = path ? `${path}.${key}` : key;

            if (
                typeof val === "string" ||
                typeof val === "number" ||
                typeof val === "boolean"
            ) {
                if (!path) {
                    result.push(`${key}: ${parseValue(val)}`);
                }
            } else if (Array.isArray(val)) {
                Group(pPath, val);
            } else if (typeof val === "object" && val !== null) {
                Group(pPath, val);
                traverse(val, pPath);
            }
        }
    }

    traverse(data);
    return result.join("\n") + "\n";
}
