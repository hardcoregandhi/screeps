global.roleScavenger = {
    /** @param {Creep} creep **/
    run: function (creep) {
        if(creep.store[RESOURCE_ENERGY] > 0) {
            storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_EXTENSION
                    )
                        && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                }
            });
            if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return
        }
        if(creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES)) {
            if (creep.pickup(creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES)) != 0) {
                creep.moveTo(creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES))
            }
            return
        }
    }
};

module.exports = roleScavenger;