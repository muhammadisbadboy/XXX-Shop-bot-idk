let roleMembers = new Map();

function cacheRoleMembers(guild) {
    guild.roles.cache.forEach(role => {
        roleMembers.set(role.id, role.members.map(member => member.id));
    });
}

function getRoleMembers() {
    return roleMembers;
}

module.exports = { cacheRoleMembers, getRoleMembers };