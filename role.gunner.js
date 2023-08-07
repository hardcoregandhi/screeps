global.roleGunner = {
    name: "gunner",
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
    baseBodyParts: [TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK],
    subBodyParts: [HEAL, HEAL, MOVE, MOVE],
    bodyLoop: [MOVE, RANGED_ATTACK],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        // if (creep.memory.targetRoomName == undefined) creep.memory.targetRoomName = "W9S3";

        // creep.memory.return = true;

        var enemyTowers = [];
        if (creep.pos.roomName == creep.memory.targetRoomName) {
            enemyTowers = creep.room.find(FIND_HOSTILE_STRUCTURES).filter((s) => s.structureType == STRUCTURE_TOWER);
        }
        if (creep.hits < creep.hitsMax / 2) {
            creep.heal(creep);
        }
        
        creep.memory.noHeal = true

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
            creep.Move(Game.flags.holding.pos);
            return;
        }

        if (creep.memory.passiveTravel == undefined || creep.memory.passiveTravel == false) {
            var allHostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
            if (allHostileCreeps.length) {
                var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS).filter((c) => c.owner.username != "KyberPrizrak" && (c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK)));
                if (hostileCreeps.length) {
                    if (hostileCreeps.length > 2 || allHostileCreeps.length > 4) {
                        cloneCreep(creep.name);
                    }
                    
                    // var healer = null;
                    // var healerCount = 0;
                    // const reducer = (accumulator, currentBodyPart) => {
            
                    //     if (currentBodyPart.type == HEAL && currentBodyPart.hits > 0) {
                    //         accumulator += 1;
                    //     }
                    //     if (currentBodyPart.type == HEAL && currentBodyPart.hits > 0 && currentBodyPart.boost != undefined) {
                    //         accumulator += 1;
                    //     }
                    //     return accumulator;
                    // };
                    // for (var h of hostileCreeps) {
                    //     healparts = h.body.reduce(reducer, 0);
                    //     // console.log(`${h.name} : ${healparts}`)
                    //     if (healerCount < healparts) {
                    //         console.log(`healer found in ${room.name}`);
                    //         healer = h;
                    //         healerCount = healparts;
                    //         if (creep.pos.inRangeTo(healer, 2)) {
                    //             var direction = creep.pos.getDirectionTo(healer);
                    //             direction = direction >= 5 ? direction - 4 : direction + 4;
                    //             // creep.move(direction);
                    //             creep.rangedAttack(healer);
                    //         } else {
                    //             if (creep.rangedAttack(healer) != OK) {
                    //                 creep.Move(healer, { maxRooms: 1 });
                    //             }
                    //         }
                    //         return
                    //     }
                    // }

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
                            creep.rangedAttack(closestHostile);
                        } else {
                            if (creep.rangedAttack(closestHostile) != OK) {
                                creep.Move(closestHostile, { maxRooms: 1 });
                            }
                        }
                        return;
                    }
                }
            }
        }

        var invaderCore = creep.room.find(FIND_HOSTILE_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_INVADER_CORE;
            },
        });

        if (invaderCore.length) {
            if (creep.rangedAttack(invaderCore[0]) != OK) {
                creep.heal(creep);
                
            }
            if (!creep.pos.inRangeTo(invaderCore[0], 1)) creep.Move(invaderCore[0], { maxRooms: 1 });
            return;
        }

        // if (creep.ticksToLive < 500) {
        //     if (creep.room.name != creep.memory.baseRoomName) {
        //         const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
        //         if (route.length > 0) {
        //             const exit = creep.pos.findClosestByRange(route[0].exit);
        //             creep.Move(exit);
        //             return
        //         }
        //     }
        // }

        if (creep.room.name != creep.memory.targetRoomName) {
            // if(Game.rooms[creep.memory.targetRoomName] == undefined) {
            //     usePathfinder(creep, { pos: new RoomPosition(25,25,creep.memory.targetRoomName), range: 1 })
            // }
            // else {
            moveToRoom(creep, creep.memory.targetRoomName);
            // }
        } else {
            // if (creep.room.controller.safeMode != undefined && enemyTowers.length == 0) {
            //     source = creep.pos.findClosestByPath(FIND_SOURCES);
            //     if (source) creep.Move(source);
            //     return;
            // }
            var enemyTargets = Game.rooms[creep.memory.targetRoomName]
                    .find(FIND_HOSTILE_CREEPS)
                    .filter((c) => creep.owner.username != "KyberPrizrak");
            if (enemyTargets.length) {
                if (creep.attack(enemyTargets[0]) != OK) {
                    creep.Move(enemyTargets[0], { maxRooms: 1 });
                }
                return;
            }
            var allHurtCreeps = creep.room.find(FIND_MY_CREEPS).filter((c) => {
                return c.hits < c.hitsMax;
            });
            if (allHurtCreeps.length) {
                var closestHurtCreep = creep.pos.findClosestByRange(allHurtCreeps);
                if (creep.heal(closestHurtCreep) == ERR_NOT_IN_RANGE) {
                    creep.Move(closestHurtCreep)
                }
                return
            }
            if (creep.attack(creep.room.controller) != OK) {
                creep.heal(creep);
                if (!creep.pos.inRangeTo(creep.room.controller, 2)) creep.Move(creep.room.controller, { maxRooms: 1 });
            }
        }
    },
};

module.exports = roleGunner;
