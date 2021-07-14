var roleClaimer = {
    
    BodyParts: [CLAIM, MOVE],

    // 1 - UP
    // 3 - RIGHT
    // 5 - DOWN
    // 7 - LEFT

    /** @param {Creep} creep **/
    run: function(creep) {
        var sources = creep.room.find(FIND_SOURCES);
        if(creep.memory.direction == -1) {
            console.log(creep.name + " is awaiting direction")
        }
        else {
            // console.log(creep.memory.)
            creep.memory.DestSpawnName = Game.map.describeExits(creep.memory.HomeSpawnName)[creep.memory.direction]
            
            if(creep.room.name != creep.memory.DestSpawnName) {
                const route = Game.map.findRoute(creep.room, creep.memory.DestSpawnName);
                if(route.length > 0) {
                    creep.say('Headin oot');
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit, {visualizePathStyle: {stroke: '#ffffff'}} );
                }
                else {
                    creep.say('No route found');
                }
            }
            else if(creep.claimController(creep.room.controller) != OK) {
                console.log(creep.claimController(creep.room.controller));
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
};

module.exports = roleClaimer;