function log(creep, str) {
    if (creep.name == "Mover_157") if (0) console.log(str);
}

global.roleMover = {
    name: "mover",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [WORK],
    bodyLoop: [CARRY, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        log(creep, 0);
        var sources = creep.room.find(FIND_SOURCES);

        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            if(creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName)
                return
            }
            log(creep, 1);
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

        if (Game.flags.AVOID1 != undefined) {
            if (creep.room.name == Game.flags.AVOID1.room.name) {
                if (creep.pos.isEqualTo(Game.flags.AVOID1.pos)) {
                    if (creep.memory.previousPos != undefined) {
                        if (creep.pos.x == creep.memory.previousPos.x && creep.pos.y == creep.memory.previousPos.y) {
                            creep.move(3);
                            return;
                        }
                    }
                }
                creep.memory.previousPos = creep.pos;
            }
        }
        log(creep, 2);
        pickupNearby(creep);

        // If creep is holding non-energy, deposit it first
        var storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            },
        });
        for (const resourceType in creep.store) {
            if (resourceType != RESOURCE_ENERGY) {
                log(creep, 3);
                if (creep.transfer(storage, resourceType) != OK) {
                    // console.log(creep.transfer(storage, resourceType) )
                    moveToTarget(creep, storage, true);
                    return;
                }
            }
        }
        log(creep, 4);
        if (creep.memory.moving && creep.store.getUsedCapacity() == 0) {
            log(creep, "setting moving false");
            creep.memory.moving = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
            log(creep, "setting moving true");
            creep.memory.moving = true;
            creep.say("dropping");
        }

        if (creep.ticksToLive < 200) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return
        }
        log(creep, 5);
        if (!creep.memory.moving) {
            log(creep, "retrieving");
            mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
            if (mainStorage == undefined) {
                log(creep, "mainStorage could not be found");
            } else {
                if(storage && mainStorage && storage != mainStorage){
                    // transitioning
                    log(creep, "transitioning")
                    creep.memory.transitioning = true
                }
                log(creep, "using mainStorage");
                if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.moveTo(mainStorage, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
                return;
            }

            // creep.say("hello")
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity() > 0;
                },
            });
            if (targets.length) {
                // creep.say('m2storage');
                for (const resourceType in creep.store) {
                    if (resourceType != RESOURCE_ENERGY) {
                        if (creep.transfer(targets[0], resourceType) != OK) {
                            creep.moveTo(targets[0], {
                                visualizePathStyle: { stroke: "#ffaa00" },
                                maxRooms: 0,
                            });
                            return;
                        }
                    }
                }
                if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.moveTo(targets[0], {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
            } else creep.say("no eenergy");
        } else {
            log(creep, "moving");
            var towers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
            var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            // console.log(closestHostile)
            if (closestHostile && towers.length) {
                log(creep, 6);
                if (creep.transfer(towers[0]) != OK) {
                    moveToTarget(creep, towers[0]);
                }
                return;
            }
            
            // transition from container to storage
            mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
            if(storage && mainStorage && mainStorage.structureType == STRUCTURE_CONTAINER){
                log(creep, storage)
                if (creep.transfer(storage, RESOURCE_ENERGY) != OK) {
                    log(creep, creep.transfer(storage, RESOURCE_ENERGY) )
                    log(creep, "dropping in storage")
                    moveToTarget(creep, storage);
                }
                return
            }
            
            if(mainStorage.structureType == STRUCTURE_CONTAINER) {
                if(mainStorage.hits < mainStorage.hitsMax /2) {
                    if(creep.repair(mainStorage) == OK) {
                        return
                    }
                }
            }
            
            
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (
                        ((structure.structureType == STRUCTURE_TOWER && Math.round((structure.store[RESOURCE_ENERGY] / structure.store.getCapacity([RESOURCE_ENERGY])) * 100) < 70) ||
                            structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                },
            });
            // creep.say('m2extTower');
            if (!targets.length) {
                // creep.say('m2spawn');
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    },
                });
            }
            if (!targets.length) {
                // creep.say('m2Tower');
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    },
                });
            }

            try {
                log(creep, 7);
                log(creep, Memory.rooms[creep.room.name]);
                log(creep, Memory.rooms[creep.room.name].l_from);
                var l_from = Game.getObjectById(Memory.rooms[creep.room.name].l_from);
                if (l_from != undefined && l_from.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    log(creep, "pushing l_from");
                    log(creep, targets.length);
                    log(creep, l_from);
                    targets.push(l_from);
                    log(creep, targets.length);
                }
            } catch (e) {
                console.log("error");
            }

            if (!targets.length) {
                // No targets found, return to the storage
                creep.say("no targets");
                try {
                    var storage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
                    log(creep, 8);
                    moveToTarget(creep, storage);
                    return;
                } catch (error) {
                    console.log(error);
                    console.trace();
                }
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTROLLER;
                    },
                });
            }
            target = creep.pos.findClosestByPath(targets);
            
            log(creep, "target")
            log(creep, target)
            if (target.structureType == STRUCTURE_SPAWN && Memory.rooms[creep.room.name].mainSpawn.refilling == true) {
                _.remove(targets, target)
                target = creep.pos.findClosestByPath(targets);
            }
            if(target == undefined || target == null) {
                moveToTarget(creep, storage, true);
                return
            }
            for (const resourceType in creep.store) {
                log(creep, 9);
                if(target.structureType == STRUCTURE_SPAWN)
                    Memory.rooms[creep.room.name].mainSpawn.refilling = true
                if (creep.transfer(target, resourceType) != OK) {
                    moveToTarget(creep, target, true);
                }
            }
        }
    },
};

module.exports = roleMover;
