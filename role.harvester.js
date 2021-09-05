function log(creep, str) {
    if (0) if (creep.name == "Harvester_777") console.log(str);
}

global.roleHarvester = {
    name: "harvester",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK,
        WORK, WORK, WORK, WORK, WORK,
        WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [],
    bodyLoop: [WORK, CARRY, MOVE],
    /** @param {Creep} creep **/
    run: function (creep, focusHealing) {
        var sources = creep.room.find(FIND_SOURCES);
        if (!creep.memory.currentSource) {
            var lowestSource;
            for (var i in Memory.rooms[creep.memory.baseRoomName].sources) {
                if (creep.memory.currentSource == undefined || Memory.rooms[creep.memory.baseRoomName].sources[i].targettedBy < lowestSource) {
                    lowestSource = Memory.rooms[creep.memory.baseRoomName].sources[i].targettedBy;
                    creep.memory.currentSource = i;
                }
            }
        }
        if (creep.memory.mining == undefined) {
            creep.memory.mining = true;
        }

        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
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

        // Bad hack to split the upgraders and the harvesters
        // creep.memory.currentSource = 0

        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
        }
        if (!creep.memory.mining && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.mining = true;
            creep.say("⛏️ mining");
        }

        if (creep.ticksToLive < 300) {
            creep.say("healing");
            creep.memory.healing = true;
            // creep.drop(RESOURCE_ENERGY);
            if (returnToHeal(creep, creep.memory.baseRoomName))
                return;
        }

        if (creep.memory.mining) {
            pickupNearby(creep);
            
            creep.memory.targetSource = sources[creep.memory.currentSource].id
            if (creep.harvest(sources[creep.memory.currentSource]) != OK) {
                let ret = creep.moveTo(sources[creep.memory.currentSource], {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
                // if(ret != OK) {
                //     console.log(ret)
                // }
                if (ret == ERR_NO_PATH) {
                    creep.memory.currentSource++;
                    if (creep.memory.currentSource > sources.length - 1) {
                        creep.memory.currentSource = 0;
                    }
                }
            }
        } else {
            healRoads(creep);
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER || structure.structureType == STRUCTURE_STORAGE) &&
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
                if (closestHostile) {
                    if (creep.transfer(towers[0], RESOURCE_ENERGY) != OK) {
                        creep.moveTo(towers[0]);
                    }
                    return;
                }

                // If we have Movers, just use the storage
                if (creepRoomMap.get(creep.memory.baseRoomName + "mover") != undefined && creepRoomMap.get(creep.memory.baseRoomName + "mover") > 0) {
                    log(creep, "movers found");

                    if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.currentSource].container) {
                        target = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.currentSource].container.id);
                        log(creep, "local ccont found");
                        log(creep, target);

                        if (Memory.rooms[creep.memory.baseRoomName].sources[creep.memory.currentSource].container.targettedBy < 1 && Memory.rooms[creep.memory.baseRoomName].mainStorage != undefined) {
                            spawnCreep(roleHarvSup, "auto", { memory: { targetContainer: target.id } });
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
                var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (targets.length) {
                    roleBuilder.run(creep);
                    return;
                } else {
                    roleUpgrader.run(creep);
                    return;
                }
            }
        }
    },
};

module.exports = roleHarvester;
