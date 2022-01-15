

global.roleCleaner = {
    name: "cleaner",
    memory: { memory: {} },
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    baseBodyParts: [],
    bodyLoop: [MOVE, CARRY],

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.say("cleanin");
        if (creep.memory.cleaning == undefined) {
            creep.memory.cleaning = false;
        }

        if (!creep.memory.cleaning && creep.store.getUsedCapacity() == 0) {
            creep.memory.cleaning = true;
            creep.say("🔄.cleaning");
        }
        if (creep.memory.cleaning && creep.store.getFreeCapacity() == 0) {
            creep.memory.cleaning = false;
            creep.say("dropping");
        }

        if (!creep.memory.cleaning) {
            creep.say("emptyin");
            //no storage, just grab energy
            if (creep.room.name != creep.memory.baseRoomName) {
                moveToRoom(creep, creep.memory.baseRoomName);
                return;
            }
            mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (mainStorage == undefined) {
                Log(creep, "mainStorage could not be found");
            } else {
                Log(creep, "using mainStorage");
                for (const resourceType in creep.store) {
                    if (creep.transfer(mainStorage, resourceType) != OK) {
                        creep.moveTo(mainStorage, {
                            visualizePathStyle: { stroke: "#ffaa00" },
                            maxRooms: 1,
                        });
                        return;
                    }
                }
                return;
            }
        } else {
            if (creep.room.name != creep.memory.targetRoomName) {
                const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName);
                if (route.length > 0) {
                    creep.say("Headin oot");
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                        ignoreRoads: true,
                        ignoreCreeps: true,
                    });
                } else {
                    creep.say("No route found");
                }
                return;
            }

            var droppedResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.amount >= 1,
            });
            if (droppedResource) {
                creep.say("f/drop");
                if (creep.pickup(droppedResource) != 0) {
                    creep.moveTo(droppedResource, {
                        visualizePathStyle: { stroke: "#ffffff" },
                        maxRooms: 1,
                    });
                }
                return;
            }

            var targetResource = creep.pos.findClosestByRange(FIND_RUINS, {
                filter: (r) => r.store.getUsedCapacity() >= 1,
            });
            if (targetResource == null || targetResource == undefined) {
                var targetResource = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                    filter: (r) => r.store.getUsedCapacity() >= 1,
                });
            }
            if (targetResource != null || targetResource != undefined) {
                creep.say("f/tomb");
                for (const resourceType in targetResource.store) {
                    if (creep.withdraw(targetResource, resourceType) != 0) {
                        creep.moveTo(targetResource, {
                            visualizePathStyle: { stroke: "#ffffff" },
                            maxRooms: 1,
                        });
                    }
                }
                return;
            }

            creep.memory.role = "DIE";
        }
    },
};

module.exports = roleCleaner;
