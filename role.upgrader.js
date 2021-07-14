var roleUpgrader = {
    name: 'upgrader',

    BodyParts: [WORK, CARRY, WORK, CARRY, WORK, CARRY, WORK, MOVE],

    /** @param {Creep} creep **/
    run: function(creep) {
        
        // Lost creeps return home
        if(!creep.room.controller.my) {
            creep.moveTo(Game.spawns['Spawn1'])
            return;
        }

        // weird hack to keep it at the bottom source
        creep.memory.currentSource=1
        
        if(creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }

        if(creep.memory.upgrading) {
            if(creep.ticksToLive < 300) {
                creep.memory.healing=true
                targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_SPAWN
                                && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                        }
                    });
                target = targets[0]

            }
            else if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                NO_SWAMP=false

                if(NO_SWAMP){
                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                    // console.log(target)
                }
                else
                {
                    const path = creep.room.findPath(creep.pos, creep.room.controller.pos, {swampCost: 20, ignoreCreeps: false});
                    roomPos = new RoomPosition(path[0].x, path[0].y, creep.room.name)
                    isSwamp = new Room.Terrain(creep.room.name).get(path[0].x, path[0].y) == TERRAIN_MASK_SWAMP
                    isPath = roomPos.lookFor(LOOK_STRUCTURES).length != 0
                    for(var pathStep of path){
                        if(
                        (!isSwamp) ||
                        (isSwamp && isPath)
                    ) {
                        creep.room.visual.circle(pathStep, {fill: 'red'});
                    }
                    }
                    if(
                        !isSwamp ||
                        (isSwamp && isPath)
                    ) {
                        creep.moveTo(path[0].x, path[0].y, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        }
        else {
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.store.getFreeCapacity() > 0) {
                if(creep.harvest(sources[creep.memory.currentSource]) == ERR_NOT_IN_RANGE) {
                    if(creep.moveTo(sources[creep.memory.currentSource],  {visualizePathStyle: {stroke: '#ffaa00'}}) == ERR_NO_PATH) {
                        creep.memory.currentSource++;
                        if(creep.memory.currentSource > sources.length -1 ) {
                            creep.memory.currentSource=0
                        }
                    }
                }
            }
        }
    }
};

module.exports = roleUpgrader;