global.roleHarvesterDeposit = {
    name: "harvesterDeposit",
    roleMemory: { memory: { baseRoomName: null, targetRoomName: null, targetResourceType: null } },

    // prettier-ignore
    BodyParts: [WORK,WORK,WORK,WORK,WORK, WORK,WORK,WORK,WORK,WORK, 
        WORK,WORK,WORK,WORK,WORK, WORK,WORK,WORK,WORK,WORK,
        CARRY,CARRY,CARRY,CARRY,CARRY, CARRY,CARRY,CARRY,CARRY,CARRY,
        CARRY,CARRY,CARRY,CARRY,CARRY, MOVE,MOVE,MOVE,MOVE,MOVE,
        MOVE,MOVE,MOVE,MOVE,MOVE, MOVE,MOVE,MOVE,MOVE,MOVE
    ],
    baseBodyParts: [],
    bodyLoop: [WORK, WORK, CARRY, MOVE, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, 1);
        if (creep.ticksToLive > 1400) {
            creep.memory.healing = false;
        }

        if ((creep.ticksToLive < 500 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            creep.memory.mining = false;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        Log(creep, 2);

        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
            Log(creep, "switching to dropping");
        }
        if (!creep.memory.mining && creep.store.getUsedCapacity() == 0) {
            if (creep.memory.toDIE) {
                creep.memory.DIE = true;
                return;
            }
            creep.memory.healing = false;
            creep.memory.mining = true;
            creep.say("⛏️ mining");
            Log(creep, "switching to mining");
        }

        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
        }
        if (creep.memory.mining) {
            Log(creep, "mining");

            if (Game.rooms[creep.memory.targetRoomName] == undefined) {
                Log(creep, creep.memory.targetRoomName);
                if (creep.room.name != creep.memory.targetRoomName) {
                    Log(creep, "finding route to " + creep.memory.targetRoomName);
                    const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName);
                    if (route.length > 0) {
                        creep.say("Headin oot");
                        const exit = creep.pos.findClosestByRange(route[0].exit);
                        creep.Move(exit);
                    } else {
                        creep.say("No route found");
                        Log(creep, "no route to target room");
                    }
                    return;
                }
            }

            // var closestStructure = creep.room.find(FIND_HOSTILE_STRUCTURES).filter((structure) => {
            //     return structure.structureType == STRUCTURE_INVADER_CORE;
            // });

            // var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS).filter((c) => {
            //     return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK);
            // });
            // rangedCount = 0;
            // meleeCount = 0;
            // if (hostileCreeps.length) {
            //     console.log(hostileCreeps);
            //     _.forEach(hostileCreeps, (c) => {
            //         _.forEach(c.body, (part) => {
            //             switch (part.type) {
            //                 case ATTACK:
            //                     meleeCount++;
            //                     break;
            //                 case RANGED_ATTACK:
            //                     rangedCount++;
            //                     break;
            //             }
            //         });
            //     });
            // }

            // if (hostileCreeps.length || closestStructure.length) {
            //     try {
            //         if (meleeCount > rangedCount || creepRoomMap.get(creep.memory.targetRoomName + "soldierTarget") == undefined || creepRoomMap.get(creep.memory.targetRoomName + "soldierTarget") < 1) {
            //             requestSoldier(creep.memory.baseRoomName, creep.memory.targetRoomName);
            //         } else if (meleeCount < rangedCount || creepRoomMap.get(creep.memory.targetRoomName + "gunnerTarget") == undefined || creepRoomMap.get(creep.memory.targetRoomName + "gunnerTarget") < 1) {
            //             requestGunner(creep.memory.baseRoomName, creep.memory.targetRoomName);
            //         }
            //     } catch (e) {
            //         console.log(`${creep}: ${e}`);
            //     }
            // }

            var targetSource = Game.getObjectById(creep.memory.targetSource);
            if (targetSource == undefined) {
                log.error("source not found");
            }
            if (targetSource.lastCooldown >= 120) {
                creep.memory.toDIE = true;
                creep.memory.mining = false;
            }
            // Log(creep, targetSource);

            if (creep.harvest(targetSource) != OK) {
                // console.log(creep.harvest(targetSource))
                creep.Move(targetSource);
            }
            return;
        } else {
            Log(creep, "dropping");
            if (creep.room.name != creep.memory.baseRoomName) {
                Log(creep, "wrong room");
                const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
                if (route.length > 0) {
                    creep.say("Headin oot");
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.Move(exit);
                } else {
                    creep.say("No route found");
                    Log(creep, "no route to target room");
                }
                return;
            }
            mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);

            for (var type in creep.store) {
                if (creep.transfer(mainStorage, type) != OK) {
                    creep.Move(mainStorage);
                }
            }
        }
    },
};

module.exports = roleHarvesterExt;
