global.roleSoldier = {
    name: "soldier",
    roleMemory: { memory: { return: false } },
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
    baseBodyParts: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    subBodyParts: [HEAL, HEAL, MOVE, MOVE],
    bodyLoop: [MOVE, ATTACK],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        // creep.memory.return = true;

        var enemyTowers = [];
        if (creep.pos.roomName == creep.memory.targetRoomName) {
            enemyTowers = creep.room.find(FIND_HOSTILE_STRUCTURES).filter((s) => {
                return s.structureType == STRUCTURE_TOWER;
            });
        }
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        if (Game.rooms[creep.memory.baseRoomName].controller.level == 8) creep.memory.noHeal = true;
        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.hits < 600 && enemyTowers.length == 0) {
            // flee to safety
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }
        if (creep.memory.return) {
            creep.moveTo(Game.flags.holding.pos);
            return;
        }

        if (Game.rooms[creep.memory.targetRoomName] != undefined) {
            var invaderCore = Game.rooms[creep.memory.targetRoomName].find(FIND_HOSTILE_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_INVADER_CORE;
                },
            });

            if (invaderCore.length) {
                creep.memory.targetCore = invaderCore[0].id;
            }
        }

        if (creep.memory.passiveTravel == undefined || creep.memory.passiveTravel == false) {
            var allHostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
            if (allHostileCreeps.length) {
                var hostileCreeps = allHostileCreeps.filter((c) => creep.owner.username != "KyberPrizrak" && (c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK)));
                if (hostileCreeps.length) {
                    if (hostileCreeps.length > 2 || allHostileCreeps.length > 4) {
                        cloneCreep(creep.name);
                    }

                    var closestHostile = creep.pos.findClosestByRange(hostileCreeps);
                    // console.log(closestHostile)
                    if (closestHostile) {
                        creep.room.visual.circle(closestHostile.pos, {
                            color: "red",
                            radius: 1,
                        });
                        if (creep.pos.inRangeTo(target, 2)) {
                            var direction = creep.pos.getDirectionTo(target);
                            direction = direction >= 5 ? direction - 4 : direction + 4;
                            creep.move(direction);
                            creep.attack(closestHostile);
                        } else {
                            if (creep.attack(closestHostile) != OK) {
                                creep.moveTo(closestHostile, { maxRooms: 1 });
                            }
                        }
                        return;
                    }
                }
            }
        }

        if (Game.rooms[creep.memory.targetRoomName] != undefined) {
            var invaderCore = Game.rooms[creep.memory.targetRoomName].find(FIND_HOSTILE_STRUCTURES, {
                filter: (s) => {
                    return s.structureType == STRUCTURE_INVADER_CORE;
                },
            });

            if (invaderCore.length) {
                if (creep.attack(invaderCore[0]) != OK) {
                    creep.heal(creep);
                    if (!creep.pos.inRangeTo(invaderCore[0], 2)) creep.moveTo(invaderCore[0], { maxRooms: 1 });
                }
                return;
            }
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

            if (creep.memory.targetCore != undefined) {
                invaderCore = Game.getObjectById(creep.memory.targetCore);
                if (invaderCore != undefined) {
                    creep.moveTo(invaderCore);
                    requestGunner(creep.memory.baseRoomName, creep.memory.targetRoomName);
                    return;
                } else {
                    delete creep.memory.targetCore;
                }
            }

            if (Game.rooms[creep.memory.targetRoomName] != undefined) {
                var enemyTargets = Game.rooms[creep.memory.targetRoomName]
                    .find(FIND_HOSTILE_CREEPS)
                    .filter((c) => creep.owner.username != "KyberPrizrak" && (c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK)));
                if (enemyTargets.length) {
                    moveToMultiRoomTarget(creep, enemyTargets[0]);
                    return;
                }
                creep.moveTo(Game.rooms[creep.memory.targetRoomName].controller);
                return;
            } else {
                moveToRoom(creep, creep.memory.targetRoomName);
            }
            // }
        } else {
            // if (creep.room.controller.safeMode != undefined && enemyTowers.length == 0) {
            //     source = creep.pos.findClosestByPath(FIND_SOURCES);
            //     if (source) creep.moveTo(source);
            //     return;
            // }
            if (creep.attack(creep.room.controller) != OK) {
                creep.heal(creep);
                if (!creep.pos.inRangeTo(creep.room.controller, 2)) creep.moveTo(creep.room.controller, { maxRooms: 1 });
            }
        }
    },
};

module.exports = roleSoldier;
