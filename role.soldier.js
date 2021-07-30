global.roleSoldier = {
    name: "soldier",
    roleMemory: { memory: {} },
    BodyParts: [
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        TOUGH,
        TOUGH,
        TOUGH,
        TOUGH,
        TOUGH,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        HEAL,
    ],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        targetRoom = "W15S23";

        var closestHostile =
            creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS) || creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
        // console.log(closestHostile)
        if (closestHostile) {
            creep.room.visual.circle(closestHostile.pos, {
                color: "red",
                radius: 1,
            });
            if (creep.attack(closestHostile) != OK) {
                creep.moveTo(closestHostile);
            }
            return;
        }
        if (creep.hits < 400) creep.heal(creep);

        if (creep.room.name != targetRoom) {
            const route = Game.map.findRoute(creep.room, targetRoom, {
                maxRooms: 1,
            });
            if (route.length > 0) {
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        } else {
            creep.moveTo(creep.room.controller);
            // creep.attack(creep.room.controller)
        }
    },
};

module.exports = roleSoldier;
