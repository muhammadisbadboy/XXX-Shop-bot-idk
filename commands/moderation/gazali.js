if (!process.env.CLAIM_ID) {
    console.log("CLAIM_ID missing");
    return;
}

if (!message.member.roles.cache.has(process.env.CLAIM_ID)) {
    console.log("User does not have CLAIM_ID role");
    return message.reply("You don't have permission.");
}