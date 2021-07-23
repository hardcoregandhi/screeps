global.roleMover = {
    name: 'mover',
    roleMemory: { memory: {} },
    BodyParts: [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE,],

    /** @param {Creep} creep **/
    run: function (creep) {
        var sources = creep.room.find(FIND_SOURCES);
        if (!creep.memory.currentSource) {
            creep.memory.currentSource = 0;
        }

        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say('Headin oot');
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            else {
                creep.say('No route found');
            }
            return;
        }

        // Bad hack to split the upgraders and the harvesters
        creep.memory.currentSource = 0

        if (creep.memory.moving && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.moving = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
            creep.memory.moving = true;
            creep.say('dropping');
        }

        if (creep.ticksToLive < 200 && creep.memory.moving) {
            creep.memory.healing = true
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffaa00' } })
            }
            return
        }
        if (!creep.memory.moving) {
            // creep.say("hello")
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE);
                }
            });
            if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffaa00' } })
            }
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if (!targets) {
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_SPAWN) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
            }
            target = creep.pos.findClosestByPath(targets)

            if (creep.transfer(target, RESOURCE_ENERGY) != OK) {
                // console.log(creep.transfer(target, RESOURCE_ENERGY))

                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } })
            }
        }
    }
};

module.exports = roleMover;