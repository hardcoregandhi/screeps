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
            moveToMultiRoomTarget(creep, new RoomPosition(25,25, creep.memory.targetRoomName))
        } else {
        }
    },
};

module.exports = roleExplorer;
