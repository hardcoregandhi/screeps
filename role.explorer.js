function log(creep, str) {
    if (creep.name == "Explorer_444") if (0) console.log(str);
}

global.roleExplorer = {
    name: "explorer",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [MOVE],
    baseBodyParts: [MOVE],
    bodyLoop: [TOUGH],

    run: function (creep) {
        log(creep, "hello");
        creep.say("🏳️");

        if ((creep.hits < creep.hitsMax * 0.1 || creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.memory.targetRoomName != creep.room.name) {
            const route = Game.map.findRoute(creep.room.name, creep.memory.targetRoomName);
            if (route.length > 0) {
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        } else {
            
        }
    },
};

module.exports = roleExplorer;
