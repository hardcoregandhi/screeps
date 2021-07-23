global.roleClaimer = {
    name: 'claimer',
    roleMemory: { memory: { } },
    BodyParts: [CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE],

    // 1 - UP
    // 3 - RIGHT
    // 5 - DOWN
    // 7 - LEFT

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.say('🏳️');
        targetRoom = "W19S21"

        if (creep.room.name != targetRoom) {
            const route = Game.map.findRoute(creep.room, targetRoom, { maxRooms: 1 });
            if(route.length > 0) {
                console.log('Now heading to room '+route[0].room);
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        } else {
            if (creep.claimController(creep.room.controller) != OK) {
            // console.log(creep.claimController(creep.room.controller));
             creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};

module.exports = roleClaimer;