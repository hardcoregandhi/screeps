const { has } = require("lodash");

global.roleExplorer = {
    name: "explorer",
    roleMemory: { memory: { targetRoomName: null } },
    // prettier-ignore
    BodyParts: [MOVE],
    baseBodyParts: [MOVE],
    bodyLoop: [TOUGH, MOVE],

    run: function (creep) {
        creep.memory.noHeal = true;
        Log(creep, "hello");
        creep.say("🏳️");

        if ((creep.hits < creep.hitsMax * 0.5 || creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.memory.targetRoomName == undefined) {
            console.log(`creeps.${creep.name} is waiting for a targetRoomName`);
            return;
        }
        if (creep.memory.experimentalMovement != undefined) {
            moveToRoom(creep, creep.memory.baseRoomName);
            return;
        } else {
            creep.Move(new RoomPosition(25, 25, creep.memory.targetRoomName));
        }
    },
};

module.exports = roleExplorer;
