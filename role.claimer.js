global.roleClaimer = {
    name: "claimer",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        CLAIM, CLAIM,
        MOVE, MOVE, MOVE, MOVE, MOVE
        ],
    baseBodyParts: [CLAIM, CLAIM],
    bodyLoop: [MOVE, MOVE, MOVE, MOVE, MOVE, CLAIM],
    bodyPartsMaxCount: 7,
    // 1 - UP
    // 3 - RIGHT
    // 5 - DOWN
    // 7 - LEFT

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.say("🏳️");

        if (Game.rooms[creep.memory.baseRoomName] == undefined) {
            // usePathfinder(creep, { pos: new RoomPosition(25,25,creep.memory.baseRoomName), range: 1 })
            moveToRoom(creep, creep.memory.baseRoomName);
        } else {
            if (creep.name == "Claimer_127") {
                if (creep.claimController(Game.rooms[creep.memory.baseRoomName].controller) != OK) {
                    moveToMultiRoomTarget(creep, Game.rooms[creep.memory.baseRoomName].controller, true);
                }
            }
            // if(!creep.room.controller.my) {
            //     creep.attackController(creep.room.controller)
            // }
            // console.log(creep.claimController(creep.room.controller));
            if (creep.reserveController(Game.rooms[creep.memory.baseRoomName].controller) != OK) {
                moveToMultiRoomTarget(creep, Game.rooms[creep.memory.baseRoomName].controller, true);
            }
        }
    },
};

module.exports = roleClaimer;
