

global.roleExplorer = {
    name: "explorer",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [MOVE],
    baseBodyParts: [MOVE],
    bodyLoop: [TOUGH, MOVE],

    run: function (creep) {
        Log(creep, "hello");
        creep.say("🏳️");

        if ((creep.hits < creep.hitsMax * 0.5 || creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
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
