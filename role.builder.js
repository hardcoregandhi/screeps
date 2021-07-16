var roleHarvester = require('role.harvester');

global.roleBuilder = {
    name: 'builder',
    BodyParts: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    roleMemory: { memory: {}},
    /** @param {Creep} creep **/
    run: function (creep) {
        if (!creep.memory.currentSource) {
            creep.memory.currentSource = 0;
        }
        creep.memory.baseRoomName = 'W15S21'
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

        if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if (creep.memory.building) {
            // var targets = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
            // if (targets.length > 0) {
            //     if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            //         creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            //     }
            // }
            if (creep.ticksToLive < 150) {
                creep.memory.healing = true
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_SPAWN
                        // && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    }
                });
                target = targets[0]
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                return
            }
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                var closest = creep.pos.findClosestByPath(targets)

                if (creep.build(closest) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closest, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else
            {
                // console.log("Defauling to upgrader")
                roleUpgrader.run(creep)
            }
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 200);
                }
            });
            if (targets.length) {
                if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffaa00' } })
                }
            }
            else {
                var sources = creep.room.find(FIND_SOURCES);
                if (creep.harvest(sources[creep.memory.currentSource]) == ERR_NOT_IN_RANGE) {
                    if (creep.moveTo(sources[creep.memory.currentSource], { visualizePathStyle: { stroke: '#ffaa00' } }) == ERR_NO_PATH) {
                        creep.memory.currentSource++;
                        if (creep.memory.currentSource > sources.length - 1) {
                            creep.memory.currentSource = 0
                        }
                    }
                }
            }
        }
    }
};

module.exports = roleBuilder;