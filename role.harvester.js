function log(creep, str) {
    if (0) if (creep.name == "Upgrader_779") console.log(str);
}

global.roleHarvester = {
    name: "harvester",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE],
    baseBodyParts: [],
    bodyLoop: [WORK, WORK, WORK, CARRY, MOVE],
    /** @param {Creep} creep **/
    run: function (creep, focusHealing) {
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.memory.targetSource == undefined) {
            var lowestSource = 99;
            _.forEach(Memory.rooms[creep.memory.baseRoomName].sources, (s) => {
                if(s.targettedBy >= s.miningSpots) {
                    return
                }
                if (s.targettedBy < lowestSource) {
                    lowestSource = s.targettedBy;
                    creep.memory.targetSource = s.id;
                }
            })
        }
        if (creep.memory.mining == undefined) {
            creep.memory.mining = true;
        }

        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            if(creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName)
                return
            }
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit, {
                    visualizePathStyle: { stroke: "#ffffff" },
                });
            } else {
                creep.say("No route found");
            }
            return;
        }

        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
        }
        if (!creep.memory.mining && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.mining = true;
            creep.say("⛏️ mining");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) &&
            (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return
        }

        if (creep.memory.mining) {
            pickupNearby(creep);

            targetSource = Game.getObjectById(creep.memory.targetSource);
            if (creep.harvest(targetSource) != OK) {
                creep.moveTo(targetSource, {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
        } else {
            if(creep.memory.focusBuilding) {
                fallbackToOtherRoles(creep);
                return
            }
            
            
            healRoads(creep);
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_CONTAINER ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER ||
                            structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                },
            });
            var towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
            focusHealing = false;
            if (targets.length > 0) {
                var target = null;
                //Priority is
                /* 
                    1. itself
                    2. the colony
                    3. healing
                    4. speed
                */

                healRoads(creep);

                var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                // console.log(closestHostile)
                if (closestHostile && towers.length) {
                    if (creep.transfer(towers[0], RESOURCE_ENERGY) != OK) {
                        creep.moveTo(towers[0]);
                    }
                    return;
                }

                // If we have Movers, just use the storage
                if (creepRoomMap.get(creep.memory.baseRoomName + "mover") != undefined && creepRoomMap.get(creep.memory.baseRoomName + "mover") > 0) {
                    log(creep, "movers found");

                    if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container) {
                        target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.id);
                        log(creep, "local ccont found");
                        log(creep, target);

                        if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.targetSource].container.targettedBy < 1 && Memory.rooms[creep.memory.baseRoomName].mainStorage != undefined) {
                            spawnCreep(roleHarvSup, null, { memory: { targetContainer: target.id } }, creep.memory.baseRoomName);
                        }

                        if (target != null && target.hits < 200000 && target.structureType == STRUCTURE_CONTAINER) {
                            if (creep.repair(target) != OK) {
                                moveToMultiRoomTarget(creep, target.pos);
                            }
                        } else if (creep.transfer(target, RESOURCE_ENERGY) != OK) {
                            moveToMultiRoomTarget(creep, target.pos);
                        }
                        return;
                    }

                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                        },
                    });
                    if (!targets.length) {
                        log(creep, "no storage found");
                        targets = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                            },
                        });

                        if (!targets.length) {
                            log(creep, "no container found");
                        } else target = creep.pos.findClosestByPath(targets);
                        if (target != null && target.hits < 200000 && target.structureType == STRUCTURE_CONTAINER) {
                            creep.repair(target);
                        } else if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            moveToMultiRoomTarget(creep, target.pos);
                        }
                        return;
                    }
                } else {
                    log(creep, "no movers found");
                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (
                                (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_TOWER) &&
                                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                            );
                        },
                    });
                    if (!targets.length) {
                        log(creep, "no exts, spawn, or container found");
                        targets = towers;
                    }
                    // console.log(targets)
                }
                target = creep.pos.findClosestByPath(targets);
                log(creep, `target: ${target}`);

                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    moveToTarget(creep, target.pos, false);
                }
            } else {
                fallbackToOtherRoles(creep)
            }
        }
    },
};

function fallbackToOtherRoles(creep) {
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length) {
        roleBuilder.run(creep);
        return;
    } else {
        roleUpgrader.run(creep);
        return;
    }
}

module.exports = roleHarvester;
