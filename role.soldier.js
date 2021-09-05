global.roleSoldier = {
    name: "soldier",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
        ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
        ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
        ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
        MOVE,MOVE,MOVE,MOVE,MOVE,
        MOVE,MOVE,MOVE,MOVE,MOVE,
        MOVE,MOVE,MOVE,MOVE,MOVE,
        MOVE,MOVE,MOVE,MOVE,MOVE,
        HEAL,
    ],
    baseBodyParts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH],
    bodyLoop: [ATTACK, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        if (creep.memory.targetRoomName == undefined) creep.memory.targetRoomName = "W17S21";

        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS) || creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
        // console.log(closestHostile)
        if (closestHostile) {
            creep.room.visual.circle(closestHostile.pos, {
                color: "red",
                radius: 1,
            });
            if (creep.attack(closestHostile) != OK) {
                creep.moveTo(closestHostile, { maxRooms: 1 });
            }
            return;
        }
        if (creep.hits < 500) creep.heal(creep);

        // if (creep.ticksToLive < 500) {
        //     if (creep.room.name != creep.memory.baseRoomName) {
        //         const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
        //         if (route.length > 0) {
        //             const exit = creep.pos.findClosestByRange(route[0].exit);
        //             creep.moveTo(exit);
        //             return
        //         }
        //     }
        // }

        if (creep.room.name != creep.memory.targetRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName, {
                maxRooms: 1,
            });
            if (route.length > 0) {
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        } else {
            if (creep.attack(creep.room.controller) != OK) {
                creep.moveTo(creep.room.controller, { maxRooms: 1 });
            }
        }
    },
};

module.exports = roleSoldier;
