global.roleHarvester = {
    name: 'harvester',
    roleMemory: { memory: {} },

    BodyParts: [WORK, CARRY, WORK, CARRY, WORK, MOVE, MOVE],

    /** @param {Creep} creep **/
    run: function (creep, focusHealing) {
        var sources = creep.room.find(FIND_SOURCES);
        if (!creep.memory.currentSource) {
            creep.memory.currentSource = 0;
        }

        // Lost creeps return home
        if (!creep.room.controller.my) {
            creep.moveTo(Game.spawns['Spawn1'])
            return;
        }

        // Bad hack to split the upgraders and the harvesters
        // creep.memory.currentSource = 0

        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.say('🔄 dropping');
        }
        if (!creep.memory.mining && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.mining = true;
            creep.say('⛏️ mining');
        }



        if (creep.memory.mining) {

            if (creep.harvest(sources[creep.memory.currentSource]) == ERR_NOT_IN_RANGE) {
                let ret = creep.moveTo(sources[creep.memory.currentSource], { visualizePathStyle: { stroke: '#ffaa00' } })
                // if(ret != OK) {
                //     console.log(ret)
                // }
                if (ret == ERR_NO_PATH) {
                    creep.memory.currentSource++;
                    if (creep.memory.currentSource > sources.length - 1) {
                        creep.memory.currentSource = 0
                    }
                }
            }
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER ||
                        structure.structureType == STRUCTURE_STORAGE) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });

            if (targets.length > 0) {
                var target
                //Priority is
                /* 
                    1. itself
                    2. the colony
                    3. healing
                    4. speed
                */
                if (creep.ticksToLive < 200) {
                    creep.memory.healing = true
                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_SPAWN
                        }
                    });
                    target = targets[0]
                }
                else if (focusHealing || creep.room.find(FIND_STRUCTURES, { filter: (structure) => structure.structureType == STRUCTURE_ROAD && (Math.round((structure.hits / structure.hitsMax) * 100 < 40)) }).length > 0) {
                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_TOWER
                                && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                        }
                    });
                    target = creep.pos.findClosestByPath(targets)
                    // console.log(targets)

                }
                else {
                    // If we have Movers, just use the storage
                    if (_.filter(Game.creeps, (creep) => creep.memory.role == 'mover').length > 0) {
                        targets = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return structure.structureType == STRUCTURE_STORAGE
                                    && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                            }
                        });
                    }
                    else {
                        targets = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_EXTENSION ||
                                    structure.structureType == STRUCTURE_SPAWN)
                                    && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                            }
                        });
                        // console.log(targets)
                    }
                    target = creep.pos.findClosestByPath(targets)
                }

                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    if (NO_SWAMP = false) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        // console.log(target)
                    }
                    else {
                        const path = creep.room.findPath(creep.pos, target.pos);
                        roomPos = new RoomPosition(path[0].x, path[0].y, creep.room.name)
                        isSwamp = new Room.Terrain(creep.room.name).get(path[0].x, path[0].y) == TERRAIN_MASK_SWAMP
                        isPath = roomPos.lookFor(LOOK_STRUCTURES).length != 0
                        if (
                            !isSwamp ||
                            (isSwamp && isPath)
                        ) {
                            creep.moveTo(path[0].x, path[0].y, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                }
            }
        }
    }
};

module.exports = roleHarvester;