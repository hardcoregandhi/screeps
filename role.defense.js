global.roleDefence = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if (!creep.memory.currentSource) {
            creep.memory.currentSource = 0;
        }

        var sources = creep.room.find(FIND_SOURCES);
        // Lost creeps return home
        if (!creep.room.controller.my) {
            creep.moveTo(creep.memory.baseRoomName)
            return;
        }

        // Bad hack to split the upgraders and the harvesters
        // creep.memory.currentSource = 0

        if (creep.memory.defence && creep.store.getFreeCapacity() == 0) {
            creep.memory.defence = false;
            creep.say('🔄 dropping');
        }
        if (!creep.memory.defence && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.defence = true;
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
            // var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            // if(closestHostile){
                targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_TOWER
                            && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    }
                });
                target = creep.pos.findClosestByPath(targets)
                // console.log(targets)
            // }

            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                if (NO_SWAMP = true) {
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
};

module.exports = roleDefence;