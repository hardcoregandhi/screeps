function log(creep, str) {
    if (0) if (creep.name == "Mover_996") console.log(str);
}

/*

calls		time		avg	    	function
652	    	440.7		0.676		roleMover.run
487		    186.2		0.382		Creep.moveTo
500 		95.7		0.191		Creep.move
288 		59.0		0.205		Creep.moveByPath
147 		57.7		0.392		RoomPosition.findClosestByPath
212 		53.2		0.251		RoomPosition.findPathTo
212 		50.0		0.236		Room.findPath
553 		42.9		0.078		Creep.transfer
4733		19.7		0.004		Room.find
3813		11.1		0.003		RoomPosition.isNearTo
3430		9.7 		0.003		RoomPosition.isEqualTo
40	    	4.1 		0.102		Creep.withdraw
87	    	0.6 		0.007		Creep.say
49	    	0.1 		0.003		Game

*/

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
            if (creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName);
                return;
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

        log(creep, 2);
        pickupNearby(creep);

        if (creep.room.energyCapacityAvailable - creep.room.energyAvailable < 100 && Memory.rooms[creep.room.name].link_storage == undefined) return;

        // we still must check for storage incase the storage is new and mainStorage still == a container
        // that way we can transition between the two structures
        //but we must do that outside of the moving/!moving loop
        var storage = creep.room.find(FIND_STRUCTURES).filter((structure) => {
            return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        });
        mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
        for (const resourceType in creep.store) {
            if (resourceType != RESOURCE_ENERGY) {
                log(creep, 3);
                if (creep.transfer(mainStorage, resourceType) != OK) {
                    // console.log(creep.transfer(storage, resourceType) )
                    creep.moveTo(mainStorage);
                    return;
                }
            }
        }

        log(creep, 4);
        if (creep.memory.moving == undefined) creep.memory.moving = true;
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

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        log(creep, 5);

        if (!creep.memory.moving) {
            log(creep, "retrieving");
            if (mainStorage == undefined) {
                log(creep, "mainStorage could not be found");
            } else {
                if (storage.length && mainStorage && storage[0].id != mainStorage.id) {
                    // transitioning
                    log(creep, "transitioning");
                    creep.memory.transitioning = true;
                }
                log(creep, "using mainStorage");
                if (mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                    // no energy, but can still store what is already withdrawn
                    creep.memory.moving = true;
                }
                if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.moveTo(mainStorage, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
            }
            return;
        } else {
            log(creep, "moving");
            var towers = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });
            var closestHostile = creep.room.find(FIND_HOSTILE_CREEPS).filter((c) => {
                return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK);
            });
            // console.log(closestHostile)
            if (closestHostile.length && towers.length) {
                log(creep, 6);
                if (creep.transfer(towers[0], RESOURCE_ENERGY) != OK) {
                    creep.moveTo(towers[0]);
                }
                return;
            }

            // transition from container to storage
            if (storage.length && mainStorage && mainStorage.structureType == STRUCTURE_CONTAINER) {
                log(creep, storage[0]);
                if (creep.transfer(storage[0], RESOURCE_ENERGY) != OK) {
                    log(creep, creep.transfer(storage[0], RESOURCE_ENERGY));
                    log(creep, "dropping in storage");
                    creep.moveTo(storage[0]);
                }
                return;
            }

            // repair if mainStorage is container
            if (mainStorage.structureType == STRUCTURE_CONTAINER) {
                if (mainStorage.hits < mainStorage.hitsMax / 2) {
                    if (creep.repair(mainStorage) == OK) {
                        return;
                    }
                }
            }

            var targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return (
                    ((structure.structureType == STRUCTURE_TOWER && Math.round((structure.store[RESOURCE_ENERGY] / structure.store.getCapacity([RESOURCE_ENERGY])) * 100) < 70) ||
                        structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
            });
            log(creep, targets);
            // creep.say('m2extTower');

            if (Memory.rooms[creep.room.name].mainSpawn.refilling) {
                mainSpawn = Game.getObjectById(Memory.rooms[creep.room.name].mainSpawn.id);
                targets = targets.filter((item) => item !== mainSpawn);
            }

            if (!targets.length) {
                // creep.say('m2Tower');
                targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                });
            }

            // add a send link if it is available to the target array
            try {
                if (creep.room.memory.link_storage != undefined && creepRoomMap.get(creep.room.name + "moverLink") == 0) {
                    log(creep, 7);
                    log(creep, Memory.rooms[creep.room.name]);
                    log(creep, Memory.rooms[creep.room.name].link_storage);
                    var link_storage = Game.getObjectById(Memory.rooms[creep.room.name].link_storage);
                    if (link_storage != undefined && link_storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        log(creep, "pushing link_storage");
                        log(creep, targets.length);
                        log(creep, link_storage);
                        targets.push(link_storage);
                        log(creep, targets.length);
                    }
                }
            } catch (e) {
                console.log(`${creep}: ${e}`); 
            }

            if (!targets.length) {
                // No targets found, return to the storage
                creep.say("no targets");
                try {
                    log(creep, 8);
                    creep.moveTo(mainStorage);
                } catch (e) {
                    console.log(`${creep}: ${e}`); 
                }
                return;
            }
            target = creep.pos.findClosestByPath(targets);
            if (target.structureType == STRUCTURE_SPAWN) Memory.rooms[creep.room.name].mainSpawn.refilling = true;

            for (const resourceType in creep.store) {
                log(creep, 9);
                if (creep.transfer(target, resourceType) != OK) {
                    creep.moveTo(target);
                }
                return;
            }
        }
    },
};

module.exports = roleMover;
