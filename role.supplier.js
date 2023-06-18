


global.roleSupplier = {
    name: "supplier",
    roleMemory: { memory: {} },
    BodyParts: [WORK, CARRY, CARRY, MOVE, MOVE],
    
    
    run: function(creep) {
        //initialiastion
        if (creep.memory.supplying == undefined) {
            creep.memory.supplying = true;
        }
        
        if (creep.memory.supplying && creep.store.getUsedCapacity() == 0) {
            creep.memory.supplying = false;
        } else if (!creep.memory.supplying && creep.store.getFreeCapacity() == 0) {
            creep.memory.supplying = true;
        }
        
        if (creep.memory.supplying) {
            console.log("supplying")
            var spawns = creep.room.find(FIND_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } });
            if (creep.transfer(spawns[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawns[0]);
            }

        } else {
            console.log("!supplying")

            var sources = creep.room.find(FIND_SOURCES);
            var closestSource = creep.pos.findClosestByRange(sources);

            if (creep.harvest(closestSource) == ERR_NOT_IN_RANGE) {
                creep.moveTo(closestSource);
            }

        }
        
        
    }
}