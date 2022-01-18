global.roleClaimer = {
    name: "claimer",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        CLAIM, CLAIM,
        MOVE, MOVE, MOVE, MOVE, MOVE
        ],
    baseBodyParts: [CLAIM, CLAIM, MOVE],
    bodyLoop: [MOVE, MOVE, MOVE, MOVE, MOVE, CLAIM],
    bodyPartsMaxCount: 7,
    // 1 - UP
    // 3 - RIGHT
    // 5 - DOWN
    // 7 - LEFT

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.say("🏳️");

        if (creep.memory.interShard) {
            interShardMove(creep);
            return;
        }
        
        if (creep.memory.targetRoomName == undefined) {
            console.log(`creeps.${creep.name} @ ${creep.pos} is awaiting a targetRoomName`)
            return;
        }

        if (Game.rooms[creep.memory.targetRoomName] == undefined) {
            // usePathfinder(creep, { pos: new RoomPosition(25,25,creep.memory.baseRoomName), range: 1 })
            moveToRoom(creep, creep.memory.targetRoomName);
        } else {
            if (creep.memory.claim != undefined) {
                if (creep.claimController(Game.rooms[creep.memory.targetRoomName].controller) != OK) {
                    moveToMultiRoomTarget(creep, Game.rooms[creep.memory.targetRoomName].controller, true);
                }
            }
            // if(!creep.room.controller.my) {
            //     creep.attackController(creep.room.controller)
            // }
            // console.log(creep.claimController(creep.room.controller));
            if (creep.reserveController(Game.rooms[creep.memory.targetRoomName].controller) != OK) {
                moveToMultiRoomTarget(creep, Game.rooms[creep.memory.targetRoomName].controller, true);
            }
        }
    },
};

module.exports = roleClaimer;
