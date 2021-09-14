global.roleSieger = {
    name: "sieger",
    roleMemory: { memory: {"return": false} },
    // prettier-ignore
    baseBodyParts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,],
    bodyLoop: [TOUGH, WORK, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        
        // creep.say('🏳️');
        if (creep.memory.targetRoomName == undefined) creep.memory.targetRoomName = "W9S3";

        // creep.memory.return = true;

        var enemyTowers = [];
        if (creep.pos.roomName == creep.memory.targetRoomName) {
            enemyTowers = creep.room.find(FIND_HOSTILE_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_TOWER;
                },
            });
        }
        
        if (creep.ticksToLive < 300 || creep.memory.healing) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return
        }
        
        if (creep.hits < 600 && enemyTowers.length == 0) {
            // flee to safety
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return
        }
        if (creep.memory.return) {
            creep.moveTo(Game.flags.holding.pos);
            return;
        }

        
        if (creep.hits < creep.hitsMax) {
            creep.moveTo(Game.rooms[creep.memory.baseRoomName].controller)
        }

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
            // if(Game.rooms[creep.memory.targetRoomName] == undefined) {
            //     usePathfinder(creep, { pos: new RoomPosition(25,25,creep.memory.targetRoomName), range: 1 })
            // }
            // else {
                const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName, {
                    maxRooms: 1,
                });
                if (route.length > 0) {
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                    return
                }
            // }
        } else {
            moveToSoftestWall(creep, enemyTowers.length ? enemyTowers[0].pos : creep.room.controller.pos)
        }
    },
};

module.exports = roleSieger;
