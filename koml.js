function KOMLParse(str) {
    const data = {};
    const lines = str.trim().split("\n");
    let cGroup = null;
    let groupType = null;

    function parseValue(val) {
        if (val === "true") return true;
        if (val === "false") return false;
        if (!isNaN(val)) return Number(val);
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            return val.slice(1, -1);
        }
        return val;
    }

    function Group(group, isArray) {
        if (!group) return;

        const [name, val] = group;
        if (!name) return;

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
    }


    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line == "" || line.startsWith("#")) continue;

        if (line.startsWith("{") && line.endsWith("}")) {
            Group(cGroup, groupType === "array");
            cGroup = [line.slice(1, -1), {}];
            groupType = "object";
        } else if (line.startsWith("[") && line.endsWith("]")) {
            Group(cGroup, groupType === "array");
            cGroup = [line.slice(1, -1), []];
            groupType = "array";
        } else {
            if (!cGroup) {
                if (line.includes(": ")) {
                    const [key, val] = line.split(": ");
                    data[key.trim()] = parseValue(val.trim());
                } else {
                    continue
                }
            };

            if (groupType === "object") {
                if (line.includes(": ")) {
                    const [key, val] = line.split(": ");
                    cGroup[1][key.trim()] = parseValue(val.trim());
                }
            } else if (groupType === "array") {
                cGroup[1].push(parseValue(line));
            }
        }
    }

    Group(cGroup, groupType === "array");
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
