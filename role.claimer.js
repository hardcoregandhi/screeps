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

        if (creep.room.name != creep.memory.baseRoomName) {
            const route = Game.map.findRoute(creep.room.name, creep.memory.baseRoomName, {
                maxRooms: 1,
            });
            if (route.length > 0) {
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        } else {
            if (creep.claimController(creep.room.controller) != OK) {
                // console.log(creep.claimController(creep.room.controller));
                if (creep.reserveController(creep.room.controller) != OK) {
                    creep.moveTo(creep.room.controller, {
                        visualizePathStyle: { stroke: "#ffffff" },
                    });
                }
            }
        }
    },
};

module.exports = roleClaimer;
