global.roleInvader = {
    name: "invader",
    roleMemory: { memory: {} },
    // prettier-ignore
    baseBodyParts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,],
    bodyLoop: [ATTACK, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        if (creep.memory.targetRoomName == undefined) creep.memory.targetRoomName = "W9S3";

        // creep.memory.return = true;

        var enemyTowers = [];
        if (creep.pos.roomName == creep.memory.targetRoomName) {
            enemyTowers = creep.room.find(FIND_HOSTILE_STRUCTURES).filter((s) => {
                return s.structureType == STRUCTURE_TOWER;
            });
        }
        if (creep.hits < 300 && enemyTowers.length == 0) {
            // flee to safety
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }
        if (creep.memory.return) {
            creep.moveTo(Game.flags.holding.pos);
            return;
        }

        // if (creep.hits < 500) creep.heal(creep); need to check for heal part before using this

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
            if (creep.room.controller.safeMode != undefined && enemyTowers.length == 0) {
                source = creep.pos.findClosestByPath(FIND_SOURCES);
                if (source) creep.moveTo(source);
                return;
            }

            var c_sites = creep.room.find(FIND_HOSTILE_CONSTRUCTION_SITES).filter((s) => {
                return s.structureType == STRUCTURE_TOWER;
            });
            if (c_sites.length) {
                close_c_site = creep.pos.findClosestByRange(c_sites);
                if (creep.attack(close_c_site) != OK) {
                    moveToTarget(creep, close_c_site);
                }
            }

            var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS); // || creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
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

            if (creep.attack(creep.room.controller) != OK) {
                creep.moveTo(creep.room.controller, { maxRooms: 1 });
            }
        }
    },
};

module.exports = roleInvader;
