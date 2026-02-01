const { getCachedRoles } = require("../utils/roleCache");
const { users } = require("../config/whitelist.json");

module.exports = {
    name: "roleUpdate",
    async execute(oldRole, newRole) {
        const executor = (await newRole.guild.fetchAuditLogs({ type: "ROLE_UPDATE", limit: 1 })).entries.first().executor;
        if (users.includes(executor.id)) return;

        const cached = getCachedRoles().get(newRole.id);
        if (!cached) return;

        if (
            oldRole.name !== cached.name ||
            oldRole.color !== cached.color ||
            oldRole.permissions.bitfield !== cached.permissions ||
            oldRole.hoist !== cached.hoist ||
            oldRole.mentionable !== cached.mentionable
        ) {
            await newRole.edit({
                name: cached.name,
                color: cached.color,
                permissions: cached.permissions,
                hoist: cached.hoist,
                mentionable: cached.mentionable,
                reason: "Reverting protected role update"
            });
        }
    }
};