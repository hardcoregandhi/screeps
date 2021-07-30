global.roleScavenger = {
    /** @param {Creep} creep **/
    run: function (creep) {
        creep.say("scavin");
        if (creep.memory.scav == undefined) {
            creep.memory.scav = false;
        }

        if (creep.room.name != creep.memory.baseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
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

        if (!creep.memory.scav && creep.store.getUsedCapacity() == 0) {
            creep.memory.scav = true;
            creep.say("🔄 scav");
        }
        if (creep.memory.scav && creep.store.getFreeCapacity() == 0) {
            creep.memory.scav = false;
            creep.say("dropping");
        }

        if (!creep.memory.scav) {
            creep.say("emptyin");
            storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
            for (const resourceType in creep.store) {
                if (creep.transfer(storage, resourceType) != OK) {
                    creep.moveTo(storage, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                    });
                    return;
                }
            }
        } else {
            var droppedResource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: (r) => r.amount >= 150,
            });
            var tombstoneResource = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                filter: (r) => r.store.getUsedCapacity() >= 150,
            });
            if (droppedResource) {
                creep.say("f/drop");
                if (creep.pickup(droppedResource) != 0) {
                    creep.moveTo(droppedResource, {
                        visualizePathStyle: { stroke: "#ffffff" },
                    });
                }
            } else if (tombstoneResource) {
                creep.say("f/tomb");
                for (const resourceType in tombstoneResource.store) {
                    if (creep.withdraw(tombstoneResource, resourceType) != 0) {
                        creep.moveTo(tombstoneResource, {
                            visualizePathStyle: { stroke: "#ffffff" },
                        });
                    }
                }
            } else {
                creep.say("LOST");
            }
        }
    },
};

module.exports = roleScavenger;
