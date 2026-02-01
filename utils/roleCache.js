const fs = require("fs");
const path = require("path");

const protectedRolesPath = path.join(__dirname, "../config/protectedRoles.json");

// Load protected roles
let protectedRoles = new Set(JSON.parse(fs.readFileSync(protectedRolesPath, "utf8")));

function cacheRoles(guild) {
    guild.roles.cache.forEach(role => {
        if (!protectedRoles.has(role.id) && role.name !== "@everyone") {
            protectedRoles.add(role.id);
        }
    });
}

function addRoleToCache(roleId) {
    protectedRoles.add(roleId);
    fs.writeFileSync(protectedRolesPath, JSON.stringify([...protectedRoles], null, 4));
}

function getCachedRoles() {
    return protectedRoles;
}

module.exports = { cacheRoles, addRoleToCache, getCachedRoles };