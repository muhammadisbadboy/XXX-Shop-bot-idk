const { getCachedRoles, addRoleToCache } = require("../utils/roleCache");

module.exports = {
    name: "roleDelete",
    async execute(role, client) {
        const guild = role.guild;
        const cachedRoles = getCachedRoles();

        // If role is protected, restore it
        if (cachedRoles.has(role.id)) {
            try {
                const newRole = await guild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    mentionable: role.mentionable,
                    reason: "Protected role was deleted",
                });

                // Add new role to cache
                addRoleToCache(newRole.id);
                console.log(`Protected role restored: ${role.name}`);
            } catch (err) {
                console.log(`Failed to restore protected role ${role.name}:`, err);
            }
        }
    }
};