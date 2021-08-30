global.roleClaimer = {
    name: "claimer",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        CLAIM, CLAIM,
        MOVE, MOVE, MOVE, MOVE, MOVE
        ],

    // 1 - UP
    // 3 - RIGHT
    // 5 - DOWN
    // 7 - LEFT

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.say("🏳️");

        if (Game.rooms[creep.memory.baseRoomName] == undefined) {
            const route = Game.map.findRoute(creep.room.name, creep.memory.baseRoomName, {
                maxRooms: 16,
            });
            if (route.length > 0) {
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        } else {
            if(creep.name == "Claimer_443")
                creep.claimController(Game.rooms[creep.memory.baseRoomName].controller)
            // console.log(creep.claimController(creep.room.controller));
            if (creep.reserveController(Game.rooms[creep.memory.baseRoomName].controller) != OK) {
                moveToMultiRoomTarget(creep, Game.rooms[creep.memory.baseRoomName].controller, true);
            }
        }
    },
};

module.exports = roleClaimer;
